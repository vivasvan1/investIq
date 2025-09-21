import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { companyData, pitchDeck, financials, marketData } = await request.json();

    // Create a comprehensive prompt for investment analysis
    const prompt = `
You are an AI investment analyst. Analyze the following startup data and provide a comprehensive investment assessment:

Company Data: ${companyData || 'Not provided'}
Pitch Deck Summary: ${pitchDeck || 'Not provided'}
Financial Information: ${financials || 'Not provided'}
Market Data: ${marketData || 'Not provided'}

Please provide:
1. Executive Summary (2-3 sentences)
2. Key Strengths (3-5 points)
3. Risk Factors (3-5 points)
4. Market Opportunity Assessment
5. Financial Health Score (1-10)
6. Investment Recommendation (Strong Buy/Buy/Hold/Pass)
7. Key Questions for Due Diligence

Format your response in a clear, investor-ready structure.
`;

    // Call Ollama API
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'gemma3:4b',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000
      }
    });

    return NextResponse.json({ 
      analysis: response.data.response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze investment data' },
      { status: 500 }
    );
  }
}
