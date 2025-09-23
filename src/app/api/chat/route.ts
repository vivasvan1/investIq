import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = 'https://0woqa3vaag9y.share.zrok.io';

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history = [] } = await request.json();
    
    // Forward the request to the deployed backend
    try {
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        message,
        conversation_history
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return NextResponse.json({
        message: response.data.message,
        tools_used: response.data.tools_used || [],
        web_search_results: response.data.web_search_results,
        timestamp: response.data.timestamp
      });

    } catch (backendError) {
      console.error('Backend chat error:', backendError);
      
      // Fallback to local processing if backend is unavailable
      return NextResponse.json({
        message: 'I apologize, but the InvestIQ backend is currently unavailable. Please try again later.',
        tools_used: [],
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

