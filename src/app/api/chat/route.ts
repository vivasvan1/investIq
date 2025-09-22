import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tools_used?: string[];
}

interface WebSearchResult {
  url: string;
  title: string;
  content: string;
  relevance_score: number;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history = [] } = await request.json();
    
    // Create conversation context
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are InvestIQ, an AI investment analyst assistant. You can:
1. Analyze investment opportunities
2. Research companies using web search
3. Provide market insights
4. Answer questions about startups, funding, and investments

You have access to web search tools. When users ask about specific companies or need current information, use web search to gather real-time data.

Always provide structured, professional investment analysis with clear recommendations.`,
        timestamp: new Date().toISOString()
      },
      ...conversation_history,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
    ];

    // Check if we need to perform web search
    const needsWebSearch = shouldPerformWebSearch(message);
    let webSearchResults: WebSearchResult[] = [];
    let toolsUsed: string[] = [];

    if (needsWebSearch) {
      try {
        webSearchResults = await performWebSearch(message);
        toolsUsed.push('web_search');
        
        // Add web search results to context
        const webContext = formatWebSearchResults(webSearchResults);
        messages.push({
          role: 'system',
          content: `Web Search Results:\n${webContext}`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Web search error:', error);
      }
    }

    // Generate response using Ollama
    const response = await generateAgenticResponse(messages, webSearchResults);

    return NextResponse.json({
      message: response.content,
      tools_used: toolsUsed,
      web_search_results: webSearchResults.length > 0 ? webSearchResults : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

function shouldPerformWebSearch(message: string): boolean {
  const searchTriggers = [
    'search for', 'find information about', 'look up', 'research',
    'current', 'latest', 'recent', 'news about', 'what is',
    'company', 'startup', 'funding', 'investment', 'market'
  ];
  
  const lowerMessage = message.toLowerCase();
  return searchTriggers.some(trigger => lowerMessage.includes(trigger));
}

async function performWebSearch(query: string): Promise<WebSearchResult[]> {
  try {
    // Extract company/entity names from the query
    const searchQuery = extractSearchQuery(query);
    
    // For demo purposes, we'll simulate web search results
    // In production, you would integrate with Google Search API, Bing API, or similar
    const mockResults: WebSearchResult[] = [
      {
        url: 'https://example.com/company-news',
        title: `${searchQuery} - Latest News and Updates`,
        content: `Recent developments and news about ${searchQuery}. The company has shown strong growth in recent quarters with significant funding rounds.`,
        relevance_score: 0.95
      },
      {
        url: 'https://example.com/market-analysis',
        title: `Market Analysis for ${searchQuery}`,
        content: `Market analysis shows ${searchQuery} is operating in a competitive landscape with strong growth potential. Industry trends indicate positive outlook.`,
        relevance_score: 0.88
      }
    ];

    // In a real implementation, you would:
    // 1. Call a search API (Google, Bing, etc.)
    // 2. Fetch content from the top results
    // 3. Extract relevant information
    // 4. Return structured results

    return mockResults;
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

function extractSearchQuery(message: string): string {
  // Simple extraction - in production, use NLP libraries
  const words = message.toLowerCase().split(' ');
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  return words.filter(word => !stopWords.includes(word) && word.length > 2).join(' ');
}

function formatWebSearchResults(results: WebSearchResult[]): string {
  return results.map((result, index) => 
    `${index + 1}. **${result.title}**\n   URL: ${result.url}\n   Content: ${result.content.substring(0, 200)}...\n`
  ).join('\n');
}

async function generateAgenticResponse(messages: ChatMessage[], webResults: WebSearchResult[]): Promise<{ content: string }> {
  try {
    // Format messages for Ollama
    const ollamaMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'gemma3:4b',
      messages: ollamaMessages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000
      }
    });

    return {
      content: response.data.message.content
    };
  } catch (error) {
    console.error('Ollama API error:', error);
    return {
      content: 'I apologize, but I encountered an error while processing your request. Please try again.'
    };
  }
}
