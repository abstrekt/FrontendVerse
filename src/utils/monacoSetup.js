import EditorWorker from '../workers/editor.worker.js?worker';
import TsWorker from '../workers/ts.worker.js?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};
