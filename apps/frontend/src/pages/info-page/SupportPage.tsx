import InfoPageLayout from './InfoPageLayout';

function SupportPage() {
  return (
    <InfoPageLayout
      eyebrow="Support"
      title="Hilfe und Support"
      lead="Diese Beispielseite zeigt, wie du Support-Informationen innerhalb der App bereitstellen kannst."
      sections={[
        {
          title: 'Kontakt',
          body: 'Bei Fragen zur Demo-App erreichst du das Support-Team beispielhaft per E-Mail unter support@example.com oder werktags zwischen 9:00 und 17:00 Uhr.',
        },
        {
          title: 'Typische Anliegen',
          body: 'Support-Anfragen betreffen häufig die Einrichtung der App, die Verbindung zur JTL-Wawi sowie Rückfragen zu ERP- und Pane-Einstiegspunkten.',
        },
        {
          title: 'Nächste Schritte',
          body: 'Bitte halte für Rückfragen die betroffene Tenant-Umgebung, den Zeitpunkt des Fehlers und eine kurze Beschreibung des Problems bereit.',
        },
      ]}
    />
  );
}

export default SupportPage;
