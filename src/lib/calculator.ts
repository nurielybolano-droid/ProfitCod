export interface ProductConfig {
  id: string
  name: string
  pvp: number
  costProduct: number
  costShipping: number
  feeCod: number
  fixedCostDaily: number
  marginTarget?: number | null
}

export interface DailyRecord {
  date: string
  // Granular fields
  ordersReceived1: number
  ordersReceived2: number
  ordersConfirmed1: number
  ordersConfirmed2: number
  ordersShipped: number
  ordersDelivered1: number
  ordersDelivered2: number
  returns: number
  
  adsSpend: number
  fixedCosts?: number
  notes?: string | null
  
  product: ProductConfig
  product2?: ProductConfig | null
  
  // Legacy fields (optional compatibility)
  orders?: number
  delivered?: number
  rejected?: number
}

export interface DailyMetrics {
  date: string
  // Totals
  orders: number // Total Received
  confirmed: number
  shipped: number
  delivered: number
  returns: number
  
  adsSpend: number
  fixedCosts: number
  notes?: string | null
  productName?: string
  
  // Calculated
  totalCogs: number
  totalShippingCost: number
  totalCodFee: number
  totalInvestment: number
  revenue: number
  profit: number
  
  // Ratios
  deliveryRate: number
  returnRate: number
  cpa: number
  roas: number
  marginPerDelivered: number
  
  cumulativeProfit?: number
}

/**
 * Calculates metrics for a specific day and product(s)
 */
export function calculateMetrics(
  record: DailyRecord
): Omit<DailyMetrics, 'cumulativeProfit'> {
  const p1 = record.product
  const p2 = record.product2 || p1 // Default to p1 if p2 not specified
  
  const d1 = Number(record.ordersDelivered1 || 0)
  const d2 = Number(record.ordersDelivered2 || 0)
  const shipped = Number(record.ordersShipped || 0)
  const receivedTotal = Number(record.ordersReceived1 || 0) + Number(record.ordersReceived2 || 0)
  const confirmedTotal = Number(record.ordersConfirmed1 || 0) + Number(record.ordersConfirmed2 || 0)
  const deliveredTotal = d1 + d2
  
  // 1. Revenue (Delivered units * their respective PVP)
  const revenue = (d1 * (p1.pvp || 0)) + (d2 * (p2.pvp || 0))
  
  // 2. COGS (Delivered units * their respective Cost)
  const totalCogs = (d1 * (p1.costProduct || 0)) + (d2 * (p2.costProduct || 0))
  
  // 3. Shipping (Shipped orders * Shipping fee of main product)
  // We assume 1 order = 1 shipping fee even if multi-unit
  const totalShippingCost = shipped * (p1.costShipping || 0)
  
  // 4. COD Fee (Delivered orders * COD fee)
  const totalCodFee = deliveredTotal * (p1.feeCod || 0)
  
  // 5. Total Investment
  const adsSpend = Number(record.adsSpend || 0)
  const fixedCosts = Number(record.fixedCosts || 0)
  const totalInvestment = adsSpend + fixedCosts + totalShippingCost + totalCodFee + totalCogs
  
  // 6. Profit
  const profit = revenue - totalInvestment
  
  // 7. Ratios
  const deliveryRate = receivedTotal > 0 ? (deliveredTotal / receivedTotal) * 100 : 0
  const returnRate = shipped > 0 ? (Number(record.returns || 0) / shipped) * 100 : 0
  const cpa = receivedTotal > 0 ? adsSpend / receivedTotal : 0
  const roas = adsSpend > 0 ? revenue / adsSpend : 0
  const marginPerDelivered = deliveredTotal > 0 ? profit / deliveredTotal : 0

  return {
    date: record.date,
    orders: receivedTotal,
    confirmed: confirmedTotal,
    shipped,
    delivered: deliveredTotal,
    returns: Number(record.returns || 0),
    adsSpend,
    fixedCosts,
    notes: record.notes,
    productName: p1.name,
    totalCogs,
    totalShippingCost,
    totalCodFee,
    totalInvestment,
    revenue,
    profit,
    deliveryRate,
    returnRate,
    cpa,
    roas,
    marginPerDelivered
  }
}

/**
 * Calculates metrics for a list of records.
 */
export function calculateAllMetrics(
  records: any[]
): DailyMetrics[] {
  let cumulative = 0
  
  // Sort by date 
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return sortedRecords.map((record) => {
    // If it's a legacy record without granular fields, try to bridge it
    const normalizedRecord: DailyRecord = {
      ...record,
      ordersReceived1: record.ordersReceived1 ?? record.orders ?? 0,
      ordersReceived2: record.ordersReceived2 ?? 0,
      ordersShipped: record.ordersShipped ?? record.orders ?? 0,
      ordersDelivered1: record.ordersDelivered1 ?? record.delivered ?? 0,
      ordersDelivered2: record.ordersDelivered2 ?? 0,
      returns: record.returns ?? record.rejected ?? 0,
      product: record.product,
      product2: record.product2 || null
    }

    const metrics = calculateMetrics(normalizedRecord)
    cumulative += metrics.profit
    return {
      ...metrics,
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
