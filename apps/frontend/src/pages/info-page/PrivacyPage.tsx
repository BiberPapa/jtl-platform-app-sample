import InfoPageLayout from './InfoPageLayout';

function PrivacyPage() {
  return (
    <InfoPageLayout
      eyebrow="Datenschutz"
      title="Datenschutzhinweise"
      lead="Diese kompakte Beispielseite beschreibt in vereinfachter Form, welche Daten in der Demo-App verarbeitet werden können."
      sections={[
        {
          title: 'Verarbeitete Daten',
          body: 'Im Rahmen der Demo können technische Sitzungsdaten, Tenant-Bezüge und angeforderte ERP-Daten verarbeitet werden, soweit dies für die Funktion der App erforderlich ist.',
        },
        {
          title: 'Zweck der Verarbeitung',
          body: 'Die Verarbeitung dient ausschließlich dazu, die App zu initialisieren, die Verbindung zur JTL-Wawi zu prüfen und Inhalte in den vorgesehenen App-Bereichen anzuzeigen.',
        },
        {
          title: 'Kontakt zum Datenschutz',
          body: 'Für datenschutzbezogene Rückfragen kann beispielhaft die Adresse privacy@example.com verwendet werden.',
        },
      ]}
    />
  );
}

export default PrivacyPage;
