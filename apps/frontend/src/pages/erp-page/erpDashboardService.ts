import type { AppBridgeClient } from '../../services/appBridgeClient';
import { createUnexpectedAppError } from '../../services/appError';
import { requestGraphQlOperation } from '../../services/graphQlSchemaService';

const SALES_ORDERS_QUERY = `
  query DashboardSalesOrders($from: DateTime!, $to: DateTime!, $first: Int!) {
      QuerySalesOrders(first: $first, where: {salesOrderDate: {lte: $to, gte: $from}})
      {
        nodes {
          salesOrderDate
          totalGrossAmount
          salesInvoiceStatus
        }
      }
  }
`;

const DASHBOARD_MONTH_COUNT = 6;
const SALES_ORDERS_FETCH_LIMIT = 500;
const URGENT_ORDER_AGE_DAYS = 7;
const DEFAULT_CRITICAL_STOCK_THRESHOLD = 10;

type SalesInvoiceStatus = string;

export type DashboardSalesOrder = {
  salesOrderDate: string;
  totalGrossAmount: number;
  salesInvoiceStatus: SalesInvoiceStatus;
};

export type DashboardInventoryItem = {
  name: string;
  stockAvailable: number;
  minimumStock: number | null;
  averagePurchasePriceNet: number;
  profit: number;
  isTopItem: boolean;
};

export type DashboardMonthPoint = {
  monthKey: string;
  monthLabel: string;
  revenue: number;
};

export type DashboardTopSellerRow = {
  name: string;
  stockAvailable: number;
  minimumStock: number | null;
  progressRatio: number;
  isCritical: boolean;
};

export type DashboardSummary = {
  currentRevenue: number;
  previousRevenue: number;
  revenueChangePct: number | null;
  profitPotential: number;
  profitMarginPct: number | null;
  openOrders: number;
  urgentOrders: number;
  warehouseValue: number;
  articleCount: number;
  topSellerCriticalCount: number;
  topSellerCount: number;
};

export type ErpDashboardData = {
  summary: DashboardSummary;
  revenueTrend: DashboardMonthPoint[];
  topSellers: DashboardTopSellerRow[];
  isEmpty: boolean;
};

type GraphQlConnection<TNode> = {
  nodes?: Array<TNode | null> | null;
};

type SalesOrdersGraphQlData = {
  salesOrders?: GraphQlConnection<{
    salesOrderDate?: unknown;
    totalGrossAmount?: unknown;
    salesInvoiceStatus?: unknown;
  }>;
};

export async function loadErpDashboard(
  appBridgeClient: AppBridgeClient,
  options: {
    now?: Date;
  } = {},
): Promise<ErpDashboardData> {
  const now = options.now ?? new Date();
  const range = getDashboardDateRange(now);

  const salesOrdersPayload = await requestGraphQlOperation(appBridgeClient, {
    query: SALES_ORDERS_QUERY,
    variables: {
      from: range.fromIso,
      to: range.toIso,
      first: SALES_ORDERS_FETCH_LIMIT,
    },
    operationName: 'DashboardSalesOrders',
  });

  return buildErpDashboardData(
    {
      salesOrders: readSalesOrdersResult(salesOrdersPayload),
      topSellers: [],
      inventoryItems: [],
    },
    now,
  );
}

export function buildErpDashboardData(
  input: {
    salesOrders: DashboardSalesOrder[];
    topSellers: DashboardInventoryItem[];
    inventoryItems: DashboardInventoryItem[];
  },
  now: Date,
): ErpDashboardData {
  const months = createDashboardMonthSeries(now);
  const revenueTrend = aggregateRevenueByMonth(input.salesOrders, months);
  const currentRevenue = revenueTrend[revenueTrend.length - 1]?.revenue ?? 0;
  const previousRevenue = revenueTrend[revenueTrend.length - 2]?.revenue ?? 0;
  const revenueChangePct = calculatePercentageChange(currentRevenue, previousRevenue);
  const openOrders = input.salesOrders.filter(order => !isCompletedSalesOrder(order.salesInvoiceStatus)).length;
  const urgentOrders = input.salesOrders.filter(order => isUrgentSalesOrder(order, now)).length;
  const warehouseValue = roundMetric(input.inventoryItems.reduce((total, item) => total + item.stockAvailable * item.averagePurchasePriceNet, 0));
  const profitPotential = roundMetric(input.inventoryItems.reduce((total, item) => total + item.stockAvailable * item.profit, 0));
  const articleCount = input.inventoryItems.length;
  const profitMarginPct = warehouseValue > 0 ? roundMetric((profitPotential / warehouseValue) * 100) : null;
  const topSellers = normalizeTopSellerRows(input.topSellers);
  const topSellerCriticalCount = topSellers.filter(item => item.isCritical).length;
  const isEmpty = input.salesOrders.length === 0 && input.topSellers.length === 0 && input.inventoryItems.length === 0;

  return {
    summary: {
      currentRevenue,
      previousRevenue,
      revenueChangePct,
      profitPotential,
      profitMarginPct,
      openOrders,
      urgentOrders,
      warehouseValue,
      articleCount,
      topSellerCriticalCount,
      topSellerCount: topSellers.length,
    },
    revenueTrend,
    topSellers,
    isEmpty,
  };
}

export function createDashboardMonthSeries(now: Date): DashboardMonthPoint[] {
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthFormatter = new Intl.DateTimeFormat('de-DE', {
    month: 'short',
    timeZone: 'UTC',
  });

  return Array.from({ length: DASHBOARD_MONTH_COUNT }, (_, index) => {
    const monthDate = new Date(
      Date.UTC(currentMonthStart.getUTCFullYear(), currentMonthStart.getUTCMonth() - (DASHBOARD_MONTH_COUNT - 1 - index), 1),
    );

    return {
      monthKey: monthDate.toISOString().slice(0, 7),
      monthLabel: toShortMonthLabel(monthFormatter.format(monthDate)),
      revenue: 0,
    };
  });
}

export function aggregateRevenueByMonth(orders: DashboardSalesOrder[], months: DashboardMonthPoint[]): DashboardMonthPoint[] {
  const revenueByMonth = new Map(months.map(month => [month.monthKey, 0]));

  for (const order of orders) {
    const monthKey = order.salesOrderDate.slice(0, 7);

    if (!revenueByMonth.has(monthKey)) {
      continue;
    }

    revenueByMonth.set(monthKey, roundMetric((revenueByMonth.get(monthKey) ?? 0) + order.totalGrossAmount));
  }

  return months.map(month => ({
    ...month,
    revenue: revenueByMonth.get(month.monthKey) ?? 0,
  }));
}

export function calculatePercentageChange(currentValue: number, previousValue: number): number | null {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : null;
  }

  return roundMetric(((currentValue - previousValue) / previousValue) * 100);
}

export function isCriticalStock(item: Pick<DashboardInventoryItem, 'stockAvailable' | 'minimumStock'>): boolean {
  const minimumStock = item.minimumStock ?? 0;
  const threshold = minimumStock > 0 ? minimumStock : DEFAULT_CRITICAL_STOCK_THRESHOLD;

  return item.stockAvailable <= threshold;
}

export function normalizeTopSellerRows(items: DashboardInventoryItem[]): DashboardTopSellerRow[] {
  const maxStock = Math.max(...items.map(item => item.stockAvailable), 0);

  return items.slice(0, 5).map(item => ({
    name: item.name,
    stockAvailable: item.stockAvailable,
    minimumStock: item.minimumStock,
    progressRatio: maxStock > 0 ? item.stockAvailable / maxStock : 0,
    isCritical: isCriticalStock(item),
  }));
}

function getDashboardDateRange(now: Date): {
  fromIso: string;
  toIso: string;
} {
  const monthSeries = createDashboardMonthSeries(now);
  const firstMonth = monthSeries[0]?.monthKey;

  if (!firstMonth) {
    const isoNow = now.toISOString();

    return {
      fromIso: isoNow,
      toIso: isoNow,
    };
  }

  const monthParts = firstMonth.split('-');
  const year = Number(monthParts[0]);
  const month = Number(monthParts[1]);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    const isoNow = now.toISOString();

    return {
      fromIso: isoNow,
      toIso: isoNow,
    };
  }

  const fromDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const toDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  return {
    fromIso: fromDate.toISOString(),
    toIso: toDate.toISOString(),
  };
}

function readSalesOrdersResult(payload: unknown): DashboardSalesOrder[] {
  const data = readGraphQlData<SalesOrdersGraphQlData>(payload);
  const nodes = data.salesOrders?.nodes ?? [];

  return nodes.flatMap(node => {
    const salesOrderDate = typeof node?.salesOrderDate === 'string' ? node.salesOrderDate : null;
    const totalGrossAmount = toNumber(node?.totalGrossAmount);
    const salesInvoiceStatus = typeof node?.salesInvoiceStatus === 'string' ? node.salesInvoiceStatus : null;

    if (!salesOrderDate || totalGrossAmount == null || !salesInvoiceStatus) {
      return [];
    }

    return [
      {
        salesOrderDate,
        totalGrossAmount,
        salesInvoiceStatus,
      },
    ];
  });
}

function readGraphQlData<TData>(payload: unknown): TData {
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !(payload as { data?: unknown }).data) {
    throw createUnexpectedAppError({
      source: 'graphql',
      requestPath: '/graphql',
      fallbackMessage: 'The GraphQL request returned an unexpected dashboard payload.',
      raw: payload,
    });
  }

  return (payload as { data: TData }).data;
}

function isCompletedSalesOrder(status: SalesInvoiceStatus): boolean {
  return status === 'COMPLETELY_INVOICED';
}

function isUrgentSalesOrder(order: DashboardSalesOrder, now: Date): boolean {
  if (isCompletedSalesOrder(order.salesInvoiceStatus)) {
    return false;
  }

  const orderTimestamp = Date.parse(order.salesOrderDate);

  if (!Number.isFinite(orderTimestamp)) {
    return false;
  }

  return now.getTime() - orderTimestamp >= URGENT_ORDER_AGE_DAYS * 24 * 60 * 60 * 1000;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}

function toShortMonthLabel(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1).replace('.', '');
}
