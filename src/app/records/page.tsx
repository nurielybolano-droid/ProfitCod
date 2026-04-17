'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductInfo {
  id: string; name: string; pvp: number; costProduct: number; units: number
  costShipping: number; feeCod: number; iva: number; cpa: number
  rateShipping: number; rateDelivery: number
}

interface RawRecord {
  id: string; date: string
  productId: string;  product:  ProductInfo
  product2Id?: string; product2?: ProductInfo | null
  ordersReceived1: number;  ordersReceived2: number
  ordersConfirmed1: number; ordersConfirmed2: number
  ordersShipped: number
  ordersDelivered1: number; ordersDelivered2: number
  returns: number; adsSpend: number; fixedCosts: number; notes?: string | null
}

// ─── Calculator ───────────────────────────────────────────────────────────────

function calcRow(r: RawRecord, cumulativeProfit: number) {
  const p1 = r.product;   const p2 = r.product2
  const pvp1 = p1.pvp;    const pvp2 = p2?.pvp     ?? 0
  const pp1  = p1.costProduct * (p1.units || 1) * 1.21
  const pp2  = p2 ? p2.costProduct * (p2.units || 2) * 1.21 : 0

  const totalRecibidos  = r.ordersReceived1  + r.ordersReceived2
  const totalConfirmados = r.ordersConfirmed1 + r.ordersConfirmed2
  const totalEntregados = r.ordersDelivered1 + r.ordersDelivered2

  const pctConf     = totalRecibidos  > 0 ? (totalConfirmados / totalRecibidos) * 100 : 0
  const pctEnvio    = totalRecibidos  > 0 ? (r.ordersShipped  / totalRecibidos) * 100 : 0

  const factEstimada = r.ordersConfirmed1 * pvp1 + r.ordersConfirmed2 * pvp2
  const pendiente    = r.ordersShipped - totalEntregados - r.returns
  const factReal     = r.ordersDelivered1 * pvp1 + r.ordersDelivered2 * pvp2

  const costeProd    = r.ordersDelivered1 * pp1 + r.ordersDelivered2 * pp2
  const costeEnvio   = r.ordersShipped * p1.costShipping
  const comisionCOD  = totalEntregados * p1.feeCod

  const gastosTotales = costeProd + costeEnvio + comisionCOD + r.adsSpend + r.fixedCosts
  const beneficioNeto = factReal - gastosTotales
  const resultAcum    = cumulativeProfit + beneficioNeto

  const roi           = gastosTotales > 0  ? (beneficioNeto / gastosTotales) * 100 : 0
  const cpaEstimado   = totalRecibidos  > 0 ? r.adsSpend / totalRecibidos  : 0
  const cpaReal       = totalEntregados > 0 ? r.adsSpend / totalEntregados : 0
  const tasaEntrega   = r.ordersShipped > 0 ? (totalEntregados / r.ordersShipped) * 100 : 0

  return {
    totalRecibidos, totalConfirmados, totalEntregados,
    pctConf, pctEnvio, factEstimada, pendiente, factReal,
    costeProd, costeEnvio, comisionCOD,
    gastosTotales, beneficioNeto, resultAcum,
    roi, cpaEstimado, cpaReal, tasaEntrega,
  }
}

function n(v: string) { return parseFloat(v) || 0 }
function f2(v: number) { return v.toFixed(2) }
function f1(v: number) { return v.toFixed(1) }

// ─── Empty Form ───────────────────────────────────────────────────────────────

const EMPTY = {
  productId: '', product2Id: '', date: new Date().toISOString().split('T')[0],
  ordersReceived1: '', ordersReceived2: '',
  ordersConfirmed1: '', ordersConfirmed2: '',
  ordersShipped: '',
  ordersDelivered1: '', ordersDelivered2: '',
  returns: '', adsSpend: '', fixedCosts: '', notes: '',
}
type FormState = typeof EMPTY

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecordsPage() {
  const [records,   setRecords]   = useState<RawRecord[]>([])
  const [products,  setProducts]  = useState<ProductInfo[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [editing,   setEditing]   = useState<RawRecord | null>(null)
  const [form,      setForm]      = useState<FormState>(EMPTY)
  const [error,     setError]     = useState('')

  // ── Selected product objects for live preview ──
  const prod1 = products.find(p => p.id === form.productId)  ?? null
  const prod2 = products.find(p => p.id === form.product2Id) ?? null

  // ── Live preview metrics ──
  const preview = useMemo(() => {
    if (!prod1) return null
    const mock: RawRecord = {
      id: '__preview', date: form.date,
      productId: form.productId, product: prod1 as ProductInfo,
      product2Id: form.product2Id || undefined, product2: prod2 as ProductInfo | null,
      ordersReceived1:  n(form.ordersReceived1),  ordersReceived2:  n(form.ordersReceived2),
      ordersConfirmed1: n(form.ordersConfirmed1), ordersConfirmed2: n(form.ordersConfirmed2),
      ordersShipped:    n(form.ordersShipped),
      ordersDelivered1: n(form.ordersDelivered1), ordersDelivered2: n(form.ordersDelivered2),
      returns: n(form.returns), adsSpend: n(form.adsSpend), fixedCosts: n(form.fixedCosts),
    }
    return calcRow(mock, 0)
  }, [form, prod1, prod2])

  // ── Rows with cumulative profit ──
  const rows = useMemo(() => {
    let acc = 0
    return records.map(r => {
      const calc = calcRow(r, acc)
      acc = calc.resultAcum
      return { r, calc }
    })
  }, [records])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [recRes, prodRes] = await Promise.all([fetch('/api/records'), fetch('/api/products')])
      const recData  = await recRes.json()
      const prodData = await prodRes.json()
      setRecords(Array.isArray(recData)  ? recData  : [])
      setProducts(Array.isArray(prodData) ? prodData : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const resetForm = () => { setForm(EMPTY); setEditing(null); setError('') }

  const loadEdit = (r: RawRecord) => {
    setEditing(r)
    setForm({
      productId: r.productId, product2Id: r.product2Id ?? '',
      date: r.date.split('T')[0],
      ordersReceived1:  String(r.ordersReceived1),  ordersReceived2:  String(r.ordersReceived2),
      ordersConfirmed1: String(r.ordersConfirmed1), ordersConfirmed2: String(r.ordersConfirmed2),
      ordersShipped:    String(r.ordersShipped),
      ordersDelivered1: String(r.ordersDelivered1), ordersDelivered2: String(r.ordersDelivered2),
      returns: String(r.returns), adsSpend: String(r.adsSpend),
      fixedCosts: String(r.fixedCosts), notes: r.notes ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    const payload = {
      productId: form.productId, product2Id: form.product2Id || null,
      date: form.date,
      ordersReceived1:  n(form.ordersReceived1),  ordersReceived2:  n(form.ordersReceived2),
      ordersConfirmed1: n(form.ordersConfirmed1), ordersConfirmed2: n(form.ordersConfirmed2),
      ordersShipped:    n(form.ordersShipped),
      ordersDelivered1: n(form.ordersDelivered1), ordersDelivered2: n(form.ordersDelivered2),
      returns: n(form.returns), adsSpend: n(form.adsSpend),
      fixedCosts: n(form.fixedCosts), notes: form.notes || null,
    }
    try {
      const url    = editing ? `/api/records/${editing.id}` : '/api/records'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al guardar') }
      resetForm(); fetchData()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch(`/api/records/${id}`, { method: 'DELETE' })
    fetchData()
  }

  // ── Section label helper ───────────────────────────────────────────────────
  const SL = ({ children }: { children: React.ReactNode }) => (
    <div className="rec-section-label">{children}</div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Registros Diarios</h1>
          <p className="page-subtitle">Seguimiento operativo por producto y variante de unidades.</p>
        </div>
      </div>

      <div className="rec-layout">
        {/* ── LEFT: Form ─────────────────────────────────────────────────── */}
        <div className="rec-form-col">
          <div className="glass-panel rec-form-card">
            <h3 className="rec-form-title">
              <span className="rec-dot" />
              {editing ? 'Editar Registro' : 'Nuevo Registro'}
            </h3>

            <form onSubmit={handleSubmit} noValidate>
              {/* ── General ── */}
              <SL>📋 General</SL>
              <div className="form-group">
                <label className="form-label">Producto Principal (1 unidad)</label>
                <select className="form-input" value={form.productId} onChange={set('productId')} required>
                  <option value="">— Selecciona producto —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (×{p.units})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Producto Variante (2 unidades, opcional)</label>
                <select className="form-input" value={form.product2Id} onChange={set('product2Id')}>
                  <option value="">— Sin variante —</option>
                  {products.filter(p => p.id !== form.productId).map(p => (
                    <option key={p.id} value={p.id}>{p.name} (×{p.units})</option>
                  ))}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input type="date" className="form-input" value={form.date} onChange={set('date')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Publicidad (€)</label>
                  <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={form.adsSpend} onChange={set('adsSpend')} required />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Gastos Fijos (€)</label>
                  <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={form.fixedCosts} onChange={set('fixedCosts')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <input type="text" className="form-input" placeholder="..." value={form.notes} onChange={set('notes')} />
                </div>
              </div>

              {/* ── Recibidos ── */}
              <SL>📥 Pedidos Recibidos</SL>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Recibidos 1ud</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersReceived1} onChange={set('ordersReceived1')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Recibidos 2ud</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersReceived2} onChange={set('ordersReceived2')} />
                </div>
              </div>

              {/* ── Confirmados ── */}
              <SL>✅ Pedidos Confirmados</SL>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Confirmados 1ud</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersConfirmed1} onChange={set('ordersConfirmed1')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmados 2ud</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersConfirmed2} onChange={set('ordersConfirmed2')} />
                </div>
              </div>

              {/* ── Enviados ── */}
              <SL>🚚 Pedidos Enviados</SL>
              <div className="form-group">
                <label className="form-label">Total Enviados</label>
                <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersShipped} onChange={set('ordersShipped')} />
              </div>

              {/* ── Entregados ── */}
              <SL>📦 Pedidos Entregados</SL>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Entregados 1ud</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersDelivered1} onChange={set('ordersDelivered1')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Entregados 2ud</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersDelivered2} onChange={set('ordersDelivered2')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Devoluciones</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.returns} onChange={set('returns')} />
                </div>
              </div>

              {error && <p className="rec-error">{error}</p>}

              <div className="rec-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? '✓ Actualizar' : '+ Guardar Registro'}
                </button>
                {editing && (
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                )}
              </div>
            </form>
          </div>

          {/* ── Live Preview ── */}
          {preview && (
            <div className="glass-panel rec-preview-card">
              <div className="rec-preview-title">⚡ Vista Previa del Registro</div>
              <div className="rec-preview-grid">
                <PreviewCell label="Recibidos"    value={String(preview.totalRecibidos)} />
                <PreviewCell label="% Conf."      value={`${f1(preview.pctConf)}%`} />
                <PreviewCell label="% Envío"      value={`${f1(preview.pctEnvio)}%`} />
                <PreviewCell label="Pend. Entregar" value={String(preview.pendiente)} />
                <PreviewCell label="Fact. Est."   value={`${f2(preview.factEstimada)} €`} color="blue" />
                <PreviewCell label="Fact. Real"   value={`${f2(preview.factReal)} €`} color="blue" />
                <PreviewCell label="Coste Prod."  value={`${f2(preview.costeProd)} €`} color="red" />
                <PreviewCell label="Coste Envío"  value={`${f2(preview.costeEnvio)} €`} color="red" />
                <PreviewCell label="Comisión COD" value={`${f2(preview.comisionCOD)} €`} color="red" />
                <PreviewCell label="Gastos Tot."  value={`${f2(preview.gastosTotales)} €`} color="red" />
                <PreviewCell label="Beneficio"    value={`${f2(preview.beneficioNeto)} €`} color={preview.beneficioNeto >= 0 ? 'green' : 'red'} />
                <PreviewCell label="ROI"          value={`${f1(preview.roi)}%`} color={preview.roi >= 0 ? 'green' : 'red'} />
                <PreviewCell label="CPA Est."     value={`${f2(preview.cpaEstimado)} €`} />
                <PreviewCell label="CPA Real"     value={`${f2(preview.cpaReal)} €`} />
                <PreviewCell label="Tasa Entrega" value={`${f1(preview.tasaEntrega)}%`} color={preview.tasaEntrega >= 70 ? 'green' : 'red'} />
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Table ────────────────────────────────────────────────── */}
        <div className="rec-table-col">
          {loading ? (
            <div className="rec-spinner-wrap"><div className="rec-spinner" /></div>
          ) : records.length === 0 ? (
            <div className="glass-panel rec-empty">
              <span className="rec-empty-icon">📋</span>
              <p>No hay registros aún.</p>
            </div>
          ) : (
            <div className="rec-table-wrap glass-panel">
              <div className="rec-table-scroll">
                <table className="rec-table">
                  <thead>
                    <tr>
                      <th className="th-sticky">Fecha</th>
                      <th className="th-sticky">Producto</th>
                      {/* Inputs */}
                      <th className="th-input">Rec. 1ud</th>
                      <th className="th-input">Rec. 2ud</th>
                      <th className="th-input">Conf. 1ud</th>
                      <th className="th-input">Conf. 2ud</th>
                      <th className="th-calc">% Conf</th>
                      <th className="th-input">Enviados</th>
                      <th className="th-calc">% Envío/Rec</th>
                      <th className="th-calc th-money">Fact. Est.</th>
                      <th className="th-input">Entr. 1ud</th>
                      <th className="th-input">Entr. 2ud</th>
                      <th className="th-calc">Pend.</th>
                      <th className="th-calc th-money">Fact. Real</th>
                      <th className="th-calc th-money">Coste Prod.</th>
                      <th className="th-calc th-money">Coste Envío</th>
                      <th className="th-calc th-money">Comis. COD</th>
                      <th className="th-input">Devol.</th>
                      <th className="th-input th-money">Publicidad</th>
                      <th className="th-input th-money">G. Fijos</th>
                      <th className="th-calc th-money">G. Totales</th>
                      <th className="th-kpi th-money">Beneficio</th>
                      <th className="th-kpi th-money">Resultado Acum.</th>
                      <th className="th-kpi">ROI %</th>
                      <th className="th-kpi">CPA Est.</th>
                      <th className="th-kpi">CPA Real</th>
                      <th className="th-kpi">T. Entrega</th>
                      <th className="th-actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ r, calc }) => (
                      <tr key={r.id}>
                        <td className="td-sticky td-date">{new Date(r.date).toLocaleDateString('es-ES')}</td>
                        <td className="td-sticky td-product">
                          <div className="td-product-name">{r.product.name}</div>
                          {r.product2 && <div className="td-product-badge">{r.product2.name}</div>}
                        </td>
                        <td>{r.ordersReceived1}</td>
                        <td>{r.ordersReceived2}</td>
                        <td>{r.ordersConfirmed1}</td>
                        <td>{r.ordersConfirmed2}</td>
                        <td className="td-calc">{f1(calc.pctConf)}%</td>
                        <td>{r.ordersShipped}</td>
                        <td className="td-calc">{f1(calc.pctEnvio)}%</td>
                        <td className="td-calc td-money">{f2(calc.factEstimada)} €</td>
                        <td>{r.ordersDelivered1}</td>
                        <td>{r.ordersDelivered2}</td>
                        <td className="td-calc">{calc.pendiente}</td>
                        <td className="td-calc td-money">{f2(calc.factReal)} €</td>
                        <td className="td-calc td-money">{f2(calc.costeProd)} €</td>
                        <td className="td-calc td-money">{f2(calc.costeEnvio)} €</td>
                        <td className="td-calc td-money">{f2(calc.comisionCOD)} €</td>
                        <td>{r.returns}</td>
                        <td className="td-money">{f2(r.adsSpend)} €</td>
                        <td className="td-money">{f2(r.fixedCosts)} €</td>
                        <td className="td-calc td-money">{f2(calc.gastosTotales)} €</td>
                        <td className={`td-kpi ${calc.beneficioNeto >= 0 ? 'td-pos' : 'td-neg'}`}>{f2(calc.beneficioNeto)} €</td>
                        <td className={`td-kpi ${calc.resultAcum >= 0 ? 'td-pos' : 'td-neg'}`}>{f2(calc.resultAcum)} €</td>
                        <td className={`td-kpi ${calc.roi >= 0 ? 'td-pos' : 'td-neg'}`}>{f1(calc.roi)}%</td>
                        <td className="td-kpi">{f2(calc.cpaEstimado)} €</td>
                        <td className="td-kpi">{f2(calc.cpaReal)} €</td>
                        <td className={`td-kpi ${calc.tasaEntrega >= 70 ? 'td-pos' : 'td-neg'}`}>{f1(calc.tasaEntrega)}%</td>
                        <td>
                          <div className="td-btns">
                            <button className="td-btn-edit" onClick={() => loadEdit(r)}>✏️</button>
                            <button className="td-btn-del"  onClick={() => handleDelete(r.id)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* ── Layout ── */
        .rec-layout {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 2rem;
          align-items: start;
        }
        .rec-form-col { display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: 2rem; }
        .rec-table-col { min-width: 0; }

        /* ── Form Card ── */
        .rec-form-card { padding: 1.75rem; }
        .rec-form-title {
          display: flex; align-items: center; gap: 0.6rem;
          font-size: 1rem; margin-bottom: 1.25rem; color: var(--color-text-primary);
        }
        .rec-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--color-primary-gradient);
          box-shadow: 0 0 8px rgba(123,97,255,0.5);
        }
        .rec-section-label {
          font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--color-text-muted);
          margin: 1.1rem 0 0.4rem;
        }
        .rec-error {
          color: var(--color-danger); font-size: 0.8rem;
          background: rgba(255,77,77,0.08); border-radius: 8px;
          padding: 0.5rem 0.75rem; margin-bottom: 0.75rem;
        }
        .rec-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; }
        .rec-actions .btn { flex: 1; }

        /* ── Preview Card ── */
        .rec-preview-card { padding: 1.25rem; }
        .rec-preview-title {
          font-size: 0.8rem; font-weight: 700; color: var(--color-text-secondary);
          margin-bottom: 0.85rem;
        }
        .rec-preview-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;
        }

        /* ── Table ── */
        .rec-table-wrap { overflow: hidden; border-radius: var(--radius-md); }
        .rec-table-scroll { overflow-x: auto; }
        .rec-table {
          width: max-content; min-width: 100%;
          border-collapse: collapse; font-size: 0.75rem;
        }
        .rec-table th {
          padding: 10px 12px; white-space: nowrap; text-align: center;
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; color: var(--color-text-muted);
          border-bottom: 2px solid rgba(0,0,0,0.06);
          position: relative;
        }
        .rec-table td {
          padding: 9px 12px; text-align: center; white-space: nowrap;
          border-bottom: 1px solid rgba(0,0,0,0.03);
          color: var(--color-text-secondary);
        }
        .rec-table tbody tr:hover { background: rgba(123,97,255,0.03); }

        /* Column color coding */
        .th-input  { background: rgba(86,204,242,0.06); color: #2980b9 !important; }
        .th-calc   { background: rgba(123,97,255,0.06); color: var(--color-primary) !important; }
        .th-kpi    { background: rgba(46,212,122,0.07); color: #27ae60 !important; }
        .th-money  { }
        .th-actions { min-width: 80px; }

        .td-calc  { background: rgba(123,97,255,0.03); color: var(--color-primary); }
        .td-money { font-weight: 600; }
        .td-kpi   { font-weight: 700; }
        .td-pos   { color: #27ae60; }
        .td-neg   { color: var(--color-danger); }

        /* Sticky first 2 columns */
        .th-sticky, .td-sticky {
          position: sticky; background: rgba(255,255,255,0.95); z-index: 2;
        }
        .th-sticky:nth-child(1), .td-sticky:nth-child(1) { left: 0; min-width: 90px; }
        .th-sticky:nth-child(2), .td-sticky:nth-child(2) { left: 90px; min-width: 140px; border-right: 1px solid rgba(0,0,0,0.06); }

        .td-date { font-weight: 600; font-size: 0.78rem; }
        .td-product-name { font-weight: 600; color: var(--color-primary); font-size: 0.78rem; }
        .td-product-badge {
          font-size: 0.6rem; font-weight: 700; color: #9F7AEA;
          margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em;
        }

        .td-btns { display: flex; gap: 0.35rem; justify-content: center; }
        .td-btn-edit, .td-btn-del {
          padding: 3px 8px; border-radius: 6px; cursor: pointer;
          font-size: 0.75rem; transition: all 0.15s;
        }
        .td-btn-edit { background: rgba(123,97,255,0.1); border: 1px solid rgba(123,97,255,0.2); }
        .td-btn-edit:hover { background: var(--color-primary); color: white; }
        .td-btn-del  { background: rgba(255,77,77,0.08); border: 1px solid rgba(255,77,77,0.15); color: var(--color-danger); }
        .td-btn-del:hover  { background: var(--color-danger); color: white; }

        /* ── States ── */
        .rec-spinner-wrap { display: flex; justify-content: center; padding: 4rem; }
        .rec-spinner {
          width: 36px; height: 36px; border: 3px solid rgba(123,97,255,0.15);
          border-top-color: var(--color-primary); border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .rec-empty { padding: 3rem; text-align: center; color: var(--color-text-secondary); }
        .rec-empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
          .rec-layout { grid-template-columns: 1fr; }
          .rec-form-col { position: static; }
        }
      `}</style>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type CellColor = 'green' | 'red' | 'blue' | 'default'
const CELL_COLORS: Record<CellColor, { bg: string; text: string }> = {
  green:   { bg: 'rgba(46,212,122,0.1)',  text: '#27ae60' },
  red:     { bg: 'rgba(255,77,77,0.08)',  text: '#c0392b' },
  blue:    { bg: 'rgba(86,204,242,0.1)',  text: '#2980b9' },
  default: { bg: 'rgba(0,0,0,0.03)',      text: 'var(--color-text-secondary)' },
}

function PreviewCell({ label, value, color = 'default' }: { label: string; value: string; color?: CellColor }) {
  const { bg, text } = CELL_COLORS[color]
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '6px 8px' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: text }}>{value}</div>
    </div>
  )
}
