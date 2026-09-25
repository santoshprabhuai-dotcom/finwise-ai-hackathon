export const callOpenRouter = async (messages: any[], systemPrompt: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      system: systemPrompt,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get AI response')
  }

  const data = await response.json()
  return data.content
}

export const generateFinancialInsights = async (financialData: any) => {
  const systemPrompt = `You are FinWise AI, an expert financial advisor. Analyze the user's financial data and provide actionable, specific insights.
  
  Guidelines:
  - Be concise and practical
  - Focus on 2-3 key insights
  - Provide specific recommendations
  - Mention percentages and trends where relevant
  - Always include a disclaimer: "This is informational and not financial advice"
  - Stay professional but friendly
  - Suggest ways to improve savings rate`

  const messages = [
    {
      role: 'user',
      content: `Analyze this financial data and provide insights:
      
      Total Income: ₹${financialData.income}
      Total Expenses: ₹${financialData.expenses}
      Savings: ₹${financialData.savings}
      Savings Rate: ${financialData.savingsRate}%
      
      Top Expense Categories: ${JSON.stringify(financialData.topCategories)}
      
      Please provide 2-3 actionable financial insights.`,
    },
  ]

  try {
    const response = await callOpenRouter(messages, systemPrompt)
    return response
  } catch (error) {
    console.error('Error generating insights:', error)
    return 'Unable to generate insights at this moment.'
  }
}

export const categorizeBulkTransactions = async (transactions: any[]) => {
  const systemPrompt = `You are a financial categorization expert. Categorize transactions into: Food, Housing, Transportation, Shopping, Entertainment, Utilities, Healthcare, Education, or Other.
  
  Respond ONLY with a JSON array matching the input length, with each object containing:
  {
    "original_description": "...",
    "category": "...",
    "expense_type": "fixed" or "variable"
  }
  
  Fixed: Utilities, Housing, Insurance, Subscriptions
  Variable: Food, Transportation, Entertainment, Shopping`

  const transactionList = transactions
    .map((t) => `"${t.description}"`)
    .join(', ')

  const messages = [
    {
      role: 'user',
      content: `Categorize these transactions: [${transactionList}]`,
    },
  ]

  try {
    const response = await callOpenRouter(messages, systemPrompt)
    return JSON.parse(response)
  } catch (error) {
    console.error('Error categorizing transactions:', error)
    return transactions.map((t) => ({
      original_description: t.description,
      category: 'Other',
      expense_type: 'variable',
    }))
  }
}

export const generateCashflowForecast = async (historicalData: any) => {
  const systemPrompt = `You are a financial forecasting expert using historical data to predict future cash flows.
  
  Provide ONLY a JSON response with 6 months of forecasts:
  {
    "months": [
      {
        "month": "Oct 2024",
        "expected_income": 85000,
        "expected_fixed_expenses": 25000,
        "expected_variable_expenses": 18000,
        "projected_savings": 42000
      }
    ]
  }`

  const messages = [
    {
      role: 'user',
      content: `Based on this historical financial data, forecast the next 6 months:
      
      Average Monthly Income: ₹${historicalData.avgIncome}
      Average Fixed Expenses: ₹${historicalData.avgFixed}
      Average Variable Expenses: ₹${historicalData.avgVariable}
      Trend: ${historicalData.trend}
      
      Generate realistic forecasts considering seasonal variations and trends.`,
    },
  ]

  try {
    const response = await callOpenRouter(messages, systemPrompt)
    return JSON.parse(response)
  } catch (error) {
    console.error('Error generating forecast:', error)
    return { months: [] }
  }
}
