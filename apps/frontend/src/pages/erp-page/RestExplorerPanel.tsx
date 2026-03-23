import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { buildBackendUrl } from '../../services/apiClient';

function RestExplorerPanel() {
  return <SwaggerUI url={buildBackendUrl('/openapi.json')} />;
}

export default RestExplorerPanel;
