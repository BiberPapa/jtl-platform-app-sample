type UnknownErpPageProps = { kind: 'erp-menu-item'; menuItemId: string } | { kind: 'erp-tab'; tabId: string };

function UnknownErpPage(props: UnknownErpPageProps) {
  const details = props.kind === 'erp-menu-item' ? `menuItemId: ${props.menuItemId}` : `tabId: ${props.tabId}`;

  return (
    <main className="app-shell">
      <section className="app-card page-stack" aria-labelledby="unknown-erp-page-title">
        <p className="eyebrow">ERP</p>
        <h1 id="unknown-erp-page-title">Unknown ERP page</h1>
        <p>No sample page has been registered for this ERP target yet.</p>
        <pre className="value-box">{details}</pre>
      </section>
    </main>
  );
}

export default UnknownErpPage;
