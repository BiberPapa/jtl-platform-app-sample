import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

function SwaggerPage() {
  return (
    <main className="app-shell">
      <section className="app-card page-stack" aria-labelledby="erp-swagger-title" style={{ width: '100%', minHeight: 'calc(100vh - 8rem)' }}>
        <div className="page-stack">
          <p className="eyebrow">ERP Menu</p>
          <h1 id="erp-swagger-title">API Documentation</h1>
          <p>Interactive Swagger UI for the ERP OpenAPI document.</p>
        </div>
        <div style={{ width: '100%' }}>
          <SwaggerUI url="/erp/openapi.json" docExpansion="list" displayRequestDuration />
        </div>
      </section>
    </main>
  );
}

export default SwaggerPage;
