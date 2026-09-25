import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  forecast?: any
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
    const { historicalData, userId } = req.body

    // Validate required fields
    if (!historicalData) {
      return res.status(400).json({ error: 'Historical data is required' })
    }

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not set')
      return res.status(500).json({ error: 'OpenRouter API key is not configured' })
    }

    // Prepare the forecast request
    const systemPrompt = `You are a financial forecasting expert using historical data to predict future cash flows.

Provide ONLY a valid JSON response with 6 months of forecasts in this exact format:
{
  "months": [
    {
      "month": "Oct 2024",
      "expected_income": 85000,
      "expected_fixed_expenses": 25000,
      "expected_variable_expenses": 18000,
      "projected_savings": 42000
    },
    ...more months...
  ]
}`

    const userMessage = `Based on this historical financial data, forecast the next 6 months:

Average Monthly Income: ₹${historicalData.avgIncome || 50000}
Average Fixed Expenses: ₹${historicalData.avgFixed || 15000}
Average Variable Expenses: ₹${historicalData.avgVariable || 12000}
Trend: ${historicalData.trend || 'stable'}
Current Savings Rate: ${historicalData.savingsRate || 30}%

Generate realistic forecasts considering seasonal variations and trends. Return ONLY valid JSON.`

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
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenRouter API error:', errorData)
      return res.status(response.status).json({
        error: errorData.error?.message || 'Failed to generate forecast',
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return res.status(500).json({ error: 'No response from AI' })
    }

    // Try to parse the response as JSON
    try {
      const forecast = JSON.parse(content)

      // Validate the forecast structure
      if (!forecast.months || !Array.isArray(forecast.months)) {
        throw new Error('Invalid forecast structure')
      }

      res.status(200).json({ forecast })
    } catch (parseError) {
      console.error('Could not parse forecast response:', content)
      // Return the content as-is if it's not valid JSON
      res.status(200).json({
        forecast: {
          months: [],
          raw_response: content,
        },
      })
    }
  } catch (error) {
    console.error('Forecast API error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
