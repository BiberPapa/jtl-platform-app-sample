import { Card, CardContent } from '@jtl-software/platform-ui-react';
import { AppPageShell } from '../../components';

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
    <AppPageShell eyebrow={eyebrow} title={title} lead={lead}>
      <div className="app-section-grid">
        {sections.map(section => (
          <Card key={section.title}>
            <CardContent className="app-section-grid">
              <h2>{section.title}</h2>
              <p className="app-muted-text">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppPageShell>
  );
}

export default InfoPageLayout;
