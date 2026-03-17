function HubPage() {
  return (
    <main className="app-shell">
      <section className="app-card page-stack" aria-labelledby="hub-page-title">
        <p className="eyebrow">Hub</p>
        <h1 id="hub-page-title">Cloud App Launcher</h1>
        <p>This is the App Launcher entry point defined in the manifest for the hub capability.</p>
        <p>Use this page as the central landing page when the app is opened from the hub integration.</p>
      </section>
    </main>
  );
}

export default HubPage;
