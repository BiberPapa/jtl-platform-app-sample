import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@jtl-software/platform-ui-react';

type AppPageShellProps = {
  eyebrow?: string | undefined;
  title: string;
  lead?: string | undefined;
  children: ReactNode;
  actions?: ReactNode | undefined;
  width?: 'compact' | 'default' | 'wide';
};

function AppPageShell({ eyebrow, title, lead, children, actions, width = 'default' }: AppPageShellProps) {
  return (
    <main className="app-page-shell">
      <div className={`app-page-shell__container app-page-shell__container--${width}`}>
        <Card className="app-page-card">
          <CardHeader className="app-page-header">
            <div className="app-page-header__row">
              <div className="app-page-header__copy">
                {eyebrow ? <p className="app-page-eyebrow">{eyebrow}</p> : null}
                <h1 className="app-page-title">{title}</h1>
                {lead ? <p className="app-page-lead">{lead}</p> : null}
              </div>
              {actions ? <div className="app-page-actions">{actions}</div> : null}
            </div>
          </CardHeader>
          <CardContent className="app-page-content">{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}

export default AppPageShell;
