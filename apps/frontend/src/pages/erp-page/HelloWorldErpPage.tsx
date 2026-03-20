import type { ReactNode } from 'react';
import { AppPageShell } from '../../components';

type HelloWorldErpPageProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  details?: string;
  content?: ReactNode;
  actions?: ReactNode;
  width?: 'compact' | 'default' | 'wide';
};

function HelloWorldErpPage({ eyebrow, title, description, details, content, actions, width = 'wide' }: HelloWorldErpPageProps) {
  return (
    <AppPageShell eyebrow={eyebrow} title={title} lead={description} actions={actions} width={width}>
      {details ? <pre className="app-code-block">{details}</pre> : null}
      {content}
    </AppPageShell>
  );
}

export default HelloWorldErpPage;
