import { Alert, Button, Card, CardContent, CardHeader, CardTitle } from '@jtl-software/platform-ui-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { AppPageShell } from '../../components';
import { toAppError } from '../../services/appError';
import { useAppBridgeClient } from '../../services/appBridgeContext';
import { useAppErrors } from '../../services/appErrorContext';
import { loadErpDashboard, type DashboardMonthPoint, type DashboardTopSellerRow, type ErpDashboardData } from './erpDashboardService';

const CURRENCY_FORMATTER = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const DECIMAL_FORMATTER = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 0,
});

function ErpDashboardPage() {
  const appBridgeClient = useAppBridgeClient();
  const { reportError } = useAppErrors();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<ErpDashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setDashboardData(await loadErpDashboard(appBridgeClient));
    } catch (error) {
      const appError = toAppError(error, {
        source: 'graphql',
        requestPath: '/graphql',
        fallbackMessage: 'Die Dashboard-Daten konnten nicht geladen werden.',
      });
      setDashboardData(null);
      setErrorMessage(appError.details.userMessage);
      reportError(appError);
    } finally {
      setIsLoading(false);
    }
  }, [appBridgeClient, reportError]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <AppPageShell
      eyebrow="ERP"
      title="Dashboard"
      lead="Live-Kennzahlen aus dem ERP-System, geladen uber GraphQL."
      actions={
        <Button
          type="button"
          variant="outline"
          size="icon"
          icon="RefreshCw"
          aria-label="Refresh dashboard"
          isLoading={isLoading}
          onClick={() => void loadDashboard()}
          disabled={isLoading}
        />
      }
      width="wide"
    >
      <div className="app-section-grid" aria-live="polite">
        {isLoading ? <Alert title="Lade Dashboard-Daten..." variant="info" closable={false} /> : null}
        {errorMessage ? (
          <Alert title="Dashboard-Daten konnten nicht geladen werden" description={errorMessage} variant="destructive" closable={false} />
        ) : null}
        {!isLoading && !errorMessage && dashboardData?.isEmpty ? (
          <Alert
            title="Keine ERP-Daten verfugbar"
            description="Fur den gewahlten Zeitraum wurden keine passenden Verkaufs- oder Lagerdaten gefunden."
            variant="info"
            closable={false}
          />
        ) : null}
      </div>
      <section className="erp-dashboard__grid" aria-label="ERP Dashboard content">
        <div className="erp-dashboard__metric-grid">
          <DashboardMetricCard
            title="Umsatz aktuell"
            value={dashboardData ? CURRENCY_FORMATTER.format(dashboardData.summary.currentRevenue) : null}
            chipLabel={formatRevenueChangeLabel(dashboardData?.summary.revenueChangePct ?? null)}
            chipTone={getRevenueChipTone(dashboardData?.summary.revenueChangePct ?? null)}
            accent="green"
            iconLabel="EUR"
            isLoading={isLoading}
          />
          <DashboardMetricCard
            title="Gewinn"
            value={dashboardData ? CURRENCY_FORMATTER.format(dashboardData.summary.profitPotential) : null}
            chipLabel={formatProfitMarginLabel(dashboardData?.summary.profitMarginPct ?? null)}
            chipTone="rose"
            accent="rose"
            iconLabel="P"
            isLoading={isLoading}
            disabled
          />
          <DashboardMetricCard
            title="Offene Auftrage"
            value={dashboardData ? DECIMAL_FORMATTER.format(dashboardData.summary.openOrders) : null}
            chipLabel={dashboardData ? `${DECIMAL_FORMATTER.format(dashboardData.summary.urgentOrders)} Dringend` : null}
            chipTone="amber"
            accent="amber"
            iconLabel="O"
            isLoading={isLoading}
            disabled
          />
          <DashboardMetricCard
            title="Lagerwert Gesamt"
            value={dashboardData ? CURRENCY_FORMATTER.format(dashboardData.summary.warehouseValue) : null}
            chipLabel={dashboardData ? `${DECIMAL_FORMATTER.format(dashboardData.summary.articleCount)} Artikel` : null}
            chipTone="blue"
            accent="blue"
            iconLabel="L"
            isLoading={isLoading}
            disabled
          />
        </div>
        <div className="erp-dashboard__detail-grid">
          <RevenueChartCard data={dashboardData?.revenueTrend ?? []} isLoading={isLoading} disabled />
          <TopSellerCard data={dashboardData} isLoading={isLoading} disabled />
        </div>
      </section>
    </AppPageShell>
  );
}

type DashboardMetricCardProps = {
  title: string;
  value: string | null;
  chipLabel: string | null;
  chipTone: 'green' | 'rose' | 'amber' | 'blue';
  accent: 'green' | 'rose' | 'amber' | 'blue';
  iconLabel: string;
  isLoading: boolean;
  disabled?: boolean;
};

function DashboardMetricCard({ title, value, chipLabel, chipTone, accent, iconLabel, isLoading, disabled = false }: DashboardMetricCardProps) {
  return (
    <Card className={`erp-dashboard__metric-card erp-dashboard__metric-card--${accent}${disabled ? ' erp-dashboard__metric-card--disabled' : ''}`}>
      <CardContent className="erp-dashboard__metric-content">
        <div className="erp-dashboard__metric-bg" aria-hidden="true" />
        <div className="erp-dashboard__metric-head">
          <p className="erp-dashboard__metric-title">{title}</p>
          <span className={`erp-dashboard__metric-icon erp-dashboard__metric-icon--${accent}`}>{iconLabel}</span>
        </div>
        {disabled ? (
          <>
            <p className="erp-dashboard__metric-value erp-dashboard__metric-value--disabled">Vorubergehend deaktiviert</p>
            <span className="erp-dashboard__chip erp-dashboard__chip--disabled">Folgt spater</span>
          </>
        ) : isLoading ? (
          <div className="erp-dashboard__placeholder-group" aria-hidden="true">
            <span className="erp-dashboard__placeholder erp-dashboard__placeholder--value" />
            <span className="erp-dashboard__placeholder erp-dashboard__placeholder--chip" />
          </div>
        ) : (
          <>
            <p className="erp-dashboard__metric-value">{value ?? '-'}</p>
            {chipLabel ? <span className={`erp-dashboard__chip erp-dashboard__chip--${chipTone}`}>{chipLabel}</span> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueChartCard({ data, isLoading, disabled = false }: { data: DashboardMonthPoint[]; isLoading: boolean; disabled?: boolean }) {
  return (
    <Card className={`erp-dashboard__panel erp-dashboard__panel--chart${disabled ? ' erp-dashboard__panel--disabled' : ''}`}>
      <CardHeader>
        <div className="erp-dashboard__panel-heading">
          <div>
            <CardTitle>Umsatzentwicklung</CardTitle>
            <p className="app-muted-text">Umsatz der letzten 6 Monate</p>
          </div>
          <span className="erp-dashboard__panel-icon" aria-hidden="true">
            EUR
          </span>
        </div>
      </CardHeader>
      <CardContent className="erp-dashboard__panel-content">
        {disabled ? (
          <div className="erp-dashboard__disabled-panel-copy">
            <p className="erp-dashboard__metric-value erp-dashboard__metric-value--disabled">Vorubergehend deaktiviert</p>
            <span className="erp-dashboard__chip erp-dashboard__chip--disabled">Keine GraphQL-Abfrage aktiv</span>
          </div>
        ) : isLoading ? (
          <div className="erp-dashboard__chart-skeleton" aria-hidden="true">
            <span className="erp-dashboard__placeholder erp-dashboard__placeholder--chart-toggle" />
            <span className="erp-dashboard__placeholder erp-dashboard__placeholder--chart" />
          </div>
        ) : (
          <>
            <div className="erp-dashboard__chart-toggle" aria-hidden="true">
              <span className="erp-dashboard__chart-toggle-pill erp-dashboard__chart-toggle-pill--active">Letzten 6 Monate</span>
              <span className="erp-dashboard__chart-toggle-pill">Ganzes Jahr</span>
            </div>
            <RevenueLineChart data={data} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueLineChart({ data }: { data: DashboardMonthPoint[] }) {
  const chartId = useId();
  const width = 640;
  const height = 260;
  const paddingX = 28;
  const paddingTop = 20;
  const paddingBottom = 42;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;
  const maxRevenue = Math.max(...data.map(point => point.revenue), 0);
  const safeMaxRevenue = maxRevenue > 0 ? maxRevenue : 1;
  const points = data.map((point, index) => {
    const x = paddingX + (data.length > 1 ? (innerWidth / (data.length - 1)) * index : innerWidth / 2);
    const y = paddingTop + innerHeight - (point.revenue / safeMaxRevenue) * innerHeight;

    return {
      ...point,
      x,
      y,
    };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]?.x ?? paddingX} ${paddingTop + innerHeight} L ${points[0]?.x ?? paddingX} ${paddingTop + innerHeight} Z`
      : '';
  const gridLines = Array.from({ length: 4 }, (_, index) => paddingTop + (innerHeight / 3) * index);

  return (
    <figure className="erp-dashboard__chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="erp-dashboard__chart-svg" role="img" aria-labelledby={`${chartId}-title`}>
        <title id={`${chartId}-title`}>Umsatzentwicklung der letzten 6 Monate</title>
        <defs>
          <linearGradient id={`${chartId}-fill`} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(99, 132, 255, 0.24)" />
            <stop offset="100%" stopColor="rgba(99, 132, 255, 0)" />
          </linearGradient>
        </defs>
        {gridLines.map(lineY => (
          <line key={lineY} x1={paddingX} x2={width - paddingX} y1={lineY} y2={lineY} className="erp-dashboard__chart-grid" />
        ))}
        {areaPath ? <path d={areaPath} fill={`url(#${chartId}-fill)`} /> : null}
        {linePath ? <path d={linePath} className="erp-dashboard__chart-line" /> : null}
        {points.map(point => (
          <g key={point.monthKey}>
            <circle cx={point.x} cy={point.y} r="4" className="erp-dashboard__chart-point" />
            <text x={point.x} y={height - 14} textAnchor="middle" className="erp-dashboard__chart-label">
              {point.monthLabel}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="erp-dashboard__chart-legend">Umsatz</figcaption>
    </figure>
  );
}

function TopSellerCard({ data, isLoading, disabled = false }: { data: ErpDashboardData | null; isLoading: boolean; disabled?: boolean }) {
  return (
    <Card className={`erp-dashboard__panel erp-dashboard__panel--list${disabled ? ' erp-dashboard__panel--disabled' : ''}`}>
      <CardHeader>
        <div className="erp-dashboard__panel-heading">
          <div>
            <CardTitle>Bestand an Top-Sellern</CardTitle>
            <p className="app-muted-text">
              {data
                ? `${DECIMAL_FORMATTER.format(data.summary.topSellerCriticalCount)} von ${DECIMAL_FORMATTER.format(data.summary.topSellerCount)} Top-Sellern haben einen kritischen Lagerbestand`
                : 'Lagerstatus der wichtigsten Produkte'}
            </p>
          </div>
          <span className="erp-dashboard__panel-icon" aria-hidden="true">
            BOX
          </span>
        </div>
      </CardHeader>
      <CardContent className="erp-dashboard__panel-content erp-dashboard__panel-content--list">
        {disabled ? (
          <div className="erp-dashboard__disabled-panel-copy">
            <p className="erp-dashboard__metric-value erp-dashboard__metric-value--disabled">Vorubergehend deaktiviert</p>
            <span className="erp-dashboard__chip erp-dashboard__chip--disabled">Keine GraphQL-Abfrage aktiv</span>
          </div>
        ) : isLoading ? (
          <div className="erp-dashboard__list-skeleton" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="erp-dashboard__list-skeleton-row">
                <span className="erp-dashboard__placeholder erp-dashboard__placeholder--row-title" />
                <span className="erp-dashboard__placeholder erp-dashboard__placeholder--row-meta" />
              </div>
            ))}
          </div>
        ) : data?.topSellers.length ? (
          <div className="erp-dashboard__seller-list">
            {data.topSellers.map(item => (
              <TopSellerRow key={item.name} item={item} />
            ))}
          </div>
        ) : (
          <p className="app-muted-text">Keine Top-Seller-Daten verfugbar.</p>
        )}
      </CardContent>
    </Card>
  );
}

function TopSellerRow({ item }: { item: DashboardTopSellerRow }) {
  return (
    <article className="erp-dashboard__seller-row">
      <div className="erp-dashboard__seller-copy">
        <h3 className="erp-dashboard__seller-title">{item.name}</h3>
        <p className="erp-dashboard__seller-meta">
          Bestand: {DECIMAL_FORMATTER.format(item.stockAvailable)}
          {item.isCritical ? <span className="erp-dashboard__chip erp-dashboard__chip--rose">Kritisch</span> : null}
        </p>
      </div>
      <div className="erp-dashboard__stock-bar" aria-hidden="true">
        <span
          className="erp-dashboard__stock-bar-fill"
          style={{ width: `${Math.max(item.progressRatio * 100, item.stockAvailable > 0 ? 8 : 0)}%` }}
        />
      </div>
    </article>
  );
}

function formatRevenueChangeLabel(value: number | null): string | null {
  if (value == null) {
    return 'Kein Vergleichswert';
  }

  const formattedValue = new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(value);

  return `${formattedValue}% zum Vormonat`;
}

function formatProfitMarginLabel(value: number | null): string | null {
  if (value == null) {
    return 'Keine Marge verfugbar';
  }

  const formattedValue = new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 1,
  }).format(value);

  return `${formattedValue}% Marge`;
}

function getRevenueChipTone(value: number | null): 'green' | 'rose' {
  return value != null && value < 0 ? 'rose' : 'green';
}

export default ErpDashboardPage;
