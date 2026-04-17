'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailyMetrics, formatCurrency } from '@/lib/calculator'

const COLORS = {
  primary: '#7B61FF',
  success: '#2ED47A',
  info: '#56CCF2',
  text: '#718096',
  grid: 'rgba(0,0,0,0.03)',
  white: '#FFFFFF'
}

const CustomTooltip = ({ active, payload, label, currency = true }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontSize: '0.8rem' }}>
        <p style={{ fontWeight: 700, marginBottom: '4px', color: '#2D3748' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color, fontWeight: 600 }}>
            {entry.name}: {currency ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const BaseLineChart = ({ data, dataKey, name, color, currency = true }: any) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
      <XAxis 
        dataKey="date" 
        tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        tick={{ fill: COLORS.text, fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis 
        tickFormatter={(v) => currency ? `${v}€` : v}
        tick={{ fill: COLORS.text, fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip content={<CustomTooltip currency={currency} />} />
      <Line 
        type="monotone" 
        dataKey={dataKey} 
        name={name}
        stroke={color} 
        strokeWidth={3}
        dot={{ fill: COLORS.white, stroke: color, strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
)

export function DailyOrdersChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <BaseLineChart data={metrics} dataKey="orders" name="Pedidos" color={COLORS.primary} currency={false} />
}

export function DailyRevenueChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <BaseLineChart data={metrics} dataKey="revenue" name="Ingresos" color={COLORS.info} />
}

export function DailyProfitChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <BaseLineChart data={metrics} dataKey="profit" name="Beneficio Diario" color={COLORS.success} />
}

export function CumulativeProfitChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <BaseLineChart data={metrics} dataKey="cumulativeProfit" name="Beneficio Acumulado" color={COLORS.primary} />
}

// Legacy / Compatibility (can be removed later if not used)
export function OrdersVsDeliveredChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <DailyOrdersChart metrics={metrics} />
}
export function DeliveryRateChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <BaseLineChart data={metrics} dataKey="deliveryRate" name="Tasa Entrega" color={COLORS.success} currency={false} />
}
export function DailyPerformanceChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <DailyProfitChart metrics={metrics} />
}
export function RevenueVsCostChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <DailyRevenueChart metrics={metrics} />
}
