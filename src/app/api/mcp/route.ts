import { NextRequest, NextResponse } from 'next/server';
import { mcpServer } from '@/lib/mcp-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle MCP requests
    if (body.method === 'tools/list') {
      return NextResponse.json({
        tools: [
          {
            name: 'fetch_web_content',
            description: 'Fetch and extract content from a web URL for investment research',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The URL to fetch content from',
                },
                extractType: {
                  type: 'string',
                  enum: ['full', 'text', 'headings', 'financial_data'],
                  description: 'Type of content extraction to perform',
                  default: 'text'
                }
              },
              required: ['url'],
            },
          },
          {
            name: 'search_company_info',
            description: 'Search for company information across multiple sources',
            inputSchema: {
              type: 'object',
              properties: {
                companyName: {
                  type: 'string',
                  description: 'Name of the company to search for',
                },
                searchType: {
                  type: 'string',
                  enum: ['news', 'financials', 'competitors', 'market_data'],
                  description: 'Type of information to search for',
                  default: 'news'
                }
              },
              required: ['companyName'],
            },
          },
        ],
      });
    }

    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;

      switch (name) {
        case 'fetch_web_content':
          return await handleFetchWebContent(args);
        case 'search_company_info':
          return await handleSearchCompanyInfo(args);
        default:
          return NextResponse.json(
            { error: `Unknown tool: ${name}` },
            { status: 400 }
          );
      }
    }

    return NextResponse.json(
      { error: 'Unsupported method' },
      { status: 400 }
    );

  } catch (error) {
    console.error('MCP API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleFetchWebContent(args: { url: string; extractType?: string }) {
  try {
    const axios = (await import('axios')).default;
    const cheerio = (await import('cheerio')).default;
    
    const response = await axios.get(args.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InvestIQ/1.0)',
      },
    });

    const $ = cheerio.load(response.data);

    let extractedContent = '';

    switch (args.extractType || 'text') {
      case 'full':
        extractedContent = $.text();
        break;
      case 'text':
        $('script, style, nav, footer, header').remove();
        extractedContent = $('body').text().replace(/\s+/g, ' ').trim();
        break;
      case 'headings':
        const headings = $('h1, h2, h3, h4, h5, h6').map((_, el) => $(el).text().trim()).get();
        extractedContent = headings.join('\n');
        break;
      case 'financial_data':
        const financialText = $('*:contains("revenue"), *:contains("profit"), *:contains("funding"), *:contains("valuation")').text();
        extractedContent = financialText.replace(/\s+/g, ' ').trim();
        break;
      default:
        extractedContent = $.text();
    }

    return NextResponse.json({
      content: [
        {
          type: 'text',
          text: `URL: ${args.url}\nExtraction Type: ${args.extractType || 'text'}\n\nContent:\n${extractedContent.substring(0, 5000)}${extractedContent.length > 5000 ? '...' : ''}`,
        },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { 
        content: [
          {
            type: 'text',
            text: `Error fetching content from ${args.url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      },
      { status: 500 }
    );
  }
}

async function handleSearchCompanyInfo(args: { companyName: string; searchType?: string }) {
  const searchQueries = {
    news: `${args.companyName} startup news funding`,
    financials: `${args.companyName} financial results revenue funding`,
    competitors: `${args.companyName} competitors alternatives`,
    market_data: `${args.companyName} market size industry analysis`
  };

  const query = searchQueries[args.searchType as keyof typeof searchQueries] || searchQueries.news;
  
  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: `Company: ${args.companyName}\nSearch Type: ${args.searchType || 'news'}\nSuggested Query: "${query}"\n\nNote: This is a demo response. In production, this would integrate with search APIs like Google Search, Bing, or specialized financial data providers.`,
      },
    ],
  });
}
