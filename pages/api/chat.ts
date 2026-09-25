import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  content?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only POST requests are allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages, system } = req.body

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' })
    }

    if (!system) {
      return res.status(400).json({ error: 'System prompt is required' })
    }

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not set')
      return res.status(500).json({ error: 'OpenRouter API key is not configured' })
    }

    // Make request to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finwise-ai.vercel.app',
        'X-Title': 'FinWise AI',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: system,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenRouter API error:', errorData)
      return res.status(response.status).json({
        error: errorData.error?.message || 'Failed to get AI response',
      })
    }

    const data = await response.json()

    // Extract content from response
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return res.status(500).json({ error: 'No response from AI' })
    }

    res.status(200).json({ content })
  } catch (error) {
    console.error('Chat API error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
