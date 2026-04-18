'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Product } from '@prisma/client'
import { Package, Banknote, Scale, Truck, Activity, Target, BarChart3, Compass, Archive } from 'lucide-react'

// ——————————————————————————————————————————————————————————————————————————————————————
// Constants
// ——————————————————————————————————————————————————————————————————————————————————————

/** ENVIO de referencia con IVA incluido: (5.59 + 0.2) * 1.21 */
const ENVIO_REF = (5.59 + 0.2) * 1.21  // ~ 7.01 €

const UNIT_OPTIONS = [1, 2, 3, 4, 5]

const EMPTY_FORM = {
  name:         '',
  units:        '1',   // número de unidades del pack
  pvp:          '',
  costProduct:  '',    // coste neto por unidad (sin IVA proveedor)
  iva:          '',    // IVA cobrado al cliente (% sobre PVP)
  cpa:          '',
  costEnvio:    '',    // Envio (€)
  feeCod:       '',
  rateShipping: '',
  rateDelivery: '',
  costReturn:   '',    // Coste Devolución (€)
  fixedCostDaily: '30', // Presupuesto Ads Diario (€)
}
type FormState = typeof EMPTY_FORM

// ——————————————————————————————————————————————————————————————————————————————————————
// Calculator logic
// ——————————————————————————————————————————————————————————————————————————————————————

const n = (v: any) => parseFloat(v) || 0
const fmt = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function calcMetrics(f: FormState) {
  const pvp          = n(f.pvp)
  const costUnit     = n(f.costProduct)
  const units        = Math.max(1, n(f.units))
  const iva          = n(f.iva)
  const cpa          = n(f.cpa)
  const costEnvio    = n(f.costEnvio)
  const feeCod       = n(f.feeCod)
  const rateShip     = n(f.rateShipping) / 100
  const rateDel      = n(f.rateDelivery) / 100
  const costReturn   = n(f.costReturn)

  /** PP = Coste Producto (sin IVA adicional automático) */
  const pp       = costUnit * units
  /** IVA (Calculado sobre el COSTE del producto en base al Excel contable) */
  const ivaAmt   = pp * (iva / 100)
  /** CPA Real = CPA nominal / (% envío * % entrega) */
  const cpaReal  = (rateShip > 0 && rateDel > 0) ? cpa / (rateShip * rateDel) : 0
  
  /** GET = Gastos Envío Total = Envio + COD * % Envío + (1 - % Entrega) * Coste Devolución */
  const getTotal = costEnvio + (feeCod * rateShip) + ((1 - rateDel) * costReturn)
  
  /** Profit por pedido entregado */
  const profit   = pvp - ivaAmt - pp - cpaReal - getTotal
  const margin   = pvp > 0 ? (profit / pvp) * 100 : 0
  const roi      = pp > 0 ? (profit / pp) * 100 : 0
  const fixedCostDaily = Math.max(0, n(f.fixedCostDaily))
  
  // -- Simulador Excel --
  const simIngresos = pvp * rateShip * rateDel
  const simCv = (pp * 1.21 + feeCod) * rateShip * rateDel + costEnvio * rateShip
  const simNetProfit = simIngresos - simCv
  const simNetMargin = pvp > 0 ? simNetProfit / pvp : 0
  const simRoasBep = simNetMargin > 0 ? 1 / simNetMargin : 0
  const simPm = simNetProfit > 0 ? fixedCostDaily / simNetProfit : 0

  return { pp, ivaAmt, cpaReal, getTotal, profit, margin, roi, fixedCostDaily, simIngresos, simCv, simNetProfit, simNetMargin, simRoasBep, simPm }
}

// ——————————————————————————————————————————————————————————————————————————————————————
// Component
// ——————————————————————————————————————————————————————————————————————————————————————

export default function ConfigPage() {
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState<FormState>(EMPTY_FORM)
  const [error,     setError]     = useState('')

  const metrics = useMemo(() => calcMetrics(form), [form])

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  const resetForm = () => { setEditingId(null); setForm(EMPTY_FORM); setError('') }

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/products')
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al cargar') }
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const url    = editingId ? `/api/products/${editingId}` : '/api/products'
      const method = editingId ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         form.name,
          units:        n(form.units),
          pvp:          n(form.pvp),
          costProduct:  n(form.costProduct),
          iva:          n(form.iva),
          cpa:          n(form.cpa),
          costEnvio:    n(form.costEnvio),
          feeCod:       n(form.feeCod),
          rateShipping: n(form.rateShipping),
          rateDelivery: n(form.rateDelivery),
          costReturn:   n(form.costReturn),
          fixedCostDaily: n(form.fixedCostDaily),
        }),
      })
      if (!res.ok) {
        const ct = res.headers.get('content-type')
        const msg = ct?.includes('json') ? (await res.json()).error : `Error ${res.status}`
        throw new Error(msg)
      }
      resetForm(); fetchProducts()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      name:         p.name,
      units:        String(p.units ?? 1),
      pvp:          String(p.pvp),
      costProduct:  String(p.costProduct),
      iva:          String(p.iva ?? 0),
      cpa:          String(p.cpa ?? 0),
      costEnvio:    String(p.costEnvio),
      feeCod:       String(p.feeCod),
      rateShipping: String(p.rateShipping ?? 100),
      rateDelivery: String(p.rateDelivery ?? 100),
      costReturn:   String(p.costReturn ?? 0),
      fixedCostDaily: String(p.fixedCostDaily ?? 30),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro? Se eliminarán todos los registros de este producto.')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      fetchProducts()
    } catch (e: any) { setError(e.message) }
  }

  const units = Math.max(1, n(form.units))

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración de Productos</h1>
          <p className="page-subtitle">Define los costos y parámetros económicos de tus productos.</p>
        </div>
      </div>

      <div className="cfg-layout">
        <div className="cfg-left">
          <div className="glass-panel cfg-form-card">
            <h3 className="cfg-form-title">
              <span className="cfg-form-title-dot" />
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input className="form-input" placeholder="Ej. Smartwatch Pro X" value={form.name} onChange={set('name')} required />
              </div>

              <div className="cfg-section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={14} /> Variante por Unidades
              </div>
              <div className="form-group">
                <label className="form-label">Unidades por pack</label>
                <div className="cfg-units-row">
                  {UNIT_OPTIONS.map(u => (
                    <button
                      key={u}
                      type="button"
                      className={`cfg-unit-btn ${form.units === String(u) ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, units: String(u) }))}
                    >
                      {u === 1 ? '1 und.' : `${u} unds.`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cfg-section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Banknote size={14} /> Precios
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">PVP (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="29.99" value={form.pvp} onChange={set('pvp')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Coste Unitario (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="8.50" value={form.costProduct} onChange={set('costProduct')} required />
                </div>
              </div>

              <div className="cfg-section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scale size={14} /> Fiscalidad & CPA
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">IVA (%)</label>
                  <input className="form-input" type="number" step="0.1" min="0" max="100" placeholder="21" value={form.iva} onChange={set('iva')} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPA (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="5.00" value={form.cpa} onChange={set('cpa')} />
                </div>
              </div>

              <div className="cfg-section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} /> Logística
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Envio (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="7.01" value={form.costEnvio} onChange={set('costEnvio')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">COD Fee (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="1.20" value={form.feeCod} onChange={set('feeCod')} required />
                </div>
              </div>

              <div className="cfg-section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} /> Tasas Operativas (%)
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">% Envío</label>
                  <input className="form-input" type="number" step="0.1" min="0" max="100" placeholder="85" value={form.rateShipping} onChange={set('rateShipping')} />
                </div>
                <div className="form-group">
                  <label className="form-label">% Entrega</label>
                  <input className="form-input" type="number" step="0.1" min="0" max="100" placeholder="70" value={form.rateDelivery} onChange={set('rateDelivery')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Coste Dev (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="2.00" value={form.costReturn} onChange={set('costReturn')} />
                </div>
              </div>

              <div className="cfg-section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={14} /> Simulador & Objetivos
              </div>
              <div className="form-group" style={{maxWidth: '200px'}}>
                <label className="form-label">Publi Diaria (Ads €)</label>
                <input className="form-input" type="number" step="1" min="0" placeholder="30" value={form.fixedCostDaily} onChange={set('fixedCostDaily')} />
              </div>

              {error && <p className="cfg-error">{error}</p>}

              <div className="cfg-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editingId ? '✓ Actualizar' : '+ Crear Producto'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                )}
              </div>
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            <div className="glass-panel cfg-metrics-card">
            <div className="cfg-metrics-title">
              <BarChart3 size={16} style={{ color: 'var(--color-primary)' }} /> Vista Previa de Métricas
            </div>
            <div className="cfg-ref-row">
              <RefCalc label="PVP" value={`${fmt(n(form.pvp))} €`} formula="Precio de venta" />
              <RefCalc label="PP" value={`${fmt(metrics.pp)} €`} formula={`${fmt(n(form.costProduct))} × ${units}`} accent />
              <RefCalc label="GASTOS ENVIO" value={`${fmt(metrics.getTotal)} €`} formula="Envio+(COD*%E)+((1-%Ent)*Dev)" accent />
              <RefCalc label="CPA Real" value={`${fmt(metrics.cpaReal)} €`} formula={`CPA / (%E × %Ent)`} accent />
            </div>

            <div className="cfg-metrics-grid">
              <MetricBox label="Profit" value={`${fmt(metrics.profit)} €`} sub="Por pedido entregado" color={metrics.profit >= 0 ? 'success' : 'danger'} />
              <MetricBox label="Margen" value={`${fmt(metrics.margin)} %`} sub="Profit / PVP" color={metrics.margin >= 20 ? 'success' : metrics.margin >= 0 ? 'warning' : 'danger'} />
              <MetricBox label="ROI" value={`${fmt(metrics.roi)} %`} sub="Profit / Coste Producto" color={metrics.roi >= 50 ? 'success' : metrics.roi >= 0 ? 'warning' : 'danger'} />
              <MetricBox label="IVA" value={`${fmt(metrics.ivaAmt)} €`} sub="Sobre Coste Producto" color="primary" />
            </div>
          </div>

          <div className="glass-panel cfg-metrics-card">
            <div className="cfg-metrics-title">
              <Compass size={16} style={{ color: 'var(--color-primary)' }} /> Simulador de Breakeven
            </div>
            
            <div className="cfg-ref-row">
              <RefCalc label="ING. REALES (x ped)" value={`${fmt(metrics.simIngresos)} €`} formula={`PVP × %E × %Ent`} accent />
              <RefCalc label="CV REALES (x ped)" value={`${fmt(metrics.simCv)} €`} formula={`(PP×1.21+COD)×%E×%Ent + Envío×%E`} accent />
            </div>

            <div className="cfg-metrics-grid">
               <MetricBox label="ROAS BEP" value={`${fmt(metrics.simRoasBep)}`} sub="1 / Margen Neto" color={metrics.simRoasBep > 0 && metrics.simRoasBep < 3 ? 'success' : 'warning'} />
               <MetricBox label="CPA Máx" value={`${fmt(metrics.simNetProfit)} €`} sub="Bº Neto x ped recibido" color="primary" />
               <MetricBox label="PM Pedidos/Día" value={`${fmt(metrics.simPm)}`} sub={`Para cubrir ${metrics.fixedCostDaily}€ Ads`} color={metrics.simPm > 0 ? 'warning' : 'danger'} />
               <MetricBox label="Margen Neto" value={`${fmt(metrics.simNetMargin * 100)} %`} sub="Bº Neto / PVP" color="primary" />
            </div>
          </div>
          </div>
        </div>

        <div className="cfg-right">
          <h3 className="cfg-list-title">Productos configurados</h3>
          {loading ? (
            <div className="cfg-spinner-wrap"><div className="cfg-spinner" /></div>
          ) : products.length === 0 ? (
            <div className="glass-panel cfg-empty" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Archive size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>No hay productos aún.</p>
            </div>
          ) : (
            <div className="cfg-product-list">
              {products.map(p => {
                const pAny = p as any
                const pm = calcMetrics({
                  name: p.name, units: String(pAny.units ?? 1),
                  pvp: String(p.pvp), costProduct: String(p.costProduct),
                  iva: String(pAny.iva ?? 0), cpa: String(pAny.cpa ?? 0),
                  costEnvio: String(pAny.costEnvio), feeCod: String(p.feeCod),
                  rateShipping: String(pAny.rateShipping ?? 100),
                  rateDelivery: String(pAny.rateDelivery ?? 100),
                  costReturn: String(pAny.costReturn ?? 0),
                  fixedCostDaily: String(pAny.fixedCostDaily ?? 30),
                })
                return (
                  <div key={p.id} className="glass-panel cfg-product-card">
                    <div className="cfg-product-header">
                      <div className="cfg-product-name-row">
                        <h4 className="cfg-product-name">{p.name}</h4>
                        {(pAny.units ?? 1) > 1 && <span className="cfg-units-badge">{pAny.units} unds.</span>}
                      </div>
                      <div className="cfg-product-btns">
                        <button className="cfg-btn-edit" onClick={() => handleEdit(p)}>Editar</button>
                        <button className="cfg-btn-del" onClick={() => handleDelete(p.id)}>×</button>
                      </div>
                    </div>
                    <div className="cfg-product-inputs">
                      <span>PVP: <b>{p.pvp} €</b></span>
                      <span>Envio: <b>{pAny.costEnvio} €</b></span>
                      <span>Dev: <b>{pAny.costReturn ?? 0} €</b></span>
                    </div>
                    <div className="cfg-product-kpis">
                      <KpiPill label="Profit" value={`${fmt(pm.profit)} €`} ok={pm.profit >= 0} />
                      <KpiPill label="Margen" value={`${fmt(pm.margin)} %`} ok={pm.margin >= 20} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .cfg-layout { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start; }
        .cfg-left { display: flex; flex-direction: column; gap: 1.5rem; position: relative; }
        .cfg-right { display: flex; flex-direction: column; gap: 1rem; }
        .cfg-form-card { padding: 1.75rem; border-radius: 1.25rem; }
        .cfg-form-title { display: flex; align-items: center; gap: 0.6rem; font-size: 1rem; margin-bottom: 1.5rem; color: var(--color-text-primary); }
        .cfg-form-title-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary-gradient); box-shadow: 0 0 8px rgba(123,97,255,0.6); }
        .cfg-section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-text-muted); margin: 1.25rem 0 0.5rem; }
        .cfg-units-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .cfg-unit-btn { padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.04); border: 1.5px solid rgba(0,0,0,0.08); color: var(--color-text-secondary); }
        .cfg-unit-btn.active { background: var(--color-primary-gradient); border-color: transparent; color: white; box-shadow: 0 4px 12px rgba(123,97,255,0.35); }
        .cfg-error { color: var(--color-danger); font-size: 0.82rem; background: rgba(255,77,77,0.08); border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; }
        .cfg-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
        .cfg-metrics-card { padding: 1.5rem; border-radius: 1.25rem; }
        .cfg-metrics-title { font-size: 0.82rem; font-weight: 700; color: var(--color-text-secondary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.4rem; }
        .cfg-ref-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; }
        .cfg-metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .cfg-product-list { display: flex; flex-direction: column; gap: 0.9rem; }
        .cfg-product-card { padding: 1.25rem; border-radius: 1.25rem; }
        .cfg-product-name { font-size: 0.95rem; font-weight: 700; color: var(--color-primary); }
        .cfg-units-badge { font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: var(--color-primary-gradient); color: white; }
        .cfg-btn-edit { font-size: 0.78rem; padding: 4px 12px; border-radius: 20px; background: rgba(123,97,255,0.1); border: 1px solid rgba(123,97,255,0.2); color: var(--color-primary); cursor: pointer; transition: all 0.2s; }
        .cfg-btn-edit:hover { background: var(--color-primary); color: white; }
        .cfg-btn-del { font-size: 0.78rem; padding: 4px 10px; border-radius: 20px; background: rgba(255,77,77,0.08); border: 1px solid rgba(255,77,77,0.15); color: var(--color-danger); cursor: pointer; transition: all 0.2s; }
        .cfg-btn-del:hover { background: var(--color-danger); color: white; }
        .cfg-product-inputs { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; font-size: 0.78rem; color: var(--color-text-secondary); padding-bottom: 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.05); margin-bottom: 0.75rem; }
        .cfg-product-kpis { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .cfg-spinner { width: 36px; height: 36px; border: 3px solid rgba(123,97,255,0.15); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1200px) { .cfg-layout { grid-template-columns: 1fr; } .cfg-left { position: static; } }
      `}</style>
    </>
  )
}

function MetricBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: 'primary'|'success'|'warning'|'danger' }) {
  const colors = { primary: '#7B61FF', success: '#27ae60', warning: '#b78b00', danger: '#c0392b' }
  const bgs = { primary: 'rgba(123,97,255,0.1)', success: 'rgba(46,212,122,0.1)', warning: 'rgba(255,184,0,0.12)', danger: 'rgba(255,77,77,0.1)' }
  return (
    <div style={{ background: bgs[color], borderRadius: 12, padding: '0.85rem 1rem' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: colors[color] }}>{value}</div>
      <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>{sub}</div>
    </div>
  )
}

function RefCalc({ label, value, formula, accent }: { label: string; value: string; formula: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? 'rgba(123,97,255,0.07)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '0.6rem 0.75rem', border: `1px solid ${accent ? 'rgba(123,97,255,0.15)' : 'rgba(0,0,0,0.05)'}` }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>{formula}</div>
    </div>
  )
}

function KpiPill({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '4px 10px', borderRadius: 20, background: ok ? 'rgba(46,212,122,0.1)' : 'rgba(255,77,77,0.08)', border: `1px solid ${ok ? 'rgba(46,212,122,0.2)' : 'rgba(255,77,77,0.15)'}` }}>
      <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ok ? '#27ae60' : '#c0392b' }}>{value}</span>
    </div>
  )
}
