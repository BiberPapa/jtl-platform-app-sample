import InfoPageLayout from './InfoPageLayout';

function SupportPage() {
  return (
    <InfoPageLayout
      eyebrow="Support"
      title="Help and support"
      lead="This sample page shows how to provide support information within the app."
      sections={[
        {
          title: 'Contact',
          body: 'If you have questions about the demo app, you can reach the support team at support@example.com or on business days between 9:00 a.m. and 5:00 p.m.',
        },
        {
          title: 'Typical requests',
          body: 'Support requests often relate to app setup, the connection to JTL-Wawi, and questions about ERP and pane entry points.',
        },
        {
          title: 'Next steps',
          body: 'Please have the affected tenant environment, the time of the error, and a short description of the problem ready for any follow-up questions.',
        },
      ]}
    />
  );
}

export default SupportPage;
