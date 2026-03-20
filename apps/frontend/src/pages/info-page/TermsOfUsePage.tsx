import InfoPageLayout from './InfoPageLayout';

function TermsOfUsePage() {
  return (
    <InfoPageLayout
      eyebrow="Terms and conditions"
      title="General terms and conditions"
      lead="This sample page illustrates how terms and conditions can be linked in a compact app view."
      sections={[
        {
          title: 'Use of the application',
          body: 'The demo app may only be used for testing, evaluation, and demonstration purposes. Productive use is only intended with adapted content and processes.',
        },
        {
          title: 'Liability',
          body: 'The provided content serves as an example and is supplied without any guarantee of completeness, availability, or legal reliability.',
        },
        {
          title: 'Changes',
          body: 'Functionality, texts, and sample content may be adjusted, expanded, or removed at any time if required for the further development of the app.',
        },
      ]}
    />
  );
}

export default TermsOfUsePage;
