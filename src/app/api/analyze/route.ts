import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const companyData = formData.get('companyData') as string;
    const pitchDeckText = formData.get('pitchDeckText') as string;
    const financials = formData.get('financials') as string;
    const marketData = formData.get('marketData') as string;
    const pitchDeckImage = formData.get('pitchDeckImage') as File;
    
    let pitchDeckContent = '';
    
    // If pitch deck image is provided, analyze it with vision
    if (pitchDeckImage && pitchDeckImage.size > 0) {
      try {
        // Convert image to base64
        const imageBuffer = await pitchDeckImage.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        
        // Call Ollama vision API to extract pitch deck content
        const visionResponse = await axios.post('http://localhost:11434/api/generate', {
          model: 'gemma3:4b',
          prompt: `Extract all key information from this pitch deck image including:
- Company name and mission
- Problem statement and solution
- Market size and opportunity
- Business model and revenue streams
- Key metrics and traction
- Team information
- Financial projections
- Funding ask and use of funds

Provide a comprehensive summary of the pitch deck content.`,
          images: [base64Image],
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1500
          }
        });
        
        pitchDeckContent = visionResponse.data.response;
      } catch (visionError) {
        console.error('Vision analysis error:', visionError);
        pitchDeckContent = 'Error analyzing pitch deck image. Please try again.';
      }
    }

    // Check if we need to fetch additional web data
    let webData = '';
    if (companyData && companyData.includes('http')) {
      try {
        const urlMatch = companyData.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          const webResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'tools/call',
              params: {
                name: 'fetch_web_content',
                arguments: { url, extractType: 'financial_data' }
              }
            })
          });
          const webResult = await webResponse.json();
          webData = webResult.content?.[0]?.text || '';
        }
      } catch (error) {
        console.error('Web data fetch error:', error);
      }
    }

    // Create a comprehensive prompt for investment analysis
    const prompt = `
You are an AI investment analyst. Analyze the following startup data and provide a comprehensive investment assessment:

Company Data: ${companyData || 'Not provided'}
Pitch Deck Text: ${pitchDeckText || 'Not provided'}
Pitch Deck Image Content: ${pitchDeckContent || 'Not provided'}
Financial Information: ${financials || 'Not provided'}
Market Data: ${marketData || 'Not provided'}
Web Research Data: ${webData || 'Not provided'}

Please provide your analysis in the following markdown format:

## 📋 Executive Summary
[2-3 sentences providing a high-level overview]

## ✅ Key Strengths
- [Strength 1 with brief explanation]
- [Strength 2 with brief explanation]
- [Strength 3 with brief explanation]
- [Strength 4 with brief explanation]

## ⚠️ Risk Factors
- [Risk 1 with brief explanation]
- [Risk 2 with brief explanation]
- [Risk 3 with brief explanation]

## 📈 Market Opportunity
[Assessment of market size, growth potential, and competitive landscape]

## 💰 Financial Health Score
**Score: X/10**
[Brief explanation of the score and key financial metrics]

## 🎯 Investment Recommendation
**Recommendation: [Strong Buy/Buy/Hold/Pass]**
[Brief rationale for the recommendation]

## ❓ Key Due Diligence Questions
1. [Question 1]
2. [Question 2]
3. [Question 3]

${pitchDeckContent ? `## 📊 Pitch Deck Assessment
[Assessment of pitch deck quality, clarity, and completeness based on the uploaded image]` : ''}

Format your response using proper markdown syntax with headers, bullet points, and emphasis.
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
