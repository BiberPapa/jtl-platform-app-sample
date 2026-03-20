import { Card, CardContent } from '@jtl-software/platform-ui-react';
import { AppPageShell } from '../../components';

function HubPage() {
  return (
    <AppPageShell
      eyebrow="Hub"
      title="Cloud App Launcher"
      lead="This is the App Launcher entry point defined in the manifest for the hub capability."
    >
      <Card>
        <CardContent>
          <p className="app-muted-text">Use this page as the central landing page when the app is opened from the hub integration.</p>
        </CardContent>
      </Card>
    </AppPageShell>
  );
}

export default HubPage;
