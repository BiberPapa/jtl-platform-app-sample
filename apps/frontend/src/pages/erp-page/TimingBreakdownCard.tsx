import { Badge, Card, CardContent, CardHeader, CardTitle } from '@jtl-software/platform-ui-react';

type TimingTone = 'loading' | 'success' | 'warning' | 'error' | 'neutral';

type TimingBreakdownCardProps = {
  totalTimeMs: number | null;
  infrastructureTimeMs: number | null;
  erpTimeMs: number | null;
  frontendTimeMs: number | null;
  isLoading: boolean;
};

type TimingItem = {
  key: 'total' | 'infrastructure' | 'erp' | 'frontend';
  label: string;
  value: number | null;
  tone: TimingTone;
  detail: string | null;
};

function TimingBreakdownCard({ totalTimeMs, infrastructureTimeMs, erpTimeMs, frontendTimeMs, isLoading }: TimingBreakdownCardProps) {
  const items: TimingItem[] = [
    {
      key: 'total',
      label: 'Total time',
      value: totalTimeMs,
      tone: isLoading ? 'loading' : totalTimeMs == null ? 'neutral' : 'success',
      detail: null,
    },
    {
      key: 'infrastructure',
      label: 'Infrastructure time',
      value: infrastructureTimeMs,
      tone: getInfrastructureTimingStatus(infrastructureTimeMs, isLoading),
      detail: getInfrastructureTimingLabel(infrastructureTimeMs, isLoading),
    },
    {
      key: 'erp',
      label: 'ERP time',
      value: erpTimeMs,
      tone: getErpTimingStatus(erpTimeMs, isLoading),
      detail: getErpTimingLabel(erpTimeMs, isLoading),
    },
    {
      key: 'frontend',
      label: 'Frontend time',
      value: frontendTimeMs,
      tone: getFrontendTimingStatus(frontendTimeMs, isLoading),
      detail: getFrontendTimingLabel(frontendTimeMs, isLoading),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timing breakdown</CardTitle>
      </CardHeader>
      <CardContent className="app-section-grid">
        {items.map(item => (
          <div key={item.key} className="app-metric-item">
            <div className="app-metric-copy">
              <p className="app-metric-label">{item.label}</p>
              <p className="app-metric-value">{formatDuration(item.value, isLoading)}</p>
            </div>
            {item.detail ? <Badge label={item.detail} variant={getBadgeVariant(item.tone)} /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatDuration(durationMs: number | null, isLoading: boolean): string {
  if (isLoading) {
    return 'Loading...';
  }

  if (durationMs == null) {
    return 'Unavailable';
  }

  return `${durationMs} ms`;
}

function getErpTimingStatus(durationMs: number | null, isLoading: boolean): TimingTone {
  if (isLoading) {
    return 'loading';
  }

  if (durationMs == null) {
    return 'neutral';
  }

  if (durationMs < 10) {
    return 'success';
  }

  if (durationMs <= 50) {
    return 'warning';
  }

  return 'error';
}

function getErpTimingLabel(durationMs: number | null, isLoading: boolean): string {
  const status = getErpTimingStatus(durationMs, isLoading);

  if (status === 'loading') {
    return 'Loading';
  }

  if (status === 'success') {
    return 'Okay';
  }

  if (status === 'warning') {
    return 'Warning';
  }

  if (status === 'error') {
    return 'Problematic';
  }

  return 'Unavailable';
}

function getInfrastructureTimingStatus(durationMs: number | null, isLoading: boolean): TimingTone {
  if (isLoading) {
    return 'loading';
  }

  if (durationMs == null) {
    return 'neutral';
  }

  if (durationMs < 100) {
    return 'success';
  }

  if (durationMs <= 250) {
    return 'warning';
  }

  return 'error';
}

function getInfrastructureTimingLabel(durationMs: number | null, isLoading: boolean): string {
  const status = getInfrastructureTimingStatus(durationMs, isLoading);

  if (status === 'loading') {
    return 'Loading';
  }

  if (status === 'success') {
    return 'Good';
  }

  if (status === 'warning') {
    return 'Warning';
  }

  if (status === 'error') {
    return 'Problematic';
  }

  return 'Unavailable';
}

function getFrontendTimingStatus(durationMs: number | null, isLoading: boolean): TimingTone {
  if (isLoading) {
    return 'loading';
  }

  if (durationMs == null) {
    return 'neutral';
  }

  if (durationMs < 100) {
    return 'success';
  }

  if (durationMs <= 250) {
    return 'warning';
  }

  return 'error';
}

function getFrontendTimingLabel(durationMs: number | null, isLoading: boolean): string {
  const status = getFrontendTimingStatus(durationMs, isLoading);

  if (status === 'loading') {
    return 'Loading';
  }

  if (status === 'success') {
    return 'Good';
  }

  if (status === 'warning') {
    return 'Warning';
  }

  if (status === 'error') {
    return 'Problematic';
  }

  return 'Unavailable';
}

function getBadgeVariant(tone: TimingTone): 'default' | 'success' | 'warning' | 'destructive' {
  if (tone === 'success') {
    return 'success';
  }

  if (tone === 'warning') {
    return 'warning';
  }

  if (tone === 'error') {
    return 'destructive';
  }

  return 'default';
}

export default TimingBreakdownCard;
