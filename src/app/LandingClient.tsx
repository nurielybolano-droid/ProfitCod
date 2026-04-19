'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BarChart3, 
  Check, 
  TrendingUp, 
  Calendar, 
  Layers, 
  Clock, 
  ChevronRight, 
  Zap, 
  Users,
  Star,
  Activity,
  ArrowRight,
  Calculator,
  ShieldCheck,
  FileText
} from 'lucide-react'

export default function LandingClient() {
  const [simulator, setSimulator] = useState({
    precio: 29.99,
    coste: 8.50,
    envio: 3.20,
    cpa: 5.00,
    devolucion: 12,
    iva: 21
  })

  const [results, setResults] = useState({
    impDev: 0,
    impIva: 0,
    profit: 0,
    roi: 0
  })

  useEffect(() => {
    const impDev = simulator.precio * (simulator.devolucion / 100)
    const impIva = simulator.precio * (simulator.iva / 100)
    const profit = simulator.precio - simulator.coste - simulator.envio - simulator.cpa - impDev - impIva
    const roi = simulator.coste > 0 ? (profit / simulator.coste) * 100 : 0
    
    setResults({ impDev, impIva, profit, roi })
  }, [simulator])

  const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="landing-page" style={{ background: 'var(--night)', color: 'var(--text)' }}>
      <style jsx>{`
        .landing-page { font-family: 'DM Sans', sans-serif; }
        
        /* NAV */
        nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 6vw;
          position: sticky; top: 0; z-index: 100;
          background: rgba(6, 13, 20, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.35rem; letter-spacing: -0.02em; }
        .logo span { color: var(--mint); }
        .nav-links { display: flex; gap: 2rem; list-style: none; }
        .nav-links a { color: var(--muted2); font-size: .9rem; font-weight: 400; transition: color .2s; }
        .nav-links a:hover { color: var(--text); }
        .nav-right { display: flex; gap: 1rem; align-items: center; }

        /* HERO */
        .hero-section {
          max-width: 1100px; margin: 0 auto;
          padding: 5.5rem 6vw 4rem;
          display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: .5rem;
          background: rgba(0, 200, 150, 0.08); border: 1px solid rgba(0, 200, 150, 0.2);
          color: var(--mint); padding: .3rem .85rem; border-radius: 100px;
          font-size: .78rem; font-weight: 500; margin-bottom: 1.5rem; letter-spacing: .02em;
        }
        .badge-dot { width: 6px; height: 6px; background: var(--mint); border-radius: 50%; animation: blink 2s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: .3 } }
        
        .hero-content h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 3.8vw, 3.4rem);
          font-weight: 800; line-height: 1.07; letter-spacing: -0.03em;
          margin-bottom: 1.2rem;
        }
        .hero-content h1 em { font-style: normal; color: var(--mint); }
        .hero-content p { color: var(--muted2); font-size: 1rem; line-height: 1.7; margin-bottom: 2rem; max-width: 440px; }
        .hero-btns { display: flex; gap: .85rem; flex-wrap: wrap; }
        
        .social-proof { display: flex; align-items: center; gap: .75rem; margin-top: 1.75rem; }
        .avatars { display: flex; }
        .avatar {
          width: 30px; height: 30px; border-radius: 50%;
          border: 2px solid var(--night);
          margin-left: -8px; font-size: .65rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .avatar:first-child { margin-left: 0; }

        /* DASHBOARD MOCKUP */
        .dash {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px; padding: 1.25rem;
        }
        .dash-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .dash-title { font-family: 'Syne', sans-serif; font-size: .78rem; font-weight: 700; color: var(--muted2); letter-spacing: .05em; text-transform: uppercase; }
        .dash-range { background: var(--surface2); border: 1px solid var(--border); border-radius: 5px; padding: .22rem .6rem; font-size: .7rem; color: var(--muted2); }
        .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; margin-bottom: .8rem; }
        .kpi-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: .7rem .8rem; }
        .kpi-lbl { font-size: .65rem; color: var(--muted); margin-bottom: .25rem; text-transform: uppercase; letter-spacing: .04em; }
        .kpi-num { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 700; }
        .g { color: var(--mint); } .r { color: var(--accent); } .w { color: var(--text); }

        /* LOGOS SCROLL */
        .logos-wrap { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 1.1rem 6vw; overflow: hidden; }
        .logos-scroll { display: flex; gap: 3rem; align-items: center; animation: scroll 22s linear infinite; white-space: nowrap; }
        @keyframes scroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .plat { display: flex; align-items: center; gap: .5rem; color: var(--muted); font-size: .82rem; font-weight: 500; }
        .plat-ic { width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: .6rem; font-weight: 700; }

        /* SECTIONS */
        .section { max-width: 1100px; margin: 0 auto; padding: 5rem 6vw; }
        .section-tag { font-size: .75rem; font-weight: 600; color: var(--mint); letter-spacing: .1em; text-transform: uppercase; margin-bottom: .7rem; }
        .section-h { font-family: 'Syne', sans-serif; font-size: clamp(1.7rem, 3vw, 2.6rem); font-weight: 800; letter-spacing: -0.025em; line-height: 1.1; margin-bottom: .9rem; }
        .section-sub { color: var(--muted2); max-width: 500px; line-height: 1.65; margin-bottom: 3rem; font-size: .97rem; }
        
        .feat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .feat-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
          padding: 1.6rem; position: relative; overflow: hidden; transition: border-color .25s, transform .25s;
        }
        .feat-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
        .feat-ic {
          width: 38px; height: 38px; border-radius: 8px;
          background: rgba(0, 200, 150, 0.1); border: 1px solid rgba(0, 200, 150, 0.18);
          display: flex; align-items: center; justify-content: center; margin-bottom: .95rem;
        }

        .how { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 3rem; position: relative; }
        .step { text-align: center; }
        .step-n {
          width: 54px; height: 54px; border-radius: 50%;
          background: rgba(0, 200, 150, 0.08); border: 1px solid rgba(0, 200, 150, 0.25);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.1rem; font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800; color: var(--mint);
        }

        /* SIMULATOR */
        .sim-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-top: 3rem; align-items: start; }
        .sim-form { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.75rem; }
        .sim-result { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.75rem; }
        .res-row { display: flex; justify-content: space-between; align-items: center; padding: .55rem 0; border-bottom: 1px solid var(--border); }
        .roi-badge {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .45rem 1.1rem; border-radius: 100px;
          font-family: 'Syne', sans-serif; font-size: .88rem; font-weight: 700;
          margin-top: 1.25rem; width: 100%; justify-content: center;
        }
        .roi-g { background: rgba(0, 200, 150, 0.1); border: 1px solid rgba(0, 200, 150, 0.25); color: var(--mint); }
        .roi-r { background: rgba(255, 87, 51, 0.1); border: 1px solid rgba(255, 87, 51, 0.25); color: var(--accent); }

        /* PRICING */
        .pricing { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 3rem; text-align: left; }
        .plan { background: var(--night); border: 1px solid var(--border); border-radius: 14px; padding: 1.75rem; position: relative; transition: transform .25s; }
        .plan.star { border-color: rgba(0, 200, 150, 0.4); background: rgba(0, 200, 150, 0.03); }
        .plan-price { font-family: 'Syne', sans-serif; font-size: 2.1rem; font-weight: 800; letter-spacing: -0.02em; }
        
        /* FOOTER */
        footer { border-top: 1px solid var(--border); padding: 2.25rem 6vw; }

        @media(max-width: 800px) {
          .hero-section, .sim-wrap, .feat-grid, .plans, .steps { grid-template-columns: 1fr; gap: 2rem; }
          .nav-links, .dash { display: none; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="logo">Profit<span>Cod</span></div>
        <ul className="nav-links">
          <li><a href="#funciones">Funciones</a></li>
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#simulador">Simulador</a></li>
          <li><a href="#precios">Precios</a></li>
        </ul>
        <div className="nav-right">
          <Link href="/login" className="btn-pill-outline">Iniciar sesión</Link>
          <Link href="/register" className="btn-pill-solid">Crear cuenta</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge"><span className="badge-dot"></span> Nuevo: Dashboard con comparativa por fechas</div>
          <h1>Sabe exactamente cuánto ganas de <em>verdad</em> con tus ventas</h1>
          <p>ProfitCod calcula tu beneficio real restando todos los costes ocultos: producto, envíos, devoluciones, COD, IVA y publicidad. Sin hojas de Excel complicadas.</p>
          <div className="hero-btns">
            <Link href="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 1.75rem' }}>Empieza gratis — 14 días</Link>
            <button className="btn btn-outline" style={{ fontSize: '1rem', padding: '0.8rem 1.6rem' }}>Ver demo en vivo</button>
          </div>
          <div className="social-proof">
            <div className="avatars">
              <div className="avatar" style={{ background: '#3B6D11', color: '#C0DD97' }}>CR</div>
              <div className="avatar" style={{ background: '#185FA5', color: '#B5D4F4' }}>ML</div>
              <div className="avatar" style={{ background: '#854F0B', color: '#FAC775' }}>SA</div>
              <div className="avatar" style={{ background: '#3C3489', color: '#CECBF6' }}>PG</div>
            </div>
            <p style={{ fontSize: '.8rem', color: 'var(--muted2)' }}><strong>+2.400 vendedores</strong> ya conocen su profit real</p>
          </div>
        </div>

        <div className="dash">
          <div className="dash-top">
            <span className="dash-title">Panel de control</span>
            <span className="dash-range">Últimos 30 días</span>
          </div>
          <div className="kpis">
            <div className="kpi-box">
              <div className="kpi-lbl">Beneficio neto</div>
              <div className="kpi-num g">€4.280</div>
              <div style={{ fontSize: '.62rem', color: 'var(--mint)', marginTop: '.1rem' }}>+18% vs anterior</div>
            </div>
            <div className="kpi-box">
              <div className="kpi-lbl">ROI publicidad</div>
              <div className="kpi-num w">3.2x</div>
              <div style={{ fontSize: '.62rem', color: 'var(--muted2)', marginTop: '.1rem' }}>ROAS real</div>
            </div>
            <div className="kpi-box">
              <div className="kpi-lbl">Devoluciones</div>
              <div className="kpi-num r">12%</div>
              <div style={{ fontSize: '.62rem', color: 'var(--accent)', marginTop: '.1rem' }}>−3% objetivo</div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '0.8rem' }}>
            <div className="kpi-lbl">Beneficio vs inversión publicitaria</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '60px', marginTop: '0.5rem' }}>
              {[35, 48, 42, 62, 55, 70, 78, 32, 68, 75, 85, 90].map((h, i) => (
                <div key={i} style={{ flex: 1, background: i === 7 ? 'var(--accent)' : 'var(--mint)', height: `${h}%`, borderRadius: '3px 3px 0 0', opacity: i < 3 ? 0.3 : 1 }}></div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div className="kpi-box">
              <div className="kpi-lbl">Margen bruto</div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', margin: '0.4rem 0' }}>
                <div style={{ height: '100%', background: 'var(--mint)', width: '64%', borderRadius: '100px' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem' }}>
                <span color="var(--muted2)">Objetivo 60%</span>
                <span style={{ fontWeight: 700, color: 'var(--mint)' }}>64%</span>
              </div>
            </div>
            <div className="kpi-box">
              <div className="kpi-lbl">Tasa entrega</div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', margin: '0.4rem 0' }}>
                <div style={{ height: '100%', background: '#EF9F27', width: '88%', borderRadius: '100px' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem' }}>
                <span color="var(--muted2)">Meta 90%</span>
                <span style={{ fontWeight: 700, color: '#EF9F27' }}>88%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PLATFORMS */}
      <div className="logos-wrap">
        <div className="logos-scroll">
          {[
            { n: 'Amazon', c: '#FF9900', i: 'A' },
            { n: 'Shopify', c: '#96BF48', i: 'S' },
            { n: 'eBay', c: '#E53238', i: 'e' },
            { n: 'MercadoLibre', c: '#3483FA', i: 'M' },
            { n: 'WooCommerce', c: '#2D3277', i: 'W' },
            { n: 'Facebook Ads', c: '#E77600', i: 'Fb' },
            { n: 'Google Ads', c: '#4285F4', i: 'G' },
          ].concat([
            { n: 'Amazon', c: '#FF9900', i: 'A' },
            { n: 'Shopify', c: '#96BF48', i: 'S' },
            { n: 'eBay', c: '#E53238', i: 'e' },
            { n: 'MercadoLibre', c: '#3483FA', i: 'M' },
            { n: 'WooCommerce', c: '#2D3277', i: 'W' },
            { n: 'Facebook Ads', c: '#E77600', i: 'Fb' },
            { n: 'Google Ads', c: '#4285F4', i: 'G' },
          ]).map((p, i) => (
            <div className="plat" key={i}>
              <div className="plat-ic" style={{ background: p.c, color: '#fff' }}>{p.i}</div> {p.n}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="funciones">
        <div className="section-tag">Funciones principales</div>
        <h2 className="section-h">Todo lo que necesitas para<br />conocer tu negocio real</h2>
        <p className="section-sub">Olvídate de fórmulas manuales y datos dispersos. ProfitCod centraliza y automatiza todos los cálculos financieros de tu tienda online.</p>

        <div className="feat-grid">
          {[
            { 
              t: 'Rentabilidad real por producto', 
              d: 'Calcula tu margen de beneficio neto restando automáticamente todos los costes: precio de compra, envío, comisión de plataforma, recargo COD, devoluciones esperadas e impuestos.',
              tags: ['Profit neto', 'ROI automático', 'Margen %', 'Por producto'],
              ic: <TrendingUp size={18} color="var(--mint)" />
            },
            { 
              t: 'Registro de operaciones diarias', 
              d: 'Anota cada día tus campañas: pedidos recibidos, unidades entregadas, devoluciones e inversión publicitaria. Visualiza al instante si estás en verde o en rojo.',
              tags: ['Control diario', 'Campañas', 'Devoluciones', 'CPA real'],
              ic: <BarChart3 size={18} color="var(--mint)" />
            },
            { 
              t: 'Simulador e historial por variantes', 
              d: 'Configura diferentes packs de tu producto — "1 unidad", "Pack x2", "Pack x3" — y simula la rentabilidad de cada opción antes de lanzar tu campaña.',
              tags: ['Packs y variantes', 'Simulador', 'Historial', 'Comparativa'],
              ic: <Layers size={18} color="var(--mint)" />
            },
            { 
              t: 'Dashboard visual con gráficos', 
              d: 'Panel de control con gráficas claras: beneficio vs inversión publicitaria, distribución de ventas y devoluciones, y filtros por rango de fechas personalizado.',
              tags: ['Dashboard', 'Gráficas', 'Filtros por fecha', 'Exportar'],
              ic: <Activity size={18} color="var(--mint)" />
            }
          ].map((f, i) => (
            <div className="feat-card" key={i}>
              <div className="feat-ic">{f.ic}</div>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>{f.t}</h3>
              <p style={{ fontSize: '.875rem', color: 'var(--muted2)', lineHeight: 1.6 }}>{f.d}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginTop: '.9rem' }}>
                {f.tags.map(t => <span key={t} className="tag" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.7rem', color: 'var(--muted2)' }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="como-funciona">
        <div className="section" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div className="section-tag">Cómo funciona</div>
          <h2 className="section-h">En marcha en menos de 5 minutos</h2>
          <p className="section-sub">Sin integraciones complejas. Sin datos técnicos. Solo introduce tus números y ProfitCod hace el resto.</p>
          <div className="steps">
            {[
              { n: '01', t: 'Configura tu producto', d: 'Introduce el coste, precio de venta, gastos de envío y porcentaje de devoluciones habitual.' },
              { n: '02', t: 'Registra tus campañas', d: 'Cada día anota los pedidos, entregas y lo que invertiste en publicidad. En menos de 2 minutos.' },
              { n: '03', t: 'Conoce tu beneficio real', d: 'ProfitCod calcula al instante tu profit neto, ROI y margen. Sin fórmulas, sin errores.' }
            ].map((s, i) => (
              <div className="step" key={i}>
                <div className="step-n">{s.n}</div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.45rem' }}>{s.t}</h4>
                <p style={{ fontSize: '.85rem', color: 'var(--muted2)', maxWidth: '220px', margin: '0 auto' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULATOR */}
      <section className="section" id="simulador">
        <div className="section-tag">Simulador de rentabilidad</div>
        <h2 className="section-h">Calcula tu beneficio antes<br />de invertir un euro</h2>
        <p className="section-sub">Introduce los datos de tu producto y descubre al instante si tu campaña es rentable.</p>
        <div className="sim-wrap">
          <div className="sim-form">
            <h4 style={{ marginBottom: '1.25rem', color: 'var(--muted2)', fontSize: '.88rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Datos del producto</h4>
            {[
              { l: 'Precio de venta (€)', k: 'precio' },
              { l: 'Coste del producto (€)', k: 'coste' },
              { l: 'Coste de envío (€)', k: 'envio' },
              { l: 'Inversión publicitaria / CPA (€)', k: 'cpa' },
              { l: 'Tasa de devolución (%)', k: 'devolucion' },
              { l: 'IVA / impuestos (%)', k: 'iva' }
            ].map(f => (
              <div className="form-group" key={f.k} style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '.78rem', color: 'var(--muted2)', display: 'block', marginBottom: '0.3rem' }}>{f.l}</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={simulator[f.k as keyof typeof simulator]} 
                  onChange={e => setSimulator({ ...simulator, [f.k]: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>

          <div className="sim-result">
            <div style={{ marginBottom: '1.5rem', color: 'var(--muted2)', fontSize: '.88rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>Resultado del análisis</div>
            {[
              { l: 'Precio de venta', v: `€${fmt(simulator.precio)}` },
              { l: 'Coste del producto', v: `−€${fmt(simulator.coste)}` },
              { l: 'Coste de envío', v: `−€${fmt(simulator.envio)}` },
              { l: 'Inversión publicitaria', v: `−€${fmt(simulator.cpa)}` },
              { l: 'Impacto devoluciones', v: `−€${fmt(results.impDev)}` },
              { l: 'IVA / impuestos', v: `−€${fmt(results.impIva)}` }
            ].map((r, i) => (
              <div className="res-row" key={i}>
                <span style={{ fontSize: '.88rem', color: 'var(--muted2)' }}>{r.l}</span>
                <span style={{ fontWeight: 700 }}>{r.v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.9rem', marginTop: '0.2rem' }}>
              <span style={{ fontWeight: 500 }}>Beneficio neto real</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: results.profit >= 0 ? 'var(--mint)' : 'var(--accent)' }}>
                {results.profit < 0 ? '−' : ''}€{fmt(Math.abs(results.profit))}
              </span>
            </div>
            <div className={`roi-badge ${results.profit > 0 ? 'roi-g' : results.profit < 0 ? 'roi-r' : 'roi-n'}`}>
              ROI: {results.roi.toFixed(1)}% — {results.profit > 0 ? 'Campaña rentable' : results.profit < 0 ? 'No es rentable' : 'Punto de equilibrio'}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="precios">
        <div className="section" style={{ textAlign: 'center' }}>
          <div className="section-tag">Planes y precios</div>
          <h2 className="section-h">Empieza gratis. Escala cuando crezcas.</h2>
          <p className="section-sub" style={{ margin: '0 auto 3rem' }}>Sin contratos anuales. Sin sorpresas. Cancela cuando quieras.</p>

          <div className="plans">
            {[
              { t: 'Starter', d: 'Para empezar a vender con cabeza', p: '0', l: ['Hasta 3 productos', 'Simulador de rentabilidad', 'Registro diario (30 días)', 'Dashboard básico'] },
              { t: 'Pro', d: 'Para vendedores activos que necesitan control total', p: '29', star: true, l: ['Productos ilimitados', 'Variantes y packs ilimitados', 'Historial completo', 'Dashboard avanzado con gráficas', 'Exportación a Excel/CSV', 'Soporte prioritario'] },
              { t: 'Business', d: 'Para equipos y marcas con múltiples tiendas', p: '79', l: ['Todo lo del plan Pro', 'Hasta 5 usuarios', 'Múltiples tiendas', 'Informes automatizados', 'API de acceso', 'Onboarding personalizado'] }
            ].map((p, i) => (
              <div className={`plan ${p.star ? 'star' : ''}`} key={i}>
                {p.star && <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: 'var(--mint)', color: 'var(--night)', fontSize: '.7rem', fontWeight: 700, padding: '.28rem .85rem', borderRadius: '100px', whiteSpace: 'nowrap', fontFamily: 'Syne' }}>Más popular</div>}
                <div style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'Syne' }}>{p.t}</div>
                <div style={{ color: 'var(--muted2)', fontSize: '.82rem', margin: '.35rem 0 .8rem', lineHeight: 1.5 }}>{p.d}</div>
                <div className="plan-price">€{p.p} <span style={{ fontSize: '.9rem', fontWeight: 400, color: 'var(--muted2)' }}>/ mes</span></div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '1.2rem 0' }}></div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {p.l.map(li => <li key={li} style={{ fontSize: '.85rem', color: 'var(--muted2)', display: 'flex', alignItems: 'flex-start', gap: '.5rem' }}><Check size={14} color="var(--mint)" style={{ marginTop: '3px' }} /> {li}</li>)}
                </ul>
                <Link href="/register" className={`btn ${p.star ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', marginTop: '1.5rem' }}>{p.p === '0' ? 'Empezar gratis' : 'Prueba 14 días gratis'}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section">
        <div className="section-tag">Testimonios</div>
        <h2 className="section-h">Vendedores que ya conocen<br />su profit real</h2>
        <div className="feat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '3rem' }}>
          {[
            { a: 'Carlos R.', r: 'Vendedor en Shopify — Moda', t: '"Llevaba meses pensando que ganaba dinero. Con ProfitCod descubrí que mis devoluciones y el COD me estaban comiendo el margen. En dos semanas ajusté mi precio y ahora sí soy rentable."' },
            { a: 'María L.', r: 'Dropshipper — Electrónica', t: '"El simulador de variantes es increíble. Ahora antes de lanzar cualquier campaña pruebo qué pack me da más margen. Ha cambiado completamente cómo tomo decisiones."' },
            { a: 'Sergio A.', r: 'Tienda propia — Suplementos', t: '"Antes usaba Excel y siempre me olvidaba algún gasto. ProfitCod lo centraliza todo y el dashboard me da en un vistazo si el día fue bueno o malo. Imprescindible."' }
          ].map((t, i) => (
            <div className="glass-panel" key={i} style={{ padding: '1.4rem' }}>
              <div style={{ color: 'var(--mint)', marginBottom: '0.85rem' }}><Star size={14} fill="var(--mint)" stroke="none" style={{ display: 'inline-block', marginRight: '2px' }} /><Star size={14} fill="var(--mint)" stroke="none" style={{ display: 'inline-block', marginRight: '2px' }} /><Star size={14} fill="var(--mint)" stroke="none" style={{ display: 'inline-block', marginRight: '2px' }} /><Star size={14} fill="var(--mint)" stroke="none" style={{ display: 'inline-block', marginRight: '2px' }} /><Star size={14} fill="var(--mint)" stroke="none" /></div>
              <p style={{ fontSize: '.9rem', fontStyle: 'italic', marginBottom: '1.2rem', lineHeight: 1.65 }}>{t.t}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.75rem', color: 'var(--mint)', border: '1px solid var(--border)' }}>{t.a.split(' ').map(x => x[0]).join('')}</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '.85rem' }}>{t.a}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--muted2)' }}>{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ textAlign: 'center', padding: '6rem 6vw' }}>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, fontFamily: 'Syne' }}>¿Listo para conocer tu<br />beneficio real?</h2>
        <p style={{ color: 'var(--muted2)', margin: '1rem auto 2.25rem', maxWidth: '420px' }}>Empieza gratis hoy. Sin tarjeta de crédito. Sin compromisos. Solo números reales.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>Crear cuenta gratis</Link>
          <button className="btn btn-outline" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>Ver una demo</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="logo">Profit<span>Cod</span></div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/privacidad" style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Privacidad</Link>
            <Link href="/terminos" style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Términos</Link>
            <Link href="/blog" style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Blog</Link>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '.8rem' }}>© 2025 ProfitCod. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  )
}
