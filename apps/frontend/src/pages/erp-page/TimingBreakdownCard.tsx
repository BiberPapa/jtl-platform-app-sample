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
  key: 'infrastructure' | 'erp' | 'frontend';
  label: string;
  value: number | null;
  tone: TimingTone;
  detail: string | null;
};

function TimingBreakdownCard({ totalTimeMs, infrastructureTimeMs, erpTimeMs, frontendTimeMs, isLoading }: TimingBreakdownCardProps) {
  const infrastructureTone = getInfrastructureTimingStatus(infrastructureTimeMs, isLoading);
  const erpTone = getErpTimingStatus(erpTimeMs, isLoading);
  const frontendTone = getFrontendTimingStatus(frontendTimeMs, isLoading);
  const overallTone = getOverallTimingStatus({
    totalTimeMs,
    isLoading,
    tones: [infrastructureTone, erpTone, frontendTone],
  });

  const items: TimingItem[] = [
    {
      key: 'infrastructure',
      label: 'Infrastructure time',
      value: infrastructureTimeMs,
      tone: infrastructureTone,
      detail: getInfrastructureTimingLabel(infrastructureTimeMs, isLoading),
    },
    {
      key: 'erp',
      label: 'ERP time',
      value: erpTimeMs,
      tone: erpTone,
      detail: getErpTimingLabel(erpTimeMs, isLoading),
    },
    {
      key: 'frontend',
      label: 'Frontend time',
      value: frontendTimeMs,
      tone: frontendTone,
      detail: getFrontendTimingLabel(frontendTimeMs, isLoading),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timing</CardTitle>
      </CardHeader>
      <CardContent className="app-section-grid">
        <div className="app-metric-item">
          <div className="app-metric-copy">
            <p className="app-metric-label">Total time</p>
            <p className="app-metric-value">{formatDuration(totalTimeMs, isLoading)}</p>
          </div>
          <Badge label={getOverallTimingLabel(overallTone)} variant={getBadgeVariant(overallTone)} />
        </div>
        <details>
          <summary className="app-link">Show timing details</summary>
          <div className="app-section-grid" style={{ marginTop: '0.75rem' }}>
            {items.map(item => (
              <div key={item.key} className="app-metric-item">
                <div className="app-metric-copy">
                  <p className="app-metric-label">{item.label}</p>
                  <p className="app-metric-value">{formatDuration(item.value, isLoading)}</p>
                </div>
                {item.detail ? <Badge label={item.detail} variant={getBadgeVariant(item.tone)} /> : null}
              </div>
            ))}
          </div>
        </details>
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

  return `${Math.round(durationMs)} ms`;
}

function getOverallTimingStatus({
  totalTimeMs,
  isLoading,
  tones,
}: {
  totalTimeMs: number | null;
  isLoading: boolean;
  tones: TimingTone[];
}): TimingTone {
  if (isLoading) {
    return 'loading';
  }

  if (totalTimeMs == null) {
    return 'neutral';
  }

  if (tones.includes('error')) {
    return 'error';
  }

  if (tones.includes('warning')) {
    return 'warning';
  }

  return 'success';
}

function getOverallTimingLabel(tone: TimingTone): string {
  if (tone === 'loading') {
    return 'Loading';
  }

  if (tone === 'success') {
    return 'Good';
  }

  if (tone === 'warning') {
    return 'Warning';
  }

  if (tone === 'error') {
    return 'Problematic';
  }

  return 'Unavailable';
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
