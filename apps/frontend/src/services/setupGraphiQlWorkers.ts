import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';
import GraphQlWorker from 'monaco-graphql/esm/graphql.worker.js?worker';

type MonacoEnvironmentWindow = typeof globalThis & {
  MonacoEnvironment?: {
    getWorker: (_workerId: string, label: string) => Worker;
  };
};

(globalThis as MonacoEnvironmentWindow).MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    switch (label) {
      case 'graphql':
        return new GraphQlWorker();
      case 'json':
        return new JsonWorker();
      default:
        return new EditorWorker();
    }
  },
};
