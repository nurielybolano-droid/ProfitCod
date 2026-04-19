'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { DailyMetrics, formatCurrency } from '@/lib/calculator'

const COLORS = {
  primary: '#7B61FF',
  success: '#2ED47A',
  info: '#56CCF2',
  danger: '#FF4D4F',
  warning: '#FAAD14',
  purple: '#B37FEB',
  text: '#718096',
  grid: 'rgba(0,0,0,0.03)',
  white: '#FFFFFF'
}

const CustomTooltip = ({ active, payload, label, currency = true, extraFields }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel" style={{ padding: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontSize: '0.8rem' }}>
        <p style={{ fontWeight: 700, marginBottom: '4px', color: '#2D3748' }}>{label}</p>
        
        {/* Main Chart Metrics */}
        {payload.map((entry: any, index: number) => {
          let val = entry.value;
          if (currency) val = formatCurrency(val);
          else if (entry.name === 'ROAS (x)') val = `${val?.toFixed(2)}x`;
          
          return (
            <p key={index} style={{ color: entry.color, fontWeight: 600, margin: '2px 0' }}>
              {entry.name}: {val}
            </p>
          );
        })}

        {/* Extra Contextual Metrics */}
        {extraFields && extraFields.length > 0 && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
            {extraFields.map((field: any, index: number) => {
              let val = data[field.key];
              if (field.type === 'currency') val = formatCurrency(val || 0);
              else if (field.type === 'percent') val = `${(val || 0).toFixed(1)}%`;
              else if (field.type === 'multiplier') val = `${(val || 0).toFixed(2)}x`;
              
              return (
                <p key={`extra-${index}`} style={{ color: COLORS.text, margin: '2px 0', fontSize: '0.75rem' }}>
                  {field.label}: <span style={{ fontWeight: 600, color: '#4A5568' }}>{val}</span>
                </p>
              )
            })}
          </div>
        )}
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
      <Tooltip content={<CustomTooltip currency={currency} extraFields={data[0]?.extraFields || null} />} />
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

export function AdsVsProfitChart({ metrics }: { metrics: DailyMetrics[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={metrics}>
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
        <Tooltip content={<CustomTooltip extraFields={[
          { key: 'revenue', label: 'Ingresos', type: 'currency' },
          { key: 'totalInvestment', label: 'Inversión Total', type: 'currency' }
        ]} />} />
        <Bar dataKey="adsSpend" name="Gasto Ads" fill={COLORS.info} radius={[4, 4, 0, 0]} barSize={20} />
        <Line 
          type="monotone" 
          dataKey="profit" 
          name="Beneficio Neto" 
          stroke={COLORS.success} 
          strokeWidth={3}
          dot={{ fill: COLORS.white, stroke: COLORS.success, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function CpaVsRoasChart({ metrics }: { metrics: DailyMetrics[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={metrics}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          yAxisId="left"
          tickFormatter={(v) => `${v}€`}
          tick={{ fill: COLORS.danger, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          orientation="left"
        />
        <YAxis 
          yAxisId="right"
          tickFormatter={(v) => `${v}x`}
          tick={{ fill: COLORS.warning, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          orientation="right"
        />
        <Tooltip content={<CustomTooltip currency={false} extraFields={[
          { key: 'adsSpend', label: 'Gasto Ads', type: 'currency' },
          { key: 'orders', label: 'Volumen', type: 'number' },
          { key: 'marginPerDelivered', label: 'Margen por Entrega', type: 'currency' }
        ]} />} />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="cpa" 
          name="CPA (€)" 
          stroke={COLORS.danger} 
          strokeWidth={3}
          dot={{ r: 3 }}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="roas" 
          name="ROAS (x)" 
          stroke={COLORS.warning} 
          strokeWidth={3}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function DeliveredVsReturnsChart({ metrics }: { metrics: DailyMetrics[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={metrics}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tickFormatter={(v) => v}
          tick={{ fill: COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip currency={false} extraFields={[
          { key: 'deliveryRate', label: 'Tasa de Entrega', type: 'percent' },
          { key: 'returnRate', label: 'Tasa de Devolución', type: 'percent' }
        ]} />} />
        <Bar dataKey="delivered" name="Entregados" fill={COLORS.success} radius={[4, 4, 0, 0]} stackId="a" />
        <Bar dataKey="returns" name="Devueltos" fill={COLORS.danger} radius={[4, 4, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function VariantDistributionPieChart({ metrics }: { metrics: DailyMetrics[] }) {
  // Aggregate sales by variant
  const aggregation: Record<string, number> = {}
  metrics.forEach(m => {
    const name = m.productName || 'General'
    if (!aggregation[name]) aggregation[name] = 0
    aggregation[name] += m.delivered
  })

  const data = Object.keys(aggregation).map(key => ({
    name: key,
    value: aggregation[key]
  })).filter(d => d.value > 0)

  const pieColors = [COLORS.primary, COLORS.info, COLORS.purple, COLORS.success, COLORS.warning]

  if (data.length === 0) {
    return <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: COLORS.text }}>Sin datos de entrega</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => [`${value} uds`, 'Entregados']} />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
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
