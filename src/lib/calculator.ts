export interface ProductConfig {
  id: string
  name: string
  pvp: number
  costProduct: number
  iva: number
  cpa: number
  costEnvio: number
  feeCod: number
  rateShipping: number
  rateDelivery: number
  costReturn: number
  units: number
  fixedCostDaily: number
  marginTarget?: number | null
  packEnabled?: boolean
  packUnits?: number
  packPvp?: number | null
}

export interface DailyRecord {
  id?: string
  date: string
  // Granular fields
  ordersReceived1: number
  ordersReceived2: number
  ordersConfirmed1: number
  ordersConfirmed2: number
  ordersShipped: number
  ordersDelivered1: number
  ordersDelivered2: number
  returns1: number
  returns2: number
  
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
  totalIva: number
  totalInvestment: number
  revenue: number
  profit: number
  
  // Ratios
  shippingRate: number
  deliveryRate: number
  returnRate: number
  cpa: number
  roas: number
  marginPerDelivered: number
  
  cumulativeProfit?: number
  recordId?: string
  productId?: string
}

/**
 * Calculates metrics for a specific day and product(s)
 * returns an array of metrics (one per product variant)
 */
export function calculateMetrics(
  record: DailyRecord
): Omit<DailyMetrics, 'cumulativeProfit'>[] {
  const p1 = record.product
  let p2 = record.product2

  // Support for virtual pack variation
  if (!p2 && p1.packEnabled && p1.packPvp != null) {
    p2 = {
      ...p1,
      units: p1.packUnits || 2,
      pvp: p1.packPvp
    }
  }
  
  const r1 = Number(record.ordersReceived1 || 0)
  const r2 = Number(record.ordersReceived2 || 0)
  const receivedTotal = r1 + r2
  
  const ratios = {
    p1: receivedTotal > 0 ? r1 / receivedTotal : 1, // If both 0, assign all to p1
    p2: receivedTotal > 0 ? r2 / receivedTotal : 0
  }

  const results: Omit<DailyMetrics, 'cumulativeProfit'>[] = []

  // Helper to calculate for one variant
  const calcVariant = (
    p: ProductConfig, 
    received: number, 
    confirmed: number, 
    delivered: number, 
    ratio: number,
    isSecond: boolean
  ) => {
    // Proportional split for shared fields
    const vAdsSpend = Number(record.adsSpend || 0) * ratio
    const vFixedCosts = Number(record.fixedCosts || 0) * ratio
    // shipped is shared — split by ratio
    const vShipped = Number(record.ordersShipped || 0) * ratio
    // returns are now per-variant: exactly as entered (like Excel cols Q and R)
    const vReturns = isSecond
      ? Number(record.returns2 || 0)
      : Number(record.returns1 || 0)

    // NEW LOGIC (Excel Matching): Revenue and COGS based on actual Deliveries
    const revenue = delivered * (p.pvp || 0)
    const totalIvaSale = delivered * (p.costProduct || 0) * (p.units || 1) * ((p.iva || 0) / 100)
    const totalCogs = delivered * (p.costProduct || 0) * (p.units || 1)
    
    const vEnvioCost = vShipped * (p.costEnvio || 0)
    const vCodFee = delivered * (p.feeCod || 0)
    const vReturnCost = vReturns * (p.costReturn || 0)
    const vLogistics = vEnvioCost + vCodFee + vReturnCost
    
    const totalInvestment = vAdsSpend + vFixedCosts + vLogistics + totalCogs + totalIvaSale
    const profit = revenue - totalInvestment
    
    return {
      recordId: record.id,
      productId: p.id,
      date: record.date,
      orders: received,
      confirmed,
      shipped: vShipped,
      delivered,
      returns: vReturns,
      adsSpend: vAdsSpend,
      fixedCosts: vFixedCosts,
      notes: record.notes,
      productName: isSecond ? `${p.name} (Pack ${p.units}ud)` : p.name,
      totalCogs,
      totalShippingCost: vEnvioCost,
      totalCodFee: vCodFee,
      totalIva: totalIvaSale,
      totalInvestment,
      revenue,
      profit,
      shippingRate: confirmed > 0 ? (vShipped / confirmed) * 100 : 0,
      deliveryRate: vShipped > 0 ? (delivered / vShipped) * 100 : 0,
      returnRate: vShipped > 0 ? (vReturns / vShipped) * 100 : 0,
      cpa: received > 0 ? vAdsSpend / received : 0,
      roas: vAdsSpend > 0 ? revenue / vAdsSpend : 0,
      marginPerDelivered: delivered > 0 ? profit / delivered : 0
    }
  }

  // Add P1
  results.push(calcVariant(
    p1, r1, 
    Number(record.ordersConfirmed1 || 0), 
    Number(record.ordersDelivered1 || 0), 
    ratios.p1, 
    false
  ))

  // Add P2 if it exists (either a different product or a virtual pack variant)
  if (p2 && (p2.id !== p1.id || (p1.packEnabled && p2 !== p1))) {
    results.push(calcVariant(
      p2, r2, 
      Number(record.ordersConfirmed2 || 0), 
      Number(record.ordersDelivered2 || 0), 
      ratios.p2, 
      true
    ))
  }

  return results
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

  const allMetrics: DailyMetrics[] = []

  sortedRecords.forEach((record) => {
    const normalizedRecord: DailyRecord = {
      ...record,
      ordersReceived1: record.ordersReceived1 ?? record.orders ?? 0,
      ordersReceived2: record.ordersReceived2 ?? 0,
      ordersShipped: record.ordersShipped ?? 0,
      ordersDelivered1: record.ordersDelivered1 ?? record.delivered ?? 0,
      ordersDelivered2: record.ordersDelivered2 ?? 0,
      returns1: record.returns1 ?? record.returns ?? record.rejected ?? 0,
      returns2: record.returns2 ?? 0,
      product: record.product,
      product2: record.product2 || null
    }

    const dayMetricsList = calculateMetrics(normalizedRecord)
    dayMetricsList.forEach(m => {
      cumulative += m.profit
      allMetrics.push({
        ...m,
        cumulativeProfit: cumulative
      })
    })
  })

  return allMetrics
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
