import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = 'http://35.200.237.52:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const companyData = formData.get('companyData') as string;
    const pitchDeckText = formData.get('pitchDeckText') as string;
    const financials = formData.get('financials') as string;
    const marketData = formData.get('marketData') as string;
    const pitchDeckImage = formData.get('pitchDeckImage') as File;
    
    // If we have a PDF file, use the backend's PDF analysis endpoint
    if (pitchDeckImage && pitchDeckImage.size > 0 && pitchDeckImage.type === 'application/pdf') {
      try {
        const formDataForBackend = new FormData();
        formDataForBackend.append('pdf_file', pitchDeckImage);
        formDataForBackend.append('analysis_type', 'investment_document');
        
        const response = await axios.post(`${BACKEND_URL}/api/analyze-pdf`, formDataForBackend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return NextResponse.json({ 
          analysis: response.data,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Backend PDF analysis error:', error);
        return NextResponse.json(
          { error: 'Failed to analyze PDF with backend' },
          { status: 500 }
        );
      }
    }
    
    // For other types of analysis, use the chat endpoint with context
    try {
      const chatRequest = {
        message: `Please analyze this investment opportunity with the following data:
        
Company Data: ${companyData || 'Not provided'}
Pitch Deck Text: ${pitchDeckText || 'Not provided'}
Financial Information: ${financials || 'Not provided'}
Market Data: ${marketData || 'Not provided'}

Please provide a comprehensive investment analysis.`,
        company_data: companyData,
        pitch_deck_text: pitchDeckText,
        financials: financials,
        market_data: marketData
      };
      
      const response = await axios.post(`${BACKEND_URL}/api/chat`, chatRequest, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return NextResponse.json({ 
        analysis: response.data.message,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Backend chat analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to analyze with backend' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze investment data' },
      { status: 500 }
    );
  }
}
