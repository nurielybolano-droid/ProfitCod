'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { calculateAllMetrics, formatCurrency, formatPercent, DailyMetrics } from '@/lib/calculator'
import { getDayStatus, getSummaryAlerts, Alert } from '@/lib/alerts'
import Link from 'next/link'
import {
  DailyOrdersChart,
  DailyRevenueChart,
  DailyProfitChart,
  CumulativeProfitChart,
  AdsVsProfitChart,
  CpaVsRoasChart,
  DeliveredVsReturnsChart,
  VariantDistributionPieChart
} from '@/components/Charts'
import AIAssistant from '@/components/AIAssistant'
import BreakevenSimulator from '@/components/BreakevenSimulator'
import { Archive, Trash2, Calendar, Filter, ChevronDown, Check } from 'lucide-react'

interface Product {
  id: string
  name: string
  pvp: number
  costProduct: number
  costEnvio: number
  feeCod: number
  fixedCostDaily: number
  marginTarget?: number | null
}

interface RawRecord {
  id: string
  date: string
  ordersReceived1: number
  ordersReceived2: number
  ordersConfirmed1: number
  ordersConfirmed2: number
  ordersShipped: number
  ordersDelivered1: number
  ordersDelivered2: number
  returns: number
  adsSpend: number
  fixedCosts: number
  notes?: string | null
  product: Product
  productId: string
  product2?: Product | null
  product2Id?: string | null
}

// ============================
// Quick Entry Form (Modal)
// ============================
function QuickEntryModal({
  products,
  onClose,
  onSaved,
}: {
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    productId: products[0]?.id || '',
    product2Id: '',
    date: today,
    ordersReceived1: '',
    ordersReceived2: '',
    ordersConfirmed1: '',
    ordersConfirmed2: '',
    ordersShipped: '',
    ordersDelivered1: '',
    ordersDelivered2: '',
    returns: '',
    adsSpend: '',
    fixedCosts: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productId) return setError('Selecciona un producto principal')
    setError('')
    setLoading(true)

    const payload = {
      ...form,
      ordersReceived1:  Number(form.ordersReceived1 || 0),
      ordersReceived2:  Number(form.ordersReceived2 || 0),
      ordersConfirmed1: Number(form.ordersConfirmed1 || 0),
      ordersConfirmed2: Number(form.ordersConfirmed2 || 0),
      ordersShipped:    Number(form.ordersShipped || 0),
      ordersDelivered1: Number(form.ordersDelivered1 || 0),
      ordersDelivered2: Number(form.ordersDelivered2 || 0),
      returns:          Number(form.returns || 0),
      adsSpend:         Number(form.adsSpend || 0),
      fixedCosts:       Number(form.fixedCosts || 0),
      product2Id:       form.product2Id || null,
    }

    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Error al guardar')
      return
    }

    onSaved()
    onClose()
  }

  if (products.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal glass-panel" onClick={e => e.stopPropagation()}>
          <div className="modal-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-danger)', marginBottom: '1.5rem' }}>No hay productos configurados</p>
            <Link href="/config" className="btn btn-primary">Configurar primer producto</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nuevo Registro Diario</h2>
          <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Producto Principal (1ud)</label>
                <select className="form-input" value={form.productId} onChange={e => setForm(f => ({...f, productId: e.target.value}))} required>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Producto Secundario (2ud)</label>
                <select className="form-input" value={form.product2Id} onChange={e => setForm(f => ({...f, product2Id: e.target.value}))}>
                  <option value="">Ninguno (Solo 1ud)</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Inversión Ads (€)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.adsSpend} onChange={e => setForm(f => ({ ...f, adsSpend: e.target.value }))} required />
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(123, 97, 255, 0.05)', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Pedidos Recibidos</p>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label small">1 Unidad</label>
                  <input type="number" className="form-input" placeholder="0" value={form.ordersReceived1} onChange={e => setForm(f => ({ ...f, ordersReceived1: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label small">2 Unidades</label>
                  <input type="number" className="form-input" placeholder="0" value={form.ordersReceived2} onChange={e => setForm(f => ({ ...f, ordersReceived2: e.target.value }))} />
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(39, 174, 96, 0.05)', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, fontSize: '0.8rem', color: '#27ae60', textTransform: 'uppercase', marginBottom: '1rem' }}>Pedidos Confirmados</p>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label small">1 Unidad</label>
                  <input type="number" className="form-input" placeholder="0" value={form.ordersConfirmed1} onChange={e => setForm(f => ({ ...f, ordersConfirmed1: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label small">2 Unidades</label>
                  <input type="number" className="form-input" placeholder="0" value={form.ordersConfirmed2} onChange={e => setForm(f => ({ ...f, ordersConfirmed2: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="form-grid-2" style={{ marginBottom: '1.5rem' }}>
               <div className="form-group">
                <label className="form-label">Total Enviados</label>
                <input type="number" className="form-input" placeholder="0" value={form.ordersShipped} onChange={e => setForm(f => ({ ...f, ordersShipped: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Devoluciones</label>
                <input type="number" className="form-input" placeholder="0" value={form.returns} onChange={e => setForm(f => ({ ...f, returns: e.target.value }))} />
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(123, 97, 255, 0.1)', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Entregas Exitosas</p>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label small">Entregados 1ud</label>
                  <input type="number" className="form-input" placeholder="0" value={form.ordersDelivered1} onChange={e => setForm(f => ({ ...f, ordersDelivered1: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label small">Entregados 2ud</label>
                  <input type="number" className="form-input" placeholder="0" value={form.ordersDelivered2} onChange={e => setForm(f => ({ ...f, ordersDelivered2: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Otros Gastos (€)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.fixedCosts} onChange={e => setForm(f => ({ ...f, fixedCosts: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <input type="text" className="form-input" placeholder="..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            {error && <p className="form-error" style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button id="save-record" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================
// KPI Card
// ============================
function KpiCard({
  label, value, color, sub, trend
}: {
  label: string
  value: string
  color: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="kpi-card glass-panel">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {(sub || trend) && (
        <div className={`kpi-trend trend-${trend || 'neutral'}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} {sub}
        </div>
      )}
    </div>
  )
}

// ============================
// Main Dashboard
// ============================
export default function DashboardClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]) // Empty array means 'all'
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)
  const [datePreset, setDatePreset] = useState<string>('ytd')
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date(end.getFullYear(), 0, 1) // 1 de Enero del año actual
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  })

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset)
    const end = new Date()
    const start = new Date()
    
    switch(preset) {
      case 'hoy':
        break;
      case '7':
        start.setDate(end.getDate() - 7)
        break;
      case '15':
        start.setDate(end.getDate() - 15)
        break;
      case '30':
        start.setMonth(end.getMonth() - 1)
        break;
      case 'ytd':
        start.setMonth(0, 1) // Jan 1st
        break;
    }
    
    if (preset !== 'custom') {
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      })
    }
  }

  const [records, setRecords] = useState<RawRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setServerError(null)
    try {
      const params = new URLSearchParams()
      if (selectedProductIds.length > 0) {
        params.append('productIds', selectedProductIds.join(','))
      }
      if (dateRange.start) params.append('start', dateRange.start)
      if (dateRange.end) params.append('end', dateRange.end)

      const [prodRes, recRes] = await Promise.all([
        fetch('/api/products'),
        fetch(`/api/records?${params.toString()}`)
      ])
      
      let prodData = []
      let recData = []

      if (prodRes.ok) {
        try {
          prodData = await prodRes.json()
        } catch (e) {
          console.error('Error parsing products JSON:', e)
        }
      } else {
        const err = await prodRes.json().catch(() => ({}))
        setServerError(err.error || `Error ${prodRes.status}: No se pudo cargar productos`)
      }

      if (recRes.ok) {
        try {
          recData = await recRes.json()
        } catch (e) {
          console.error('Error parsing records JSON:', e)
        }
      } else {
        const err = await recRes.json().catch(() => ({}))
        setServerError(prev => prev || err.error || `Error ${recRes.status}: No se pudo cargar registros`)
      }

      setProducts(Array.isArray(prodData) ? prodData : [])
      setRecords(Array.isArray(recData) ? recData : [])
    } catch (e) {
      console.error('Fetch error:', e)
    }
    setLoading(false)
  }, [selectedProductIds, dateRange])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este registro?')) return
    setDeleting(id)
    await fetch(`/api/records/${id}`, { method: 'DELETE' })
    await fetchAll()
    setDeleting(null)
  }

  // Multi-Product Aggregate Logic
  const metrics = useMemo(() => {
    if (!records.length) return []
    const allMetrics = calculateAllMetrics(records)
      
    // Filter by selected products if any specific ones are selected
    const filtered = selectedProductIds.length === 0
      ? allMetrics
      : allMetrics.filter(m => selectedProductIds.includes(m.productId || ''))
      
    // Recalculate cumulative profit
    let cumulative = 0
    return filtered.map(m => {
      cumulative += m.profit
      return { ...m, cumulativeProfit: cumulative }
    })
  }, [records, selectedProductIds])

  const alerts = useMemo(() => getSummaryAlerts(metrics), [metrics])

  // Summary KPIs
  const last = metrics[metrics.length - 1]
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0)
  const totalProfit = metrics[metrics.length - 1]?.cumulativeProfit ?? 0
  const totalOrders = metrics.reduce((s, m) => s + m.orders, 0)
  const avgDelivery = metrics.length > 0
    ? metrics.reduce((s, m) => s + m.deliveryRate, 0) / metrics.length
    : 0
  const avgROAS = metrics.length > 0
    ? metrics.reduce((s, m) => s + (m.roas || 0), 0) / metrics.length
    : 0

  return (
    <>
      {showModal && (
        <QuickEntryModal
          products={products}
          onClose={() => setShowModal(false)}
          onSaved={fetchAll}
        />
      )}

      {/* Header */}
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Panel de Control</h1>
          <p className="page-subtitle">
            {selectedProductIds.length === 0 ? 'Vista general (Todos los productos)' : `Analizando ${selectedProductIds.length} producto${selectedProductIds.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* RANGO FECHAS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '4px 6px', border: '1px solid rgba(0,0,0,0.08)' }}>
              <Calendar size={14} style={{ color: 'var(--color-text-muted)', margin: '0 8px' }} />
              <select 
                value={datePreset}
                onChange={e => handlePresetChange(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '4px 2px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="hoy">Hoy</option>
                <option value="7">Últimos 7 días</option>
                <option value="15">Últimos 15 días</option>
                <option value="30">Último 1 mes</option>
                <option value="ytd">Este año</option>
                <option value="custom">Personalizado...</option>
              </select>
            </div>

            {datePreset === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '4px 6px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <input type="date" className="filter-input-date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '4px 2px', outline: 'none' }} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0 4px' }}>-</span>
                <input type="date" className="filter-input-date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '4px 2px', outline: 'none' }} />
              </div>
            )}
          </div>

          {/* MULTISELECT PRODUCTOS */}
          <div style={{ position: 'relative' }}>
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid rgba(0,0,0,0.1)' }}
              onClick={() => setProductDropdownOpen(!productDropdownOpen)}
            >
              <Filter size={14} /> 
              {selectedProductIds.length === 0 ? 'Todos los productos' : `${selectedProductIds.length} seleccionados`}
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </button>

            {productDropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setProductDropdownOpen(false)} />
                <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', minWidth: '220px', zIndex: 100, padding: '0.5rem 0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                  <div 
                    className="dropdown-item" 
                    onClick={() => setSelectedProductIds([])}
                  >
                    <div className="checkbox-box">{selectedProductIds.length === 0 && <Check size={12} />}</div>
                    <span>Todos los productos</span>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '0.25rem 0' }} />
                  {products.map(p => {
                    const isSelected = selectedProductIds.includes(p.id)
                    return (
                      <div 
                        key={p.id} 
                        className="dropdown-item"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProductIds(prev => prev.filter(id => id !== p.id))
                          } else {
                            setSelectedProductIds(prev => [...prev, p.id])
                          }
                        }}
                      >
                        <div className={`checkbox-box ${isSelected ? 'active' : ''}`}>{isSelected && <Check size={12} color="white" />}</div>
                        <span style={{ fontSize: '0.8rem' }}>{p.name}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nuevo Registro
          </button>
        </div>
      </div>

      {/* Error State */}
      {serverError && (
        <div className="alert-banner critical" style={{ marginBottom: '2rem' }}>
          <div className="alert-content">
            <p className="alert-title">Error de Conexión</p>
            <p className="alert-detail">{serverError}</p>
          </div>
        </div>
      )}

      {/* Empty State / No products */}
      {!loading && products.length === 0 && (
        <div className="alert-banner critical" style={{ marginBottom: '2rem' }}>
          <div className="alert-content">
            <p className="alert-title">Configuración necesaria</p>
            <p className="alert-detail">Crea tu primer producto en la sección de configuración para empezar.</p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-container" style={{ marginBottom: '2rem' }}>
          {alerts.map((a, i) => (
            <div key={i} className={`alert-banner ${a.severity}`}>
              <div className="alert-content">
                <p className="alert-title">{a.message}</p>
                {a.detail && <p className="alert-detail">{a.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      {loading ? (
        <div className="empty-state"><div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(123, 97, 255, 0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>
      ) : metrics.length === 0 ? (
        <div className="empty-state glass-panel" style={{ padding: '4rem' }}>
          <Archive size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
          <p className="page-title" style={{ fontSize: '1.25rem' }}>No hay datos suficientes</p>
          <p className="page-subtitle">Registra tu primera venta para ver el análisis.</p>
        </div>
      ) : (
        <>
          {selectedProductIds.length === 1 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <BreakevenSimulator product={products.find(p => p.id === selectedProductIds[0])} />
            </div>
          )}

          <div className="kpi-grid">
            <KpiCard label="Beneficio Acumulado" value={formatCurrency(totalProfit)}
              color="var(--color-primary)" trend={totalProfit >= 0 ? 'up' : 'down'} sub={`${metrics.length} días`} />
            <KpiCard label="Ingresos Brutos" value={formatCurrency(totalRevenue)} color="var(--color-info)" />
            <KpiCard label="Total Pedidos" value={totalOrders.toString()} color="var(--color-primary-light)" />
            <KpiCard label="Tasa de Entrega" value={formatPercent(avgDelivery)}
              color="var(--color-success)" trend={avgDelivery >= 70 ? 'up' : 'down'} />
            <KpiCard label="ROAS Promedio" value={avgROAS.toFixed(2) + 'x'} color="var(--color-primary)" />
            {last && (
              <KpiCard label="Último Beneficio" value={formatCurrency(last.profit)}
                color="var(--color-primary)" sub={`CPA: ${formatCurrency(last.cpa)}`} />
            )}
          </div>

          <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <div className="chart-card glass-panel" style={{ height: '350px' }}>
              <div className="chart-header"><span className="chart-title">Pedidos</span></div>
              <div className="chart-body" style={{ height: '280px' }}><DailyOrdersChart metrics={metrics} /></div>
            </div>
            <div className="chart-card glass-panel" style={{ height: '350px' }}>
              <div className="chart-header"><span className="chart-title">Ingresos</span></div>
              <div className="chart-body" style={{ height: '280px' }}><DailyRevenueChart metrics={metrics} /></div>
            </div>
            <div className="chart-card glass-panel" style={{ height: '350px' }}>
              <div className="chart-header"><span className="chart-title">Beneficio Diario</span></div>
              <div className="chart-body" style={{ height: '280px' }}><DailyProfitChart metrics={metrics} /></div>
            </div>
            <div className="chart-card glass-panel" style={{ height: '350px' }}>
              <div className="chart-header"><span className="chart-title">Beneficio Acumulado</span></div>
              <div className="chart-body" style={{ height: '280px' }}><CumulativeProfitChart metrics={metrics} /></div>
            </div>
            {/* Nuevas gráficas agregadas */}
            <div className="chart-card glass-panel" style={{ height: '350px' }}>
              <div className="chart-header"><span className="chart-title">Ads vs Beneficio Neto</span></div>
              <div className="chart-body" style={{ height: '280px' }}><AdsVsProfitChart metrics={metrics} /></div>
            </div>
            <div className="chart-card glass-panel" style={{ height: '350px' }}>
              <div className="chart-header"><span className="chart-title">Eficiencia: CPA vs ROAS</span></div>
              <div className="chart-body" style={{ height: '280px' }}><CpaVsRoasChart metrics={metrics} /></div>
            </div>
            <div className="chart-card glass-panel" style={{ height: '350px' }}>
              <div className="chart-header"><span className="chart-title">Entregados vs Devueltos</span></div>
              <div className="chart-body" style={{ height: '280px' }}><DeliveredVsReturnsChart metrics={metrics} /></div>
            </div>
            <div className="chart-card glass-panel" style={{ height: '350px' }}>
              <div className="chart-header"><span className="chart-title">Ventas por Variante</span></div>
              <div className="chart-body" style={{ height: '280px' }}><VariantDistributionPieChart metrics={metrics} /></div>
            </div>
          </div>

          <div className="table-wrapper glass-panel" style={{ marginTop: '3rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  {selectedProductIds.length !== 1 && <th>Producto</th>}
                  <th>Recibidos</th>
                  <th>Entregados</th>
                  <th>Ingresos</th>
                  <th>Beneficio</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {metrics.slice(-20).reverse().map((m, idx) => {
                  const st = getDayStatus(m)
                  return (
                    <tr key={`${m.recordId}-${idx}`}>
                      <td style={{ fontWeight: 500 }}>{new Date(m.date).toLocaleDateString()}</td>
                      {selectedProductIds.length !== 1 && <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{m.productName}</td>}
                      <td>{m.orders}</td>
                      <td>{m.delivered}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(m.revenue)}</td>
                      <td style={{ color: m.profit >= 0 ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>{formatCurrency(m.profit)}</td>
                      <td><span className={`status-badge ${st.status}`}>{st.label}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        {m.recordId && (
                          <button style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleDelete(m.recordId!)}><Trash2 size={16} /></button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Asistente IA */}
      <AIAssistant context={{ metrics, products, totalProfit }} />

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: background 0.2s;
          color: var(--color-text-secondary);
        }
        .dropdown-item:hover {
          background: rgba(123,97,255,0.05);
          color: var(--color-primary);
        }
        .checkbox-box {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .checkbox-box.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }
      `}</style>
    </>
  )
}
