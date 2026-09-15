import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Serve `api/*` during `pnpm dev`.
 *
 * In production Vercel turns the `api/` directory into serverless functions.
 * Vite does not, so without this the Define/Explain fetch falls through to the
 * SPA and comes back as HTML. Rather than make people run `vercel dev` for one
 * route, this mounts the same handler on the dev server — the code path is
 * identical in both places, which is the point.
 *
 * The key is read here, in the Node process that runs the config, and passed
 * to the handler through `process.env`. It never enters the client bundle:
 * this file is build tooling, not application code.
 */
function apiRoutes(env) {
  return {
    name: 'local-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (!path.startsWith('/api/')) return next();

        const name = path.slice('/api/'.length).replace(/[^a-z0-9-]/gi, '');
        let handler;
        try {
          // Loaded per request so edits to the handler apply without a restart.
          ({ default: handler } = await server.ssrLoadModule(`/api/${name}.js`));
        } catch {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `No API route named "${name}".` }));
          return;
        }

        // Dev-only ergonomics: the production handler just says the key is
        // unset, which is no help when the real cause is a typo in the var
        // name or a dev server started before .env.local was edited. Names
        // only — never echo a value.
        if (!process.env.GROQ_API_KEY) {
          const seen = Object.keys(env).filter((k) => /GROQ/i.test(k));
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: seen.length
                ? `GROQ_API_KEY is empty. .env.local defines: ${seen.join(', ')}.`
                : 'No GROQ_* var found in .env.local. Add GROQ_API_KEY=... and restart `pnpm dev`.',
            })
          );
          return;
        }

        const body = await readJsonBody(req);

        // The handler is written against Vercel's req/res, which is Node's
        // http objects plus `status()` and `json()`. Shim just those two.
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (payload) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
          return res;
        };

        try {
          await handler({ ...req, method: req.method, body }, res);
        } catch (err) {
          if (!res.writableEnded) {
            res.status(500).json({ error: err?.message ?? 'Handler threw.' });
          }
        }
      });
    },
    config() {
      // Make the non-VITE_ vars from .env.local visible to the handler.
      for (const key of ['GROQ_API_KEY', 'GROQ_MODEL']) {
        if (env[key]) process.env[key] = env[key];
      }
    },
  };
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default defineConfig(({ mode }) => {
  // '' as the prefix loads every var, not just VITE_ ones.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), apiRoutes(env)],
    server: { port: 3333 },
    optimizeDeps: {
      include: ['monaco-editor'],
    },
  };
});
