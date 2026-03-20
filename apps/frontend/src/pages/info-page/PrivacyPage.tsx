import InfoPageLayout from './InfoPageLayout';

function PrivacyPage() {
  return (
    <InfoPageLayout
      eyebrow="Privacy"
      title="Privacy notice"
      lead="This compact sample page explains in simplified form which data may be processed in the demo app."
      sections={[
        {
          title: 'Processed data',
          body: 'As part of the demo, technical session data, tenant references, and requested ERP data may be processed where required for the app to function.',
        },
        {
          title: 'Purpose of processing',
          body: 'Processing is carried out solely to initialize the app, check the connection to JTL-Wawi, and display content in the intended app areas.',
        },
        {
          title: 'Privacy contact',
          body: 'For privacy-related questions, the sample contact address privacy@example.com can be used.',
        },
      ]}
    />
  );
}

export default PrivacyPage;
