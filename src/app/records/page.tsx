'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ClipboardList, Inbox, CheckCircle, Truck, PackageCheck, Zap, Clipboard, Edit2, Trash2 } from 'lucide-react'
import { calculateAllMetrics, calculateMetrics, DailyRecord } from '@/lib/calculator'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductInfo {
  id: string; name: string; pvp: number; costProduct: number; units: number
  costEnvio: number; feeCod: number; iva: number; cpa: number
  rateShipping: number; rateDelivery: number
  packEnabled?: boolean; packUnits?: number; packPvp?: number | null
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


function n(v: string) { return parseFloat(v) || 0 }
function f2(v: number | undefined) { return (v ?? 0).toFixed(2) }
function f1(v: number | undefined) { return (v ?? 0).toFixed(1) }

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
    const mock: any = {
      id: '__preview', 
      date: form.date,
      product: prod1,
      product2: prod2 || null,
      ordersReceived1:  n(form.ordersReceived1),  
      ordersReceived2:  n(form.ordersReceived2),
      ordersConfirmed1: n(form.ordersConfirmed1), 
      ordersConfirmed2: n(form.ordersConfirmed2),
      ordersShipped:    n(form.ordersShipped),
      ordersDelivered1: n(form.ordersDelivered1), 
      ordersDelivered2: n(form.ordersDelivered2),
      returns: n(form.returns), 
      adsSpend: n(form.adsSpend), 
      fixedCosts: n(form.fixedCosts),
    }
    const res = calculateMetrics(mock)
    // Combine results for preview total
    if (res.length > 1) {
       const totalOrders = res[0].orders + res[1].orders
       const totalDelivered = res[0].delivered + res[1].delivered
       const totalProfit = res[0].profit + res[1].profit
       const totalInvestment = res[0].totalInvestment + res[1].totalInvestment
       const totalAdsSpend = res[0].adsSpend + res[1].adsSpend
       return {
         ...res[0],
         orders: totalOrders,
         confirmed: res[0].confirmed + res[1].confirmed,
         revenue: res[0].revenue + res[1].revenue,
         profit: totalProfit,
         totalInvestment,
         totalCogs: res[0].totalCogs + res[1].totalCogs,
         totalShippingCost: res[0].totalShippingCost + res[1].totalShippingCost,
         totalCodFee: res[0].totalCodFee + res[1].totalCodFee,
         delivered: totalDelivered,
         shipped: res[0].shipped + res[1].shipped,
         returns: res[0].returns + res[1].returns,
         adsSpend: totalAdsSpend,
         // Derived ratios
         deliveryRate: totalOrders > 0 ? (totalDelivered / totalOrders) * 100 : 0,
         cpa: totalOrders > 0 ? totalAdsSpend / totalOrders : 0,
         roas: totalAdsSpend > 0 ? (res[0].revenue + res[1].revenue) / totalAdsSpend : 0,
         marginPerDelivered: totalDelivered > 0 ? totalProfit / totalDelivered : 0,
       }
    }
    return res[0]
  }, [form, prod1, prod2])

  // ── Rows with cumulative profit ──
  const rows = useMemo(() => {
    return calculateAllMetrics(records)
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
              <SL><ClipboardList size={14} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> General</SL>
              <div className="form-group">
                <label className="form-label">Producto Principal (1 unidad)</label>
                <select className="form-input" value={form.productId} onChange={set('productId')} required>
                  <option value="">— Selecciona producto —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (×{p.units}){p.packEnabled ? ` + Pack ${p.packUnits}ud` : ''}
                    </option>
                  ))}
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
              <SL><Inbox size={14} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Pedidos Recibidos</SL>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Recibidos 1ud
                  </label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersReceived1} onChange={set('ordersReceived1')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: prod1?.packEnabled ? 'var(--color-success)' : 'inherit' }}>
                    {prod1?.packEnabled ? `Recibidos Pack (${prod1.packUnits}ud)` : 'Recibidos 2ud'}
                  </label>
                  <input type="number" min="0" className="form-input" style={{ borderColor: prod1?.packEnabled ? 'rgba(46,212,122,0.3)' : 'inherit' }} placeholder="0" value={form.ordersReceived2} onChange={set('ordersReceived2')} />
                </div>
              </div>

              {/* ── Confirmados ── */}
              <SL><CheckCircle size={14} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Pedidos Confirmados</SL>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Confirmados 1ud</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersConfirmed1} onChange={set('ordersConfirmed1')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: prod1?.packEnabled ? 'var(--color-success)' : 'inherit' }}>
                    {prod1?.packEnabled ? `Confirmados Pack (${prod1.packUnits}ud)` : 'Confirmados 2ud'}
                  </label>
                  <input type="number" min="0" className="form-input" style={{ borderColor: prod1?.packEnabled ? 'rgba(46,212,122,0.3)' : 'inherit' }} placeholder="0" value={form.ordersConfirmed2} onChange={set('ordersConfirmed2')} />
                </div>
              </div>

              {/* ── Enviados ── */}
              <SL><Truck size={14} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Pedidos Enviados</SL>
              <div className="form-group">
                <label className="form-label">Total Enviados</label>
                <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersShipped} onChange={set('ordersShipped')} />
              </div>

              {/* ── Entregados ── */}
              <SL><PackageCheck size={14} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Pedidos Entregados</SL>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Entregados 1ud</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={form.ordersDelivered1} onChange={set('ordersDelivered1')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: prod1?.packEnabled ? 'var(--color-success)' : 'inherit' }}>
                    {prod1?.packEnabled ? `Entregados Pack (${prod1.packUnits}ud)` : 'Entregados 2ud'}
                  </label>
                  <input type="number" min="0" className="form-input" style={{ borderColor: prod1?.packEnabled ? 'rgba(46,212,122,0.3)' : 'inherit' }} placeholder="0" value={form.ordersDelivered2} onChange={set('ordersDelivered2')} />
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
              <div className="rec-preview-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} style={{ color: 'var(--color-primary)' }} /> Vista Previa del Registro
              </div>
              <div className="rec-preview-grid">
                <PreviewCell label="Recibidos"    value={String(preview.orders)} />
                <PreviewCell label="% Conf."      value={`${f1(preview.confirmed > 0 && preview.orders > 0 ? (preview.confirmed / preview.orders) * 100 : 0)}%`} />
                <PreviewCell label="% Envío"      value={`${f1(preview.shipped > 0 && preview.orders > 0 ? (preview.shipped / preview.orders) * 100 : 0)}%`} />
                <PreviewCell label="Pend. Entregar" value={String(preview.shipped - preview.delivered - preview.returns)} />
                <PreviewCell label="Fact. Est."   value={`${f2(preview.revenue)} €`} color="blue" />
                <PreviewCell label="Fact. Real"   value={`${f2(preview.revenue)} €`} color="blue" />
                <PreviewCell label="Coste Prod."  value={`${f2(preview.totalCogs)} €`} color="red" />
                <PreviewCell label="Coste Envío"  value={`${f2(preview.totalShippingCost)} €`} color="red" />
                <PreviewCell label="Comisión COD" value={`${f2(preview.totalCodFee)} €`} color="red" />
                <PreviewCell label="Gastos Tot."  value={`${f2(preview.totalInvestment)} €`} color="red" />
                <PreviewCell label="Beneficio"    value={`${f2(preview.profit)} €`} color={preview.profit >= 0 ? 'green' : 'red'} />
                <PreviewCell label="ROI"          value={`${f1(preview.roas > 0 ? (preview.roas - 1) * 100 : 0)}%`} color={preview.profit >= 0 ? 'green' : 'red'} />
                <PreviewCell label="CPA"          value={`${f2(preview.cpa)} €`} />
                <PreviewCell label="Margen/Ud"    value={`${f2(preview.marginPerDelivered)} €`} />
                <PreviewCell label="Tasa Entrega" value={`${f1(preview.deliveryRate)}%`} color={preview.deliveryRate >= 70 ? 'green' : 'red'} />
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Table ────────────────────────────────────────────────── */}
        <div className="rec-table-col">
          {loading ? (
            <div className="rec-spinner-wrap"><div className="rec-spinner" /></div>
          ) : records.length === 0 ? (
            <div className="glass-panel rec-empty" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <Clipboard size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
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
                      <th className="th-input">Recibidos</th>
                      <th className="th-input">Confirmados</th>
                      <th className="th-calc">% Conf</th>
                      <th className="th-input">Enviados</th>
                      <th className="th-calc">% Envío/Rec</th>
                      <th className="th-calc th-money">Fact. Est.</th>
                      <th className="th-input">Entregados</th>
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
                    {rows.map((m, idx) => (
                      <tr key={`${m.recordId}-${idx}`}>
                        <td className="td-sticky td-date">{new Date(m.date).toLocaleDateString('es-ES')}</td>
                        <td className="td-sticky td-product">
                          <div className="td-product-name">{m.productName}</div>
                        </td>
                        <td>{m.orders}</td>
                        <td>{m.confirmed}</td>
                        <td className="td-calc">{f1(m.deliveryRate)}%</td>
                        <td>{m.shipped}</td>
                        <td className="td-calc">{f1((m.shipped / m.orders) * 100)}%</td>
                        <td className="td-calc td-money">{f2(m.revenue)} €</td>
                        <td>{m.delivered}</td>
                        <td className="td-calc">{m.shipped - m.delivered - m.returns}</td>
                        <td className="td-calc td-money">{f2(m.revenue)} €</td>
                        <td className="td-calc td-money">{f2(m.totalCogs)} €</td>
                        <td className="td-calc td-money">{f2(m.totalShippingCost)} €</td>
                        <td className="td-calc td-money">{f2(m.totalCodFee)} €</td>
                        <td>{m.returns}</td>
                        <td className="td-money">{f2(m.adsSpend)} €</td>
                        <td className="td-money">{f2(m.fixedCosts)} €</td>
                        <td className="td-calc td-money">{f2(m.totalInvestment)} €</td>
                        <td className={`td-kpi ${m.profit >= 0 ? 'td-pos' : 'td-neg'}`}>{f2(m.profit)} €</td>
                        <td className={`td-kpi ${m.cumulativeProfit! >= 0 ? 'td-pos' : 'td-neg'}`}>{f2(m.cumulativeProfit)} €</td>
                        <td className={`td-kpi ${m.roas >= 0 ? 'td-pos' : 'td-neg'}`}>{f1(m.roas * 100)}%</td>
                        <td className="td-kpi">{f2(m.cpa)} €</td>
                        <td className="td-kpi">{f2(m.cpa)} €</td>
                        <td className={`td-kpi ${m.deliveryRate >= 70 ? 'td-pos' : 'td-neg'}`}>{f1(m.deliveryRate)}%</td>
                        <td>
                          <div className="td-btns">
                            {/* Find original record for edit/delete */}
                            {m.recordId && (
                                <>
                                    <button className="td-btn-edit" onClick={() => loadEdit(records.find(r => r.id === m.recordId)!)}><Edit2 size={12} /></button>
                                    <button className="td-btn-del"  onClick={() => handleDelete(m.recordId!)}><Trash2 size={12} /></button>
                                </>
                            )}
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
        .rec-table-wrap { 
          overflow: hidden; 
          border-radius: var(--radius-md);
          max-height: calc(100vh - 220px);
          display: flex;
          flex-direction: column;
        }
        .rec-table-scroll { 
          overflow: auto;
          flex: 1;
        }
        .rec-table {
          width: max-content; min-width: 100%;
          border-collapse: collapse; font-size: 0.75rem;
        }
        .rec-table th {
          padding: 10px 12px; white-space: nowrap; text-align: center;
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; color: var(--color-text-muted);
          border-bottom: 2px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--surface2);
          z-index: 10;
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

        .td-calc  { background: rgba(0, 200, 150, 0.03); color: var(--mint); }
        .td-money { font-weight: 600; color: var(--text); }
        .td-kpi   { font-weight: 700; }
        .td-pos   { color: #27ae60; }
        .td-neg   { color: var(--color-danger); }

        /* Sticky first 2 columns */
        .th-sticky, .td-sticky {
          position: sticky; 
          background: var(--surface) !important; 
          z-index: 5;
        }
        .th-sticky { z-index: 15; } /* Higher than normal th */
        .th-sticky:nth-child(1), .td-sticky:nth-child(1) { left: 0; min-width: 90px; border-right: 1px solid var(--border); }
        .th-sticky:nth-child(2), .td-sticky:nth-child(2) { left: 90px; min-width: 140px; border-right: 1px solid var(--border); }

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
