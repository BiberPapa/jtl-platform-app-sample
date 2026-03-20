import { Card, CardContent } from '@jtl-software/platform-ui-react';
import { AppPageShell } from '../../components';

type UnknownErpPageProps = { kind: 'erp-menu-item'; menuItemId: string } | { kind: 'erp-tab'; tabId: string };

function UnknownErpPage(props: UnknownErpPageProps) {
  const details = props.kind === 'erp-menu-item' ? `menuItemId: ${props.menuItemId}` : `tabId: ${props.tabId}`;

  return (
    <AppPageShell eyebrow="ERP" title="Unknown ERP page" lead="No sample page has been registered for this ERP target yet.">
      <Card>
        <CardContent>
          <pre className="app-code-block">{details}</pre>
        </CardContent>
      </Card>
    </AppPageShell>
  );
}

export default UnknownErpPage;
