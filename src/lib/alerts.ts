import { DailyMetrics } from './calculator'

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type DayStatus = 'profitable' | 'unstable' | 'critical'

export interface Alert {
  id: string
  severity: AlertSeverity
  message: string
  detail?: string
}

export interface DayStatusResult {
  status: DayStatus
  label: string
  emoji: string
}

/**
 * Determina el estado de un día
 */
export function getDayStatus(metrics: DailyMetrics): DayStatusResult {
  const { profit, deliveryRate, shippingRate } = metrics

  if (deliveryRate < 60 || profit < -50 || shippingRate < 70) {
    return { status: 'critical', label: 'Crítico', emoji: '🔴' }
  }

  if (profit < 0 || (deliveryRate >= 60 && deliveryRate < 80) || (shippingRate >= 70 && shippingRate < 90)) {
    return { status: 'unstable', label: 'Inestable', emoji: '🟡' }
  }

  return { status: 'profitable', label: 'Rentable', emoji: '🟢' }
}

/**
 * Genera alertas automáticas basadas en el historial de métricas
 */
export function generateAlerts(metrics: DailyMetrics[]): Alert[] {
  const alerts: Alert[] = []

  if (metrics.length === 0) return alerts

  const latest = metrics[metrics.length - 1]

  // Alerta: tasa de envío < 80%
  if (latest.shippingRate < 80 && latest.confirmed > 0) {
    alerts.push({
      id: 'low-shipping-rate',
      severity: 'warning',
      message: 'Retraso en envíos',
      detail: `Tasa de envío: ${latest.shippingRate.toFixed(1)}% — revisa almacén/mensajería`,
    })
  }

  // Alerta: tasa de entrega < 70% (sobre enviados)
  if (latest.deliveryRate < 70 && latest.shipped > 0) {
    alerts.push({
      id: 'low-delivery-rate',
      severity: 'critical',
      message: 'Problema de transporte',
      detail: `Tasa de entrega: ${latest.deliveryRate.toFixed(1)}% — alta tasa de rechazo`,
    })
  }

  // Alerta: CPA > margen por pedido entregado
  if (latest.cpa > latest.marginPerDelivered && latest.orders > 0) {
    alerts.push({
      id: 'cpa-over-margin',
      severity: 'critical',
      message: 'Estás perdiendo dinero por pedido',
      detail: `CPA (${latest.cpa.toFixed(2)}€) > Margen (${latest.marginPerDelivered.toFixed(2)}€)`,
    })
  }

  // Alerta: 2 días seguidos en pérdida
  if (metrics.length >= 2) {
    const prev = metrics[metrics.length - 2]
    if (latest.profit < 0 && prev.profit < 0) {
      alerts.push({
        id: 'consecutive-losses',
        severity: 'warning',
        message: 'Revisar campaña',
        detail: '2 días consecutivos con beneficio negativo',
      })
    }
  }

  return alerts
}

/**
 * Genera resumen de alertas globales de todos los días
 */
export function getSummaryAlerts(metrics: DailyMetrics[]): Alert[] {
  const alerts = generateAlerts(metrics)

  // Alerta si el acumulado total es muy negativo
  const totalProfit = metrics.reduce((sum, m) => sum + m.profit, 0)
  if (totalProfit < -500 && metrics.length >= 3) {
    alerts.push({
      id: 'negative-cumulative',
      severity: 'warning',
      message: 'Beneficio acumulado negativo',
      detail: `Total acumulado: ${totalProfit.toFixed(2)}€`,
    })
  }

  return alerts
}
