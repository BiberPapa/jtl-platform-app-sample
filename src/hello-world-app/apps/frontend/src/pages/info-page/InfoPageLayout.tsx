type InfoPageLayoutProps = {
  eyebrow: string;
  title: string;
  lead: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
};

function InfoPageLayout({ eyebrow, title, lead, sections }: InfoPageLayoutProps) {
  return (
    <main className="app-shell">
      <section className="app-card page-stack" aria-labelledby="info-page-title">
        <header className="page-stack">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="info-page-title">{title}</h1>
          <p className="setup-lead">{lead}</p>
        </header>
        <div className="info-sections">
          {sections.map(section => (
            <section key={section.title} className="info-section">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

export default InfoPageLayout;
