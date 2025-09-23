/**
 * Utility functions for parsing JSON from analysis responses
 */

export interface ParsedAnalysis {
  founder_profile?: unknown;
  industry_analysis?: unknown;
  technology_analysis?: unknown;
  revenue_stream?: unknown;
  competitor_analysis?: unknown;
  metadata?: unknown;
}

/**
 * Extracts JSON from markdown code blocks
 */
export function extractJsonFromMarkdown(text: string): unknown {
  if (!text) return null;
  
  // Look for JSON in markdown code blocks
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error('Failed to parse JSON from markdown:', e);
      return null;
    }
  }
  
  // Try to parse the entire text as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse as JSON:', e);
    return null;
  }
}

/**
 * Parses the analysis response and extracts structured data
 */
export function parseAnalysisResponse(analysis: Record<string, unknown>): ParsedAnalysis {
  if (!analysis) return {};
  
  const result: ParsedAnalysis = {};
  
  // Parse each category
  const categories = [
    'founder_profile',
    'industry_analysis', 
    'technology_analysis',
    'revenue_stream',
    'competitor_analysis'
  ];
  
  categories.forEach(category => {
    if (analysis[category]) {
      const parsed = extractJsonFromMarkdown(analysis[category] as string);
      result[category as keyof ParsedAnalysis] = parsed || analysis[category];
    }
  });
  
  // Add metadata if present
  if (analysis.metadata) {
    result.metadata = analysis.metadata;
  }
  
  return result;
}

/**
 * Gets a display-friendly title for each category
 */
export function getCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    founder_profile: 'Founder Profile',
    industry_analysis: 'Industry Analysis',
    technology_analysis: 'Technology Analysis',
    revenue_stream: 'Revenue Streams',
    competitor_analysis: 'Competitor Analysis',
    metadata: 'Analysis Metadata'
  };
  
  return titles[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Gets an icon for each category
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    founder_profile: '👤',
    industry_analysis: '🏭',
    technology_analysis: '⚙️',
    revenue_stream: '💰',
    competitor_analysis: '🏢',
    metadata: '📊'
  };
  
  return icons[category] || '📄';
}
