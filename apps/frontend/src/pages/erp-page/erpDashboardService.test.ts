import { describe, expect, it } from 'vitest';
import {
  aggregateRevenueByMonth,
  buildErpDashboardData,
  calculatePercentageChange,
  createDashboardMonthSeries,
  isCriticalStock,
  normalizeTopSellerRows,
  type DashboardInventoryItem,
  type DashboardSalesOrder,
} from './erpDashboardService';

describe('erpDashboardService', () => {
  it('creates six consecutive month labels ending in the current month', () => {
    const months = createDashboardMonthSeries(new Date('2026-06-15T10:00:00.000Z'));

    expect(months).toHaveLength(6);
    expect(months.map(month => month.monthKey)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']);
    expect(months.map(month => month.monthLabel)).toEqual(['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun']);
  });

  it('aggregates monthly revenue into the provided month buckets', () => {
    const months = createDashboardMonthSeries(new Date('2026-06-15T10:00:00.000Z'));
    const orders: DashboardSalesOrder[] = [
      { salesOrderDate: '2026-01-05T08:00:00.000Z', totalGrossAmount: 100, salesInvoiceStatus: 'NOT_INVOICED' },
      { salesOrderDate: '2026-01-22T08:00:00.000Z', totalGrossAmount: 50, salesInvoiceStatus: 'PARTIALLY_INVOICED' },
      { salesOrderDate: '2026-06-10T08:00:00.000Z', totalGrossAmount: 400, salesInvoiceStatus: 'COMPLETELY_INVOICED' },
    ];

    expect(aggregateRevenueByMonth(orders, months).map(month => month.revenue)).toEqual([150, 0, 0, 0, 0, 400]);
  });

  it('calculates month-over-month deltas', () => {
    expect(calculatePercentageChange(120, 100)).toBe(20);
    expect(calculatePercentageChange(80, 100)).toBe(-20);
    expect(calculatePercentageChange(0, 0)).toBe(0);
    expect(calculatePercentageChange(10, 0)).toBeNull();
  });

  it('builds the dashboard summary from sales orders and inventory', () => {
    const now = new Date('2026-06-15T10:00:00.000Z');
    const salesOrders: DashboardSalesOrder[] = [
      { salesOrderDate: '2026-05-02T08:00:00.000Z', totalGrossAmount: 100, salesInvoiceStatus: 'COMPLETELY_INVOICED' },
      { salesOrderDate: '2026-06-01T08:00:00.000Z', totalGrossAmount: 150, salesInvoiceStatus: 'PARTIALLY_INVOICED' },
      { salesOrderDate: '2026-06-03T08:00:00.000Z', totalGrossAmount: 50, salesInvoiceStatus: 'NOT_INVOICED' },
      { salesOrderDate: '2026-06-04T08:00:00.000Z', totalGrossAmount: 25, salesInvoiceStatus: 'COMPLETELY_INVOICED' },
    ];
    const topSellers: DashboardInventoryItem[] = [
      { name: 'Premium Laptop XPS-15', stockAvailable: 24, minimumStock: 5, averagePurchasePriceNet: 1000, profit: 230, isTopItem: true },
      { name: '4K Monitor 32"', stockAvailable: 4, minimumStock: 6, averagePurchasePriceNet: 300, profit: 80, isTopItem: true },
    ];
    const inventoryItems: DashboardInventoryItem[] = [
      { name: 'Premium Laptop XPS-15', stockAvailable: 24, minimumStock: 5, averagePurchasePriceNet: 1000, profit: 230, isTopItem: true },
      { name: 'Wireless Kopfhorer Pro', stockAvailable: 56, minimumStock: null, averagePurchasePriceNet: 120, profit: 35, isTopItem: true },
      { name: '4K Monitor 32"', stockAvailable: 4, minimumStock: 6, averagePurchasePriceNet: 300, profit: 80, isTopItem: true },
    ];

    const data = buildErpDashboardData({ salesOrders, topSellers, inventoryItems }, now);

    expect(data.summary.currentRevenue).toBe(225);
    expect(data.summary.previousRevenue).toBe(100);
    expect(data.summary.revenueChangePct).toBe(125);
    expect(data.summary.openOrders).toBe(2);
    expect(data.summary.urgentOrders).toBe(2);
    expect(data.summary.warehouseValue).toBe(31920);
    expect(data.summary.profitPotential).toBe(7800);
    expect(data.summary.articleCount).toBe(3);
    expect(data.summary.topSellerCriticalCount).toBe(1);
  });

  it('marks stock as critical using minimum stock or the default fallback threshold', () => {
    expect(isCriticalStock({ stockAvailable: 8, minimumStock: null })).toBe(true);
    expect(isCriticalStock({ stockAvailable: 12, minimumStock: null })).toBe(false);
    expect(isCriticalStock({ stockAvailable: 4, minimumStock: 6 })).toBe(true);
  });

  it('normalizes top seller rows with progress ratios', () => {
    const rows = normalizeTopSellerRows([
      { name: 'A', stockAvailable: 40, minimumStock: 5, averagePurchasePriceNet: 10, profit: 4, isTopItem: true },
      { name: 'B', stockAvailable: 10, minimumStock: 12, averagePurchasePriceNet: 10, profit: 4, isTopItem: true },
    ]);

    expect(rows).toEqual([
      {
        name: 'A',
        stockAvailable: 40,
        minimumStock: 5,
        progressRatio: 1,
        isCritical: false,
      },
      {
        name: 'B',
        stockAvailable: 10,
        minimumStock: 12,
        progressRatio: 0.25,
        isCritical: true,
      },
    ]);
  });
});
