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
    <article className="dashboard-metric dashboard-metric--timing">
      <div className="dashboard-metric-timing-header">
        <span className="dashboard-metric-label">Timing breakdown</span>
      </div>
      <div className="dashboard-timing-list">
        {items.map(item => (
          <div key={item.key} className="dashboard-timing-item">
            <div className="dashboard-timing-icon" data-tone={item.tone} aria-hidden="true">
              {renderTimingIcon(item.key)}
            </div>
            <div className="dashboard-timing-copy">
              <span className="dashboard-timing-label">{item.label}</span>
              <strong className="dashboard-metric-value" data-status={item.tone}>
                {formatDuration(item.value, isLoading)}
              </strong>
            </div>
            {item.detail ? (
              <span className="dashboard-metric-status" data-status={item.tone}>
                {item.detail}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}

function renderTimingIcon(key: TimingItem['key']) {
  if (key === 'total') {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (key === 'infrastructure') {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <rect x="4.5" y="5.5" width="15" height="4.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <rect x="4.5" y="13.5" width="15" height="4.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 8h.01M8 16h.01" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (key === 'erp') {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M6 7.5h12v9H6z" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 10.5h6M9 13.5h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M5.5 12a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 5.5v13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.5 16.5h7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
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

export default TimingBreakdownCard;
