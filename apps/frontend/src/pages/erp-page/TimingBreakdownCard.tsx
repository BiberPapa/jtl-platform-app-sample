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

type TimingRule = {
  successUpperBound: number;
  warningUpperBound: number;
  successLabel: string;
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
      tone: infrastructureTone.status,
      detail: infrastructureTone.label,
    },
    {
      key: 'erp',
      label: 'ERP time',
      value: erpTimeMs,
      tone: erpTone.status,
      detail: erpTone.label,
    },
    {
      key: 'frontend',
      label: 'Frontend time',
      value: frontendTimeMs,
      tone: frontendTone.status,
      detail: frontendTone.label,
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
          <Badge label={overallTone.label} variant={getBadgeVariant(overallTone.status)} />
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
  tones: Array<{ status: TimingTone }>;
}): { status: TimingTone; label: string } {
  if (isLoading) {
    return { status: 'loading', label: 'Loading' };
  }

  if (totalTimeMs == null) {
    return { status: 'neutral', label: 'Unavailable' };
  }

  if (tones.some(tone => tone.status === 'error')) {
    return { status: 'error', label: 'Problematic' };
  }

  if (tones.some(tone => tone.status === 'warning')) {
    return { status: 'warning', label: 'Warning' };
  }

  return { status: 'success', label: 'Good' };
}

function getErpTimingStatus(durationMs: number | null, isLoading: boolean): { status: TimingTone; label: string } {
  return evaluateTiming(durationMs, isLoading, {
    successUpperBound: 10,
    warningUpperBound: 50,
    successLabel: 'Okay',
  });
}

function getInfrastructureTimingStatus(durationMs: number | null, isLoading: boolean): { status: TimingTone; label: string } {
  return evaluateTiming(durationMs, isLoading, {
    successUpperBound: 100,
    warningUpperBound: 250,
    successLabel: 'Good',
  });
}

function getFrontendTimingStatus(durationMs: number | null, isLoading: boolean): { status: TimingTone; label: string } {
  return evaluateTiming(durationMs, isLoading, {
    successUpperBound: 100,
    warningUpperBound: 250,
    successLabel: 'Good',
  });
}

function evaluateTiming(durationMs: number | null, isLoading: boolean, rule: TimingRule): { status: TimingTone; label: string } {
  if (isLoading) {
    return { status: 'loading', label: 'Loading' };
  }

  if (durationMs == null) {
    return { status: 'neutral', label: 'Unavailable' };
  }

  if (durationMs < rule.successUpperBound) {
    return { status: 'success', label: rule.successLabel };
  }

  if (durationMs <= rule.warningUpperBound) {
    return { status: 'warning', label: 'Warning' };
  }

  return { status: 'error', label: 'Problematic' };
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
