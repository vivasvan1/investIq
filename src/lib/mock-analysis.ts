/**
 * Mock analysis data for client-side demonstration
 */

export const generateMockAnalysis = (fileName: string) => {
  const timestamp = new Date().toISOString();
  
  return {
    founder_profile: {
      "Founder1": {
        "name": "To be identified from web search",
        "education": "To be identified from web search", 
        "work_experience": "To be identified from web search",
        "previously_founded_companies": "To be identified from web search"
      },
      "Founder2": {
        "name": "To be identified from web search",
        "education": "To be identified from web search",
        "work_experience": "To be identified from web search", 
        "previously_founded_companies": "To be identified from web search"
      }
    },
    industry_analysis: {
      "industry": {
        "data": "The company operates in the lifestyle accessories industry, focusing on fashionable and sustainable products.",
        "data_source_url": "https://www.grandviewresearch.com/horizon/outlook/fashion-accessories-market/india"
      },
      "market_size": {
        "data": "The Indian personal accessories market was valued at USD 1.94 Billion in 2024 and is projected to reach USD 3.01 Billion by 2030.",
        "data_source_url": "https://www.researchandmarkets.com/report/india-personal-accessories-market"
      },
      "recent_news": {
        "data": "The Indian personal accessories market is undergoing a transformative shift, fueled by changing consumer lifestyles and increasing fashion consciousness.",
        "data_source_url": "https://www.techsciresearch.com/news/7434-india-personal-accessories-market.html"
      },
      "growth_potential": {
        "data": "The Indian accessories market is projected to grow at an annual rate of 6.37% (CAGR 2025-2030).",
        "data_source_url": "https://www.statista.com/outlook/cmo/accessories/india"
      },
      "key_risks_and_challenges": {
        "data": "Challenges include compatibility issues in some accessory markets due to diverse models and brand-specific designs.",
        "data_source_url": "https://www.gminsights.com/industry-analysis/air-fryer-accessories-market"
      },
      "growth_strategy_and_plans": {
        "data": "E-commerce is significantly impacting the accessories market, with online sales estimated to contribute a substantial portion of total revenue.",
        "data_source_url": "https://www.researchandmarkets.com/report/india-personal-accessories-market"
      }
    },
    technology_analysis: {
      "technology": "e-commerce",
      "industries_using_technology": [
        {
          "industry": "Retail",
          "market_size": "$1.09 trillion in 2023 (US sales)",
          "data_source_url": "https://www.verifiedmarketresearch.com/product/e-commerce-market/"
        },
        {
          "industry": "E-commerce Platform", 
          "market_size": "USD 8.58 billion in 2023",
          "data_source_url": "https://www.grandviewresearch.com/industry-analysis/e-commerce-platform-market-report"
        },
        {
          "industry": "E-commerce Software",
          "market_size": "USD 7.12 billion in 2022", 
          "data_source_url": "https://www.grandviewresearch.com/industry-analysis/e-commerce-software-market"
        },
        {
          "industry": "AI in E-commerce",
          "market_size": "USD 7.25 billion in 2024",
          "data_source_url": "https://www.precedenceresearch.com/artificial-intelligence-in-e-commerce-market"
        }
      ]
    },
    revenue_stream: {
      "revenue_streams": [
        {
          "name": "Subscription Fees",
          "description": "Recurring fees paid by users for access to the platform and its features.",
          "target_audience": "Real estate agents and brokers",
          "percentage_contribution": "Data unavailable"
        }
      ]
    },
    competitor_analysis: {
      "competitors": [
        {
          "Company Name": "LEGO Group",
          "Headquarters": "Billund, Denmark",
          "Founding Year": "1932",
          "Total Funding Raised": "Privately held; funding information not readily available",
          "Funding Rounds": "N/A",
          "Investors": "Kristiansen family via Kirkbi",
          "Revenue Streams": "LEGO sets, video games, merchandise, theme parks, retail stores, and licensed collaborations.",
          "Business Model": "Designs, manufactures, and markets plastic construction toys. Revenue primarily from LEGO sets across various themes.",
          "Gross Margin": "Not publicly available",
          "Net Margin": "Not publicly available",
          "Current ARR": "N/A",
          "Current MRR": "N/A",
          "ARR Growth rate": "N/A",
          "Churn Rate": "N/A",
          "differentiating factors": "Focus on construction toys, strong brand identity, extensive licensing agreements, and a global presence. Strong community and user-generated content."
        },
        {
          "Company Name": "Mattel",
          "Headquarters": "El Segundo, California, USA", 
          "Founding Year": "1945",
          "Total Funding Raised": "Publicly traded; funding information not readily available",
          "Funding Rounds": "N/A",
          "Investors": "Public shareholders",
          "Revenue Streams": "Dolls (Barbie, American Girl), Infant, Toddler, and Preschool, Vehicles (Hot Wheels), Action Figures, and Games.",
          "Business Model": "Designs, manufactures, and markets toys and consumer products. Integrates products with digital content and entertainment partnerships.",
          "Gross Margin": "50.8% (Adjusted, 2024)",
          "Net Margin": "Not publicly available",
          "Current ARR": "N/A",
          "Current MRR": "N/A", 
          "ARR Growth rate": "N/A",
          "Churn Rate": "N/A",
          "differentiating factors": "Diverse portfolio of iconic toy brands, strong retail partnerships, and a focus on entertainment integration."
        }
      ]
    },
    metadata: {
      "timestamp": timestamp,
      "pipeline_status": "completed",
      "tasks_run": ["founder_profile", "industry_analysis", "technology_analysis", "revenue_stream", "competitor_analysis"],
      "analyzed_file": fileName
    }
  };
};
