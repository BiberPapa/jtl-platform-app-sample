type HelloWorldErpPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  details?: string;
};

function HelloWorldErpPage({ eyebrow, title, description, details }: HelloWorldErpPageProps) {
  return (
    <main className="app-shell">
      <section className="app-card page-stack" aria-labelledby="erp-page-title">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="erp-page-title">{title}</h1>
        <p>{description}</p>
        {details ? <pre className="value-box">{details}</pre> : null}
      </section>
    </main>
  );
}

export default HelloWorldErpPage;
