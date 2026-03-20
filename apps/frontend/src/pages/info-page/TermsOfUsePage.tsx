import InfoPageLayout from './InfoPageLayout';

function TermsOfUsePage() {
  return (
    <InfoPageLayout
      eyebrow="Nutzungsbedingungen"
      title="Allgemeine Nutzungsbedingungen"
      lead="Diese Beispielseite veranschaulicht, wie Nutzungsbedingungen in einer kompakten App-Ansicht verlinkt werden können."
      sections={[
        {
          title: 'Nutzung der Anwendung',
          body: 'Die Demo-App darf ausschließlich für Test-, Evaluierungs- und Demonstrationszwecke verwendet werden. Ein produktiver Einsatz ist nur mit angepassten Inhalten und Prozessen vorgesehen.',
        },
        {
          title: 'Haftung',
          body: 'Die bereitgestellten Inhalte dienen als Beispiel und erfolgen ohne Gewähr für Vollständigkeit, Verfügbarkeit oder rechtliche Belastbarkeit.',
        },
        {
          title: 'Änderungen',
          body: 'Funktionalität, Texte und Beispielinhalte können jederzeit angepasst, erweitert oder entfernt werden, wenn dies für die Weiterentwicklung der App erforderlich ist.',
        },
      ]}
    />
  );
}

export default TermsOfUsePage;
