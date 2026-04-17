'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Product } from '@prisma/client'

// ─── Constants ────────────────────────────────────────────────────────────────

/** ENVÍO de referencia con IVA incluido: (5.59 + 0.2) × 1.21 */
const ENVIO_REF = (5.59 + 0.2) * 1.21  // ≈ 7.01 €

const UNIT_OPTIONS = [1, 2, 3, 4, 5]

const EMPTY_FORM = {
  name:         '',
  units:        '1',   // número de unidades del pack
  pvp:          '',
  costProduct:  '',    // coste neto por unidad (sin IVA proveedor)
  iva:          '',    // IVA cobrado al cliente (% sobre PVP)
  cpa:          '',
  costShipping: '',
  feeCod:       '',
  rateShipping: '',
  rateDelivery: '',
  rateReturn:   '',
}
type FormState = typeof EMPTY_FORM

// ─── Calculator ───────────────────────────────────────────────────────────────

function n(v: string | number) { return parseFloat(String(v)) || 0 }
function fmt(v: number, d = 2)  { return v.toFixed(d) }

function calcMetrics(f: FormState) {
  const pvp          = n(f.pvp)
  const costUnit     = n(f.costProduct)
  const units        = Math.max(1, n(f.units))
  const iva          = n(f.iva)
  const cpa          = n(f.cpa)
  const costShipping = n(f.costShipping)
  const feeCod       = n(f.feeCod)
  const rateShip     = n(f.rateShipping) / 100
  const rateDel      = n(f.rateDelivery) / 100

  /** PP = Precio Producto con IVA del proveedor */
  const pp       = costUnit * units * 1.21
  /** IVA cobrado al cliente (porción del PVP que va a Hacienda) */
  const ivaAmt   = pvp * (iva / 100)
  /** CPA Real = CPA nominal ÷ (% envío × % entrega) */
  const cpaReal  = (rateShip > 0 && rateDel > 0) ? cpa / (rateShip * rateDel) : 0
  /** Profit por pedido entregado */
  const profit   = pvp - ivaAmt - pp - cpaReal - costShipping - feeCod
  const margin   = pvp > 0 ? (profit / pvp) * 100 : 0
  const roi      = (pp + cpaReal) > 0 ? (profit / (pp + cpaReal)) * 100 : 0

  return { pp, ivaAmt, cpaReal, profit, margin, roi }
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Submit ─────────────────────────────────────────────────────────────────
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
          costShipping: n(form.costShipping),
          feeCod:       n(form.feeCod),
          rateShipping: n(form.rateShipping),
          rateDelivery: n(form.rateDelivery),
          rateReturn:   n(form.rateReturn),
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

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      name:         p.name,
      units:        String(p.units ?? 1),
      pvp:          String(p.pvp),
      costProduct:  String(p.costProduct),
      iva:          String(p.iva ?? 0),
      cpa:          String(p.cpa ?? 0),
      costShipping: String(p.costShipping),
      feeCod:       String(p.feeCod),
      rateShipping: String(p.rateShipping ?? 100),
      rateDelivery: String(p.rateDelivery ?? 100),
      rateReturn:   String(p.rateReturn ?? 0),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro? Se eliminarán todos los registros de este producto.')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      fetchProducts()
    } catch (e: any) { setError(e.message) }
  }

  const units = Math.max(1, n(form.units))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Productos</h1>
          <p className="page-subtitle">Configura los parámetros económicos de cada producto y variante.</p>
        </div>
      </div>

      <div className="cfg-layout">

        {/* ── LEFT: Form ─────────────────────────────────────────────────── */}
        <div className="cfg-left">
          <div className="glass-panel cfg-form-card">
            <h3 className="cfg-form-title">
              <span className="cfg-form-title-dot" />
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>

            <form onSubmit={handleSubmit} noValidate>

              {/* Nombre */}
              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input className="form-input" placeholder="Ej. Smartwatch Pro X" value={form.name} onChange={set('name')} required />
              </div>

              {/* Unidades */}
              <div className="cfg-section-label">📦 Variante por Unidades</div>
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
                <div className="cfg-units-hint">
                  Pack de <strong>{units}</strong> unidad{units > 1 ? 'es' : ''} · el coste se multiplica automáticamente
                </div>
              </div>

              {/* Precios */}
              <div className="cfg-section-label">💰 Precios</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Precio Venta — PVP (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="29.99" value={form.pvp} onChange={set('pvp')} required />
                  {n(form.pvp) > 0 && (
                    <div className="cfg-calc-tag">PVP = {fmt(n(form.pvp))} €</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Coste unitario neto (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="8.50" value={form.costProduct} onChange={set('costProduct')} required />
                  {n(form.costProduct) > 0 && (
                    <div className="cfg-calc-tag cfg-calc-purple">
                      PP&nbsp;=&nbsp;{fmt(n(form.costProduct))}&nbsp;×&nbsp;{units}&nbsp;×&nbsp;1.21&nbsp;=&nbsp;<b>{fmt(metrics.pp)} €</b>
                    </div>
                  )}
                </div>
              </div>

              {/* Fiscalidad */}
              <div className="cfg-section-label">📊 Fiscalidad &amp; Adquisición</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">IVA cliente (%)</label>
                  <input className="form-input" type="number" step="0.1" min="0" max="100" placeholder="21" value={form.iva} onChange={set('iva')} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPA (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="5.00" value={form.cpa} onChange={set('cpa')} />
                </div>
              </div>

              {/* Logística */}
              <div className="cfg-section-label">🚚 Logística</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Gastos Envío (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="7.01" value={form.costShipping} onChange={set('costShipping')} required />
                  <div className="cfg-envio-ref">
                    Ref.&nbsp;(5.59+0.20)×1.21 = <b>{fmt(ENVIO_REF)} €</b>
                    <button
                      type="button"
                      className="cfg-apply-btn"
                      onClick={() => setForm(f => ({ ...f, costShipping: fmt(ENVIO_REF) }))}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Fee Envío COD (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="1.20" value={form.feeCod} onChange={set('feeCod')} required />
                </div>
              </div>

              {/* Tasas */}
              <div className="cfg-section-label">📦 Tasas Operativas (%)</div>
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
                  <label className="form-label">% Devolución</label>
                  <input className="form-input" type="number" step="0.1" min="0" max="100" placeholder="5" value={form.rateReturn} onChange={set('rateReturn')} />
                </div>
              </div>

              {error && <p className="cfg-error">{error}</p>}

              <div className="cfg-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editingId ? '✓ Actualizar' : '+ Crear Producto'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ── Metrics Preview ── */}
          <div className="glass-panel cfg-metrics-card">
            <div className="cfg-metrics-title"><span>⚡</span> Vista Previa de Métricas</div>

            {/* Campos calculados de referencia */}
            <div className="cfg-ref-row">
              <RefCalc label="PVP" value={`${fmt(n(form.pvp))} €`}   formula="Precio de venta" />
              <RefCalc label="PP"  value={`${fmt(metrics.pp)} €`}    formula={`${fmt(n(form.costProduct))} × ${units} × 1.21`} accent />
              <RefCalc label="ENVÍO ref." value={`${fmt(ENVIO_REF)} €`} formula="(5.59+0.20) × 1.21" />
              <RefCalc label="CPA Real"   value={`${fmt(metrics.cpaReal)} €`} formula={`CPA ÷ (%E × %Ent)`} accent />
            </div>

            <div className="cfg-metrics-grid">
              <MetricBox label="Profit"  value={`${fmt(metrics.profit)} €`} sub="Por pedido entregado"  color={metrics.profit  >= 0  ? 'success' : 'danger'} />
              <MetricBox label="Margen"  value={`${fmt(metrics.margin)} %`} sub="Profit / PVP"          color={metrics.margin  >= 20 ? 'success' : metrics.margin  >= 0 ? 'warning' : 'danger'} />
              <MetricBox label="ROI"     value={`${fmt(metrics.roi)} %`}    sub="Profit / Inversión"    color={metrics.roi     >= 50 ? 'success' : metrics.roi     >= 0 ? 'warning' : 'danger'} />
              <MetricBox label="IVA"     value={`${fmt(metrics.ivaAmt)} €`} sub="Porción PVP → Hacienda" color="primary" />
            </div>

            {/* Breakdown bar */}
            {n(form.pvp) > 0 && (
              <div className="cfg-breakdown">
                <div className="cfg-breakdown-label">Desglose del PVP ({fmt(n(form.pvp))} €)</div>
                <div className="cfg-bar-track">
                  <BarSegment pct={(metrics.ivaAmt   / n(form.pvp)) * 100} color="#FFB800" label="IVA" />
                  <BarSegment pct={(metrics.pp       / n(form.pvp)) * 100} color="#7B61FF" label="PP" />
                  <BarSegment pct={(metrics.cpaReal  / n(form.pvp)) * 100} color="#56CCF2" label="CPA Real" />
                  <BarSegment pct={(n(form.costShipping) / n(form.pvp)) * 100} color="#9F7AEA" label="Envío" />
                  <BarSegment pct={(n(form.feeCod)   / n(form.pvp)) * 100} color="#A0AEC0" label="COD" />
                </div>
                <div className="cfg-bar-legend">
                  <LegendItem color="#FFB800" label={`IVA ${fmt(metrics.ivaAmt)} €`} />
                  <LegendItem color="#7B61FF" label={`PP ${fmt(metrics.pp)} €`} />
                  <LegendItem color="#56CCF2" label={`CPA Real ${fmt(metrics.cpaReal)} €`} />
                  <LegendItem color="#9F7AEA" label={`Envío ${fmt(n(form.costShipping))} €`} />
                  <LegendItem color="#A0AEC0" label={`COD ${fmt(n(form.feeCod))} €`} />
                  <LegendItem color="#2ED47A" label={`Profit ${fmt(metrics.profit)} €`} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Product List ─────────────────────────────────────────── */}
        <div className="cfg-right">
          <h3 className="cfg-list-title">Productos configurados</h3>

          {loading ? (
            <div className="cfg-spinner-wrap"><div className="cfg-spinner" /></div>
          ) : products.length === 0 ? (
            <div className="glass-panel cfg-empty">
              <span className="cfg-empty-icon">📦</span>
              <p>No hay productos aún.</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Crea tu primer producto en el formulario.
              </p>
            </div>
          ) : (
            <div className="cfg-product-list">
              {products.map(p => {
                const pAny = p as any
                const pm = calcMetrics({
                  name: p.name, units: String(pAny.units ?? 1),
                  pvp: String(p.pvp), costProduct: String(p.costProduct),
                  iva: String(pAny.iva ?? 0), cpa: String(pAny.cpa ?? 0),
                  costShipping: String(p.costShipping), feeCod: String(p.feeCod),
                  rateShipping: String(pAny.rateShipping ?? 100),
                  rateDelivery: String(pAny.rateDelivery ?? 100),
                  rateReturn:   String(pAny.rateReturn ?? 0),
                })
                const unitsP = pAny.units ?? 1
                return (
                  <div key={p.id} className="glass-panel cfg-product-card">
                    <div className="cfg-product-header">
                      <div className="cfg-product-name-row">
                        <h4 className="cfg-product-name">{p.name}</h4>
                        {unitsP > 1 && <span className="cfg-units-badge">{unitsP} unds.</span>}
                      </div>
                      <div className="cfg-product-btns">
                        <button className="cfg-btn-edit" onClick={() => handleEdit(p)}>Editar</button>
                        <button className="cfg-btn-del"  onClick={() => handleDelete(p.id)}>✕</button>
                      </div>
                    </div>

                    <div className="cfg-product-inputs">
                      <span>PVP <b>{p.pvp} €</b></span>
                      <span>PP <b>{fmt(pm.pp)} €</b></span>
                      <span>IVA <b>{pAny.iva ?? 0}%</b></span>
                      <span>CPA <b>{pAny.cpa ?? 0} €</b></span>
                      <span>Envío <b>{p.costShipping} €</b></span>
                      <span>COD <b>{p.feeCod} €</b></span>
                      <span>%Env <b>{pAny.rateShipping ?? 100}%</b></span>
                      <span>%Ent <b>{pAny.rateDelivery ?? 100}%</b></span>
                      <span>%Dev <b>{pAny.rateReturn ?? 0}%</b></span>
                    </div>

                    <div className="cfg-product-kpis">
                      <KpiPill label="CPA Real" value={`${fmt(pm.cpaReal)} €`} ok={pm.cpaReal < p.pvp * 0.4} />
                      <KpiPill label="Profit"   value={`${fmt(pm.profit)} €`}  ok={pm.profit >= 0} />
                      <KpiPill label="Margen"   value={`${fmt(pm.margin)} %`}  ok={pm.margin >= 20} />
                      <KpiPill label="ROI"      value={`${fmt(pm.roi)} %`}     ok={pm.roi >= 50} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* ── Layout ── */
        .cfg-layout {
          display: grid;
          grid-template-columns: 500px 1fr;
          gap: 2rem;
          align-items: start;
        }
        .cfg-left  { display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: 2rem; }
        .cfg-right { display: flex; flex-direction: column; gap: 1rem; }

        /* ── Form Card ── */
        .cfg-form-card { padding: 1.75rem; }
        .cfg-form-title {
          display: flex; align-items: center; gap: 0.6rem;
          font-size: 1rem; margin-bottom: 1.5rem; color: var(--color-text-primary);
        }
        .cfg-form-title-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--color-primary-gradient);
          box-shadow: 0 0 8px rgba(123,97,255,0.6);
        }
        .cfg-section-label {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--color-text-muted);
          margin: 1.25rem 0 0.5rem;
        }

        /* ── Units selector ── */
        .cfg-units-row {
          display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.4rem;
        }
        .cfg-unit-btn {
          padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          background: rgba(0,0,0,0.04);
          border: 1.5px solid rgba(0,0,0,0.08);
          color: var(--color-text-secondary);
        }
        .cfg-unit-btn:hover  { border-color: var(--color-primary); color: var(--color-primary); }
        .cfg-unit-btn.active {
          background: var(--color-primary-gradient);
          border-color: transparent; color: white;
          box-shadow: 0 4px 12px rgba(123,97,255,0.35);
        }
        .cfg-units-hint {
          font-size: 0.72rem; color: var(--color-text-muted);
          background: rgba(123,97,255,0.06); border-radius: 6px;
          padding: 4px 10px;
        }

        /* ── Inline calculated tags ── */
        .cfg-calc-tag {
          font-size: 0.7rem; color: var(--color-text-muted);
          margin-top: 4px; padding: 2px 8px;
          background: rgba(0,0,0,0.04); border-radius: 6px;
        }
        .cfg-calc-purple { background: rgba(123,97,255,0.08); color: var(--color-primary); }

        /* ── ENVÍO reference ── */
        .cfg-envio-ref {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.7rem; color: var(--color-text-muted);
          margin-top: 4px; flex-wrap: wrap;
        }
        .cfg-apply-btn {
          font-size: 0.68rem; padding: 2px 8px; border-radius: 10px;
          background: rgba(123,97,255,0.12); border: 1px solid rgba(123,97,255,0.2);
          color: var(--color-primary); cursor: pointer; font-weight: 600;
          transition: all 0.2s;
        }
        .cfg-apply-btn:hover { background: var(--color-primary); color: white; }

        /* ── Error / Actions ── */
        .cfg-error {
          color: var(--color-danger); font-size: 0.82rem;
          background: rgba(255,77,77,0.08); border-radius: 8px;
          padding: 0.5rem 0.75rem; margin-bottom: 0.75rem;
        }
        .cfg-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
        .cfg-actions .btn { flex: 1; }

        /* ── Metrics card ── */
        .cfg-metrics-card { padding: 1.5rem; }
        .cfg-metrics-title {
          font-size: 0.82rem; font-weight: 700; color: var(--color-text-secondary);
          margin-bottom: 1rem; display: flex; align-items: center; gap: 0.4rem;
        }

        /* ── Reference row (PVP / PP / ENVÍO / CPA Real) ── */
        .cfg-ref-row {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 0.5rem; margin-bottom: 1rem;
        }

        /* ── Metrics grid ── */
        .cfg-metrics-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 0.75rem; margin-bottom: 1.25rem;
        }

        /* ── breakdown bar ── */
        .cfg-breakdown { margin-top: 0.5rem; }
        .cfg-breakdown-label {
          font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.5rem;
        }
        .cfg-bar-track {
          display: flex; height: 10px; border-radius: 6px;
          overflow: hidden; background: rgba(0,0,0,0.06);
        }
        .cfg-bar-legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin-top: 0.6rem; }

        /* ── Product list ── */
        .cfg-list-title {
          font-size: 0.9rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 0.75rem;
        }
        .cfg-product-list { display: flex; flex-direction: column; gap: 0.9rem; }
        .cfg-product-card { padding: 1.25rem; }
        .cfg-product-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;
        }
        .cfg-product-name-row { display: flex; align-items: center; gap: 0.5rem; }
        .cfg-product-name { font-size: 0.95rem; font-weight: 700; color: var(--color-primary); }
        .cfg-units-badge {
          font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 10px;
          background: var(--color-primary-gradient); color: white;
        }
        .cfg-product-btns { display: flex; gap: 0.5rem; }
        .cfg-btn-edit {
          font-size: 0.78rem; padding: 4px 12px; border-radius: 20px;
          background: rgba(123,97,255,0.1); border: 1px solid rgba(123,97,255,0.2);
          color: var(--color-primary); cursor: pointer; transition: all 0.2s;
        }
        .cfg-btn-edit:hover { background: var(--color-primary); color: white; }
        .cfg-btn-del {
          font-size: 0.78rem; padding: 4px 10px; border-radius: 20px;
          background: rgba(255,77,77,0.08); border: 1px solid rgba(255,77,77,0.15);
          color: var(--color-danger); cursor: pointer; transition: all 0.2s;
        }
        .cfg-btn-del:hover { background: var(--color-danger); color: white; }
        .cfg-product-inputs {
          display: flex; flex-wrap: wrap; gap: 0.4rem 1rem;
          font-size: 0.78rem; color: var(--color-text-secondary);
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(0,0,0,0.05); margin-bottom: 0.75rem;
        }
        .cfg-product-kpis { display: flex; gap: 0.5rem; flex-wrap: wrap; }

        /* ── States ── */
        .cfg-spinner-wrap { display: flex; justify-content: center; padding: 3rem; }
        .cfg-spinner {
          width: 36px; height: 36px; border: 3px solid rgba(123,97,255,0.15);
          border-top-color: var(--color-primary); border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .cfg-empty {
          padding: 3rem; text-align: center; color: var(--color-text-secondary); font-size: 0.9rem;
        }
        .cfg-empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1200px) {
          .cfg-layout { grid-template-columns: 1fr; }
          .cfg-left { position: static; }
          .cfg-ref-row { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .cfg-ref-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type Color = 'primary' | 'success' | 'warning' | 'danger'
const COLOR_MAP: Record<Color, { bg: string; text: string }> = {
  primary: { bg: 'rgba(123,97,255,0.1)',  text: '#7B61FF' },
  success: { bg: 'rgba(46,212,122,0.1)',  text: '#27ae60' },
  warning: { bg: 'rgba(255,184,0,0.12)',  text: '#b78b00' },
  danger:  { bg: 'rgba(255,77,77,0.1)',   text: '#c0392b' },
}

function MetricBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: Color }) {
  const { bg, text } = COLOR_MAP[color]
  return (
    <div style={{ background: bg, borderRadius: 12, padding: '0.85rem 1rem' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: text, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{sub}</div>
    </div>
  )
}

function RefCalc({ label, value, formula, accent }: { label: string; value: string; formula: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? 'rgba(123,97,255,0.07)' : 'rgba(0,0,0,0.03)',
      borderRadius: 10, padding: '0.6rem 0.75rem',
      border: accent ? '1px solid rgba(123,97,255,0.15)' : '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: accent ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '0.15rem', lineHeight: 1.3 }}>{formula}</div>
    </div>
  )
}

function BarSegment({ pct, color, label }: { pct: number; color: string; label: string }) {
  const c = Math.max(0, Math.min(100, pct))
  if (c <= 0) return null
  return <div title={`${label}: ${pct.toFixed(1)}%`} style={{ width: `${c}%`, background: color, transition: 'width 0.4s ease' }} />
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      {label}
    </div>
  )
}

function KpiPill({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      padding: '4px 10px', borderRadius: 20,
      background: ok ? 'rgba(46,212,122,0.1)' : 'rgba(255,77,77,0.08)',
      border: `1px solid ${ok ? 'rgba(46,212,122,0.2)' : 'rgba(255,77,77,0.15)'}`,
    }}>
      <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: ok ? '#27ae60' : '#c0392b' }}>{value}</span>
    </div>
  )
}
