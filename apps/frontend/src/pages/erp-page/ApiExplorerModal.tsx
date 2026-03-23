import { Alert, Button } from '@jtl-software/platform-ui-react';
import { lazy, Suspense } from 'react';

type ApiExplorerModalProps = {
  mode: ApiExplorerMode;
  onClose: () => void;
};

export type ApiExplorerMode = 'graphql' | 'rest';

const GraphQlExplorerPanel = lazy(() => import('./GraphQlExplorerPanel'));
const RestExplorerPanel = lazy(() => import('./RestExplorerPanel'));

function ApiExplorerModal({ mode, onClose }: ApiExplorerModalProps) {
  const isGraphQlMode = mode === 'graphql';

  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="api-explorer-title">
      <div className="app-modal-panel app-modal-panel--api-explorer">
        <div className="app-modal-header">
          <div className="app-section-grid">
            <h2 id="api-explorer-title" className="app-modal-title">
              {isGraphQlMode ? 'GraphQL API Explorer' : 'REST API Explorer'}
            </h2>
            <p className="app-muted-text">
              {isGraphQlMode
                ? 'Browse the transformed GraphQL schema directly inside the ERP dashboard.'
                : 'Explore the backend-served OpenAPI document directly inside the ERP dashboard.'}
            </p>
          </div>
          <Button type="button" variant="outline" label="Close Explorer" onClick={onClose} />
        </div>
        <div className="app-modal-body app-modal-body--api-explorer">
          <Suspense fallback={<Alert title={`Loading ${isGraphQlMode ? 'GraphQL' : 'REST'} explorer...`} variant="info" closable={false} />}>
            {isGraphQlMode ? <GraphQlExplorerPanel /> : <RestExplorerPanel />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default ApiExplorerModal;
