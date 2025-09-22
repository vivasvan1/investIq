import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class WebBrowsingMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'investiq-web-browser',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
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
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'fetch_web_content':
            return await this.fetchWebContent(args as { url: string; extractType?: string });
          case 'search_company_info':
            return await this.searchCompanyInfo(args as { companyName: string; searchType?: string });
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async fetchWebContent({ url, extractType = 'text' }: { url: string; extractType?: string }) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InvestIQ/1.0)',
        },
      });

      const $ = cheerio.load(response.data);

      let extractedContent = '';

      switch (extractType) {
        case 'full':
          extractedContent = $.text();
          break;
        case 'text':
          // Remove script and style elements
          $('script, style, nav, footer, header').remove();
          extractedContent = $('body').text().replace(/\s+/g, ' ').trim();
          break;
        case 'headings':
          const headings = $('h1, h2, h3, h4, h5, h6').map((_, el) => $(el).text().trim()).get();
          extractedContent = headings.join('\n');
          break;
        case 'financial_data':
          // Look for financial data patterns
          const financialText = $('*:contains("revenue"), *:contains("profit"), *:contains("funding"), *:contains("valuation")').text();
          extractedContent = financialText.replace(/\s+/g, ' ').trim();
          break;
        default:
          extractedContent = $.text();
      }

      return {
        content: [
          {
            type: 'text',
            text: `URL: ${url}\nExtraction Type: ${extractType}\n\nContent:\n${extractedContent.substring(0, 5000)}${extractedContent.length > 5000 ? '...' : ''}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async searchCompanyInfo({ companyName, searchType = 'news' }: { companyName: string; searchType?: string }) {
    try {
      const searchQueries = {
        news: `${companyName} startup news funding`,
        financials: `${companyName} financial results revenue funding`,
        competitors: `${companyName} competitors alternatives`,
        market_data: `${companyName} market size industry analysis`
      };

      const query = searchQueries[searchType as keyof typeof searchQueries] || searchQueries.news;
      
      // For now, return a structured response with search suggestions
      // In a real implementation, you would integrate with search APIs
      return {
        content: [
          {
            type: 'text',
            text: `Company: ${companyName}\nSearch Type: ${searchType}\nSuggested Query: "${query}"\n\nNote: This is a demo response. In production, this would integrate with search APIs like Google Search, Bing, or specialized financial data providers.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search for company info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('MCP Web Browsing Server started');
  }
}

export const mcpServer = new WebBrowsingMCPServer();
