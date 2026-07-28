import { useRef } from 'react';
import Editor from '@monaco-editor/react';

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "'SF Mono', 'Fira Code', 'Source Code Pro', Menlo, Consolas, monospace",
  tabSize: 2,
  insertSpaces: true,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'on',
  quickSuggestions: true,
  suggestOnTriggerCharacters: true,
  tabCompletion: 'on',
  bracketPairColorization: { enabled: true },
  padding: { top: 12, bottom: 12 },
};

function registerChallengeCompletions(monaco) {
  if (monaco.__challengeCompletionsRegistered) return;
  monaco.__challengeCompletionsRegistered = true;

  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: [
          {
            label: 'resolvedPromises',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: 'resolvedPromises',
            detail: 'global array',
            documentation: 'Push resolved promise values to this array.',
            range,
          },
        ],
      };
    },
  });
}

export default function CodeEditor({ id, value, onChange, theme = 'light' }) {
  const registeredRef = useRef(false);

  function handleMount(_editor, monaco) {
    if (!registeredRef.current) {
      registerChallengeCompletions(monaco);
      registeredRef.current = true;
    }
  }

  return (
    <div className="coding-editor-wrap" id={id}>
      <Editor
        height="100%"
        language="javascript"
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? '')}
        options={EDITOR_OPTIONS}
        onMount={handleMount}
      />
    </div>
  );
}
