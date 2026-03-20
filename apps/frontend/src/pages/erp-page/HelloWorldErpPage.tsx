import type { ReactNode } from 'react';

type HelloWorldErpPageProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  details?: string;
  content?: ReactNode;
  cardClassName?: string;
};

function HelloWorldErpPage({ eyebrow, title, description, details, content, cardClassName }: HelloWorldErpPageProps) {
  return (
    <main className="app-shell">
      <section className={`app-card page-stack${cardClassName ? ` ${cardClassName}` : ''}`} aria-labelledby={title ? 'erp-page-title' : undefined}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h1 id="erp-page-title">{title}</h1> : null}
        {description ? <p>{description}</p> : null}
        {details ? <pre className="value-box">{details}</pre> : null}
        {content}
      </section>
    </main>
  );
}

export default HelloWorldErpPage;
