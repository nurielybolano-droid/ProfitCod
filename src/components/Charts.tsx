'use client'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { DailyMetrics, formatCurrency, formatPercent } from '@/lib/calculator'

const COLORS = {
  primary: '#7B61FF',
  primaryLight: '#9F7AEA',
  success: '#2ED47A',
  info: '#56CCF2',
  text: '#718096',
  grid: 'rgba(0,0,0,0.03)',
  white: '#FFFFFF'
}

/**
 * Custom Tooltip for Ethereal theme
 */
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

export function RevenueVsCostChart({ metrics }: { metrics: DailyMetrics[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={metrics}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={COLORS.info} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorTotalCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tickFormatter={(v) => `${v}€`}
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          name="Ingresos"
          stroke={COLORS.info} 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorRevenue)" 
        />
        <Area 
          type="monotone" 
          dataKey="totalCost" 
          name="Costes"
          stroke={COLORS.primary} 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorTotalCost)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function CumulativeProfitChart({ metrics }: { metrics: DailyMetrics[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={metrics}>
        <defs>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4}/>
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="cumulativeProfit" 
          name="Profit Acumulado"
          stroke={COLORS.primary} 
          strokeWidth={4}
          fillOpacity={1} 
          fill="url(#colorProfit)"
          dot={{ fill: COLORS.white, stroke: COLORS.primary, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.primary }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function OrdersVsDeliveredChart({ metrics }: { metrics: DailyMetrics[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={metrics} barGap={8}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10 }} />
        <Tooltip content={<CustomTooltip currency={false} />} />
        <Bar 
          dataKey="orders" 
          name="Pedidos"
          fill={COLORS.primaryLight} 
          radius={[4, 4, 0, 0]} 
        />
        <Bar 
          dataKey="delivered" 
          name="Entregados"
          fill={COLORS.success} 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DeliveryRateChart({ metrics }: { metrics: DailyMetrics[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={metrics}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip currency={false} />} />
        <Line 
          type="monotone" 
          dataKey="deliveryRate" 
          name="Tasa Entrega"
          stroke={COLORS.success} 
          strokeWidth={3}
          dot={{ fill: COLORS.white, stroke: COLORS.success, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ProductMixDonut({ data }: { data: { name: string, value: number }[] }) {
  const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.info, COLORS.primaryLight];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={false}/>} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Placeholder for remaining charts (keeping consistent naming for DashboardClient)
export function AdsVsRevenueChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <RevenueVsCostChart metrics={metrics} />
}
export function MarginVsCpaChart({ metrics }: { metrics: DailyMetrics[] }) {
  return <CumulativeProfitChart metrics={metrics} />
}
