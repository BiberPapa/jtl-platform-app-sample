import * as React from 'react';

// Replace these imports with the actual components exported by your UI kit.
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@jtl-software/platform-ui-react';

type CustomerFormValues = {
  name: string;
  email: string;
};

export function CustomerDetailForm(): React.JSX.Element {
  const [values, setValues] = React.useState<CustomerFormValues>({
    name: '',
    email: '',
  });
  const [errors, setErrors] = React.useState<Partial<CustomerFormValues>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  function updateField<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]): void {
    setValues(current => ({ ...current, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors: Partial<CustomerFormValues> = {};

    if (!values.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!validate()) return;

    setIsSaving(true);
    try {
      await Promise.resolve();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit customer</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="customer-name" className="block text-sm font-medium">
                Name
              </label>
              <Input
                id="customer-name"
                value={values.name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('name', event.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Enter the customer display name.</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="customer-email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="customer-email"
                type="email"
                value={values.email}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('email', event.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email}</p>
              ) : (
                <p className="text-sm text-muted-foreground">This address is used for customer communication.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
