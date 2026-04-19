import React from 'react'

export interface FormState {
  name: string
  units: string
  pvp: string
  costProduct: string
  iva: string
  cpa: string
  costEnvio: string
  feeCod: string
  rateShipping: string
  rateDelivery: string
  costReturn: string
  fixedCostDaily: string
}

const n = (v: any) => parseFloat(v) || 0
const fmt = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function calcBreakevenMetrics(f: FormState) {
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

  const pp       = costUnit * units
  const ivaAmt   = pp * (iva / 100)
  const cpaReal  = (rateShip > 0 && rateDel > 0) ? cpa / (rateShip * rateDel) : 0
  const getTotal = rateDel > 0 ? (costEnvio / rateDel) + feeCod + ((1 - rateDel) / rateDel) * costReturn : 0
  
  const profit   = pvp - ivaAmt - pp - cpaReal - getTotal
  const margin   = pvp > 0 ? (profit / pvp) * 100 : 0
  const roi      = pp > 0 ? (profit / pp) * 100 : 0
  const fixedCostDaily = Math.max(0, n(f.fixedCostDaily))
  
  const simIngresos = pvp * rateShip * rateDel
  const simCv = (pp * 1.21 + feeCod) * rateShip * rateDel + costEnvio * rateShip
  const simNetProfit = simIngresos - simCv
  const simNetMargin = pvp > 0 ? simNetProfit / pvp : 0
  const simRoasBep = simNetMargin > 0 ? 1 / simNetMargin : 0
  const simPm = simNetProfit > 0 ? fixedCostDaily / simNetProfit : 0

  return { pp, ivaAmt, cpaReal, getTotal, profit, margin, roi, fixedCostDaily, simIngresos, simCv, simNetProfit, simNetMargin, simRoasBep, simPm }
}

export function MetricBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: 'primary'|'success'|'warning'|'danger' }) {
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

export function RefCalc({ label, value, formula, accent }: { label: string; value: string; formula: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? 'rgba(123,97,255,0.07)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '0.6rem 0.75rem', border: `1px solid ${accent ? 'rgba(123,97,255,0.15)' : 'rgba(0,0,0,0.05)'}` }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>{formula}</div>
    </div>
  )
}

export default function BreakevenSimulator({ product }: { product: any }) {
  if (!product) return null

  // Mapeamos el producto de Prisma a FormState para usar el calculo unificado
  const formState: FormState = {
    name: product.name,
    units: String(product.units ?? 1),
    pvp: String(product.pvp),
    costProduct: String(product.costProduct),
    iva: String(product.iva ?? 0),
    cpa: String(product.cpa ?? 0),
    costEnvio: String(product.costEnvio),
    feeCod: String(product.feeCod),
    rateShipping: String(product.rateShipping ?? 100),
    rateDelivery: String(product.rateDelivery ?? 100),
    costReturn: String(product.costReturn ?? 0),
    fixedCostDaily: String(product.fixedCostDaily ?? 30),
  }

  const metrics = calcBreakevenMetrics(formState)

  return (
    <div className="glass-panel cfg-metrics-card">
      <div className="cfg-metrics-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--color-primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg> 
        Simulador de Breakeven para <b>{product.name}</b>
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

      <style jsx>{`
        .cfg-metrics-card { padding: 1.5rem; border-radius: 1.25rem; }
        .cfg-metrics-title { font-size: 0.82rem; font-weight: 700; color: var(--color-text-secondary); }
        .cfg-ref-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; }
        .cfg-metrics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.75rem; }
        @media (max-width: 768px) {
          .cfg-metrics-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
