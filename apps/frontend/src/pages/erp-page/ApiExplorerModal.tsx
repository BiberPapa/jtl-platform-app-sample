import { Button } from '@jtl-software/platform-ui-react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { buildBackendUrl } from '../../services/apiClient';

type ApiExplorerModalProps = {
  onClose: () => void;
};

function ApiExplorerModal({ onClose }: ApiExplorerModalProps) {
  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="api-explorer-title">
      <div className="app-modal-panel app-modal-panel--api-explorer">
        <div className="app-modal-header">
          <div className="app-section-grid">
            <h2 id="api-explorer-title" className="app-modal-title">
              API Explorer
            </h2>
            <p className="app-muted-text">Explore the backend-served OpenAPI document directly inside the ERP dashboard.</p>
          </div>
          <Button type="button" variant="outline" label="Close Explorer" onClick={onClose} />
        </div>
        <div className="app-modal-body app-modal-body--api-explorer">
          <SwaggerUI url={buildBackendUrl('/openapi.json')} />
        </div>
      </div>
    </div>
  );
}

export default ApiExplorerModal;
