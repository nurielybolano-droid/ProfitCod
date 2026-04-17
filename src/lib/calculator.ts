export interface ProductConfig {
  pvp: number
  costProduct: number
  costShipping: number
  feeCod: number
  fixedCostDaily: number
  marginTarget?: number | null
}

export interface DailyRecord {
  date: string
  orders: number
  delivered: number
  rejected: number
  adsSpend: number
  fixedCosts?: number // New: per-record fixed costs
  notes?: string | null
  product?: ProductConfig // Now records come with their specific product config
}

export interface DailyMetrics {
  date: string
  orders: number
  delivered: number
  rejected: number
  adsSpend: number
  fixedCosts: number
  notes?: string | null
  productName?: string
  // Calculated
  unitCost: number
  totalCost: number
  revenue: number
  profit: number
  deliveryRate: number
  rejectionRate: number
  marginPerDelivered: number
  cpa: number
  roas: number
  breakEven: number
  cumulativeProfit?: number
}

export function calculateMetrics(
  record: DailyRecord,
  config: ProductConfig
): Omit<DailyMetrics, 'cumulativeProfit'> {
  const { pvp, costProduct, costShipping, feeCod, fixedCostDaily = 0 } = config
  const { orders, delivered, rejected, adsSpend, fixedCosts = 0, date, notes } = record

  // 1. Coste unitario por pedido
  const unitCost = (costProduct || 0) + (costShipping || 0) + (feeCod || 0)

  // 2. Coste total diario (todos los pedidos, se entreguen o no)
  const totalCost = (orders || 0) * unitCost

  // 3. Ingresos diarios (solo pedidos entregados)
  const revenue = (delivered || 0) * (pvp || 0)

  // 4. Beneficio diario
  const profit = revenue - totalCost - (adsSpend || 0) - (fixedCostDaily || 0) - (fixedCosts || 0)

  // 5. Tasa de entrega
  const deliveryRate = orders > 0 ? (delivered / orders) * 100 : 0

  // 6. Tasa de rechazo
  const rejectionRate = orders > 0 ? (rejected / orders) * 100 : 0

  // 7. Margen por pedido entregado
  const marginPerDelivered = pvp - unitCost

  // 9. CPA
  const cpa = orders > 0 ? adsSpend / orders : 0

  // 10. ROAS
  const roas = adsSpend > 0 ? revenue / adsSpend : 0

  // 11. Punto de equilibrio
  const breakEven = marginPerDelivered > 0 ? totalCost / marginPerDelivered : Infinity

  return {
    date,
    orders,
    delivered,
    rejected,
    adsSpend,
    fixedCosts,
    notes,
    unitCost,
    totalCost,
    revenue,
    profit,
    deliveryRate,
    rejectionRate,
    marginPerDelivered,
    cpa,
    roas,
    breakEven,
  }
}

/**
 * Calculates metrics for a list of records.
 * Each record can optionally have its own product config (for multi-product / aggregate views).
 * If no specific config is on the record, the provided fallback config is used.
 */
export function calculateAllMetrics(
  records: ({ date: string; orders: number; delivered: number; rejected: number; adsSpend: number; fixedCosts?: number; notes?: string | null; product?: any; productName?: string }) [],
  fallbackConfig?: ProductConfig
): DailyMetrics[] {
  let cumulative = 0
  
  // Sort by date to ensure cumulative profit is correct
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return sortedRecords.map((record) => {
    const config = record.product || fallbackConfig
    if (!config) {
      // If no config found anywhere, return zeroes/placeholder
      return {
        ...record,
        unitCost: 0, totalCost: 0, revenue: 0, profit: 0, 
        deliveryRate: 0, rejectionRate: 0, marginPerDelivered: 0, 
        cpa: 0, roas: 0, breakEven: 0, cumulativeProfit: 0
      } as DailyMetrics
    }

    const metrics = calculateMetrics(record as any, config)
    cumulative += metrics.profit
    return {
      ...metrics,
      productName: record.productName,
      cumulativeProfit: cumulative,
    }
  })
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
