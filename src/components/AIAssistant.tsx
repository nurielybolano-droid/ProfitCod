'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIAssistantProps {
  context: any // Current dashboard metrics
}

export default function AIAssistant({ context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-trigger initial summary
  useEffect(() => {
    if (context && !hasTriggered) {
      setTimeout(() => {
        setIsOpen(true)
        handleSendMessage('Hola, dame un resumen rápido del estado actual de mi negocio.', true)
        setHasTriggered(true)
      }, 1500)
    }
  }, [context, hasTriggered])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (text: string, isInitial = false) => {
    if (!text.trim()) return
    
    const newMessages = isInitial ? [] : [...messages, { role: 'user', content: text } as Message]
    if (!isInitial) {
      setMessages(newMessages)
      setInput('')
    }
    
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: isInitial ? [{ role: 'user', content: text }] : newMessages,
          context
        })
      })

      if (!res.ok) throw new Error('Error en la comunicación con el asistente')
      
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.content }])
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: 'Lo siento, he tenido un problema conectando con mi cerebro central. 🧠❌' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`ai-assistant-wrapper ${isOpen ? 'open' : ''}`}>
      {/* Floating Toggle */}
      <button
        className={`ai-toggle-btn ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir asistente AI"
      >
        <span className="ai-toggle-glow" />
        <span className="ai-toggle-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/chatbot.webp" alt="ProfitCod AI" className="ai-toggle-img" />
        </span>
        {messages.length === 0 && !loading && <span className="ai-pulse" />}
      </button>

      {/* Chat Panel */}
      <div className="ai-panel glass-panel">
        <div className="ai-header">
          <div className="ai-title">
            <span className="ai-status-dot" />
            Asistente ProfitCod
          </div>
          <button className="ai-close" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <div className="ai-messages" ref={scrollRef}>
          {messages.length === 0 && !loading && (
            <div className="ai-placeholder">
              Analizando tus métricas... 🧪
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`ai-message ${m.role}`}>
              <div className="ai-message-bubble">
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant">
              <div className="ai-message-bubble typing">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
        </div>

        <div className="ai-actions">
          <button className="ai-action-chip" onClick={() => handleSendMessage('¿Cómo va mi CPA promedio?')}>CPA Promedio</button>
          <button className="ai-action-chip" onClick={() => handleSendMessage('¿Qué producto tiene mejor margen?')}>Mejor Margen</button>
        </div>

        <form className="ai-input-area" onSubmit={(e) => { e.preventDefault(); handleSendMessage(input) }}>
          <input 
            type="text" 
            placeholder="Pregúntame algo..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? '...' : '→'}
          </button>
        </form>
      </div>

      <style jsx>{`
        /* ── Wrapper: float animation ── */
        .ai-assistant-wrapper {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1000;
          animation: bot-float 4s ease-in-out infinite;
        }

        @keyframes bot-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }

        /* ── Glow halo behind button ── */
        .ai-toggle-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(123,97,255,0.4) 0%, transparent 68%);
          animation: glow-pulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1);    }
          50%       { opacity: 1;    transform: scale(1.18); }
        }

        /* ── Toggle Button: gradient acts as the spinning ring via padding ── */
        .ai-toggle-btn {
          position: relative;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: none;
          /* gradient background visible only through the 3px padding gap */
          background: linear-gradient(135deg, #7B61FF 0%, #9F7AEA 55%, #56CCF2 100%);
          padding: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          animation: ring-spin 6s linear infinite;
          box-shadow: 0 6px 24px rgba(123, 97, 255, 0.45);
        }

        .ai-toggle-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 30px rgba(123, 97, 255, 0.6);
        }

        .ai-toggle-btn.is-open {
          box-shadow: 0 0 0 4px rgba(123, 97, 255, 0.25), 0 8px 30px rgba(123, 97, 255, 0.5);
        }

        @keyframes ring-spin {
          from { background-position: 0% 50%; }
          to   { background-position: 100% 50%; }
        }

        /* ── Inner white circle that holds the image ── */
        .ai-toggle-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #fff;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── The chatbot image ── */
        .ai-toggle-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
        }

        /* ── Pulse ring (new message indicator) ── */
        .ai-pulse {
          position: absolute;
          width: calc(100% + 14px);
          height: calc(100% + 14px);
          border-radius: 50%;
          border: 2px solid #7B61FF;
          z-index: 2;
          pointer-events: none;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.7); opacity: 0;   }
        }

        .ai-panel {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 360px;
          height: 500px;
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: bottom right;
          overflow: hidden;
        }

        .ai-assistant-wrapper.open .ai-panel {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .ai-header {
          padding: 1rem 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .ai-title {
          font-weight: 600;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ai-status-dot {
          width: 8px;
          height: 8px;
          background: #2ed47a;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(46, 212, 122, 0.5);
        }

        .ai-close {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-size: 1rem;
        }

        .ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          scrollbar-width: thin;
        }

        .ai-message {
          max-width: 85%;
          display: flex;
        }

        .ai-message.user {
          margin-left: auto;
          flex-direction: row-reverse;
        }

        .ai-message-bubble {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .ai-message.assistant .ai-message-bubble {
          background: rgba(255,255,255,0.4);
          color: var(--color-text-primary);
          border-top-left-radius: 2px;
        }

        .ai-message.user .ai-message-bubble {
          background: var(--color-primary);
          color: white;
          border-top-right-radius: 2px;
        }

        .ai-actions {
          padding: 0.5rem 1rem;
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .ai-action-chip {
          background: rgba(123, 97, 255, 0.1);
          border: 1px solid rgba(123, 97, 255, 0.2);
          color: var(--color-primary);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-action-chip:hover {
          background: var(--color-primary);
          color: white;
        }

        .ai-input-area {
          padding: 1rem;
          display: flex;
          gap: 0.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .ai-input-area input {
          flex: 1;
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.3);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          outline: none;
        }

        .ai-input-area button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-primary);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .typing span {
          animation: blink 1.4s infinite both;
          font-size: 1.5rem;
          line-height: 0;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
