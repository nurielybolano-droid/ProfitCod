import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Error de configuración: API Key faltante' }, { status: 500 })
    }

    // System Prompt construction with user context
    const systemPrompt = `
      Eres el "Bot de Ayuda ProfitCod", un asistente financiero experto en eCommerce y Cash on Delivery (COD). 
      Tu objetivo es analizar los datos del usuario y darle consejos procesables, directos y humanos.
      
      CONEXTO DEL NEGOCIO:
      ${JSON.stringify(context || {}, null, 2)}
      
      INSTRUCCIONES:
      - Responde siempre en Español.
      - Sé profesional pero cercano.
      - Si es tu primer mensaje (resumen inicial), sé muy breve (máximo 3-4 líneas).
      - Identifica tendencias (mejora de margen, aumento de CPA, etc.) y menciónalas.
      - Ofrece siempre profundizar en datos específicos (precios, ads, productos).
      - No inventes datos que no estén en el contexto.
    `.trim()

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('DeepSeek Error:', errorData)
      return NextResponse.json({ error: 'Error en la IA: ' + (errorData.error?.message || response.statusText) }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data.choices[0].message)
  } catch (error: any) {
    console.error('AI_CHAT_ERR:', error)
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 })
  }
})
