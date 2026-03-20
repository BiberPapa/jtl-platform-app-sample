import * as React from 'react';

// Replace these imports with the actual components exported by your UI kit.
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@jtl-software/platform-ui-react';

type Customer = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
};

const mockRows: Customer[] = [
  { id: '1', name: 'Acme GmbH', email: 'team@acme.example', status: 'active' },
  { id: '2', name: 'Muster AG', email: 'office@muster.example', status: 'inactive' },
];

export function CustomerListPage(): React.JSX.Element {
  const [query, setQuery] = React.useState('');
  const [isLoading] = React.useState(false);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockRows;
    return mockRows.filter(row => row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer accounts and inspect their current status.</p>
        </div>

        <Button type="button">Create customer</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <label htmlFor="customer-search" className="mb-2 block text-sm font-medium">
              Search
            </label>
            <Input
              id="customer-search"
              value={query}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              placeholder="Search by name or email"
            />
          </div>

          {isLoading ? (
            <div className="text-sm">Loading customers…</div>
          ) : rows.length === 0 ? (
            <div className="rounded-md border p-6 text-sm">No customers found. Adjust the filter or create a new customer.</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{row.name}</td>
                      <td className="px-4 py-3">{row.email}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">
                        <Button type="button" variant="ghost">
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
