"use client";

import { useState } from "react";
import {
  ParsedAnalysis,
  getCategoryTitle,
  getCategoryIcon,
} from "@/lib/json-parser";

interface AnalysisAccordionProps {
  analysis: ParsedAnalysis;
}

export default function AnalysisAccordion({
  analysis,
}: AnalysisAccordionProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section);
    } else {
      newOpenSections.add(section);
    }
    setOpenSections(newOpenSections);
  };


  const renderTableFromObject = (data: Record<string, unknown>, title: string) => {
    const entries = Object.entries(data);
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {entries.map(([key, value]) => (
                <tr key={key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white w-1/3">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {typeof value === 'object' && value !== null ? (
                      <div className="space-y-2">
                        {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                          <div key={subKey} className="border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {String(subValue).replace(/"/g, '&quot;')}
                            </div>
                            {(() => {
                              const urlString = String(subValue);
                              const isUrl = urlString.startsWith('http://') || urlString.startsWith('https://');
                              
                              if (isUrl) {
                                return (
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    <a 
                                      href={urlString} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:underline flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      {urlString.length > 50 ? urlString.substring(0, 50) + '...' : urlString}
                                    </a>
                                  </div>
                                );
                              } else if (typeof subValue === 'object' && subValue !== null && 'data_source_url' in (subValue as Record<string, unknown>)) {
                                return (
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    <a 
                                      href={(subValue as Record<string, unknown>).data_source_url as string} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:underline flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Source
                                    </a>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        {(() => {
                          const urlString = String(value);
                          const isUrl = urlString.startsWith('http://') || urlString.startsWith('https://');
                          
                          if (isUrl) {
                            return (
                              <a 
                                href={urlString} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                {urlString.length > 50 ? urlString.substring(0, 50) + '...' : urlString}
                              </a>
                            );
                          }
                          return <span>{urlString}</span>;
                        })()}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderArrayTable = (data: unknown[], title: string) => {
    if (data.length === 0) return <div className="text-gray-500 italic">No data available</div>;
    
    const firstItem = data[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      return (
        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
          <ul className="list-disc list-inside space-y-1">
            {data.map((item, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">{String(item)}</li>
            ))}
          </ul>
        </div>
      );
    }

    const keys = Object.keys(firstItem as Record<string, unknown>);
    
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {keys.map((key) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item, index) => (
                <tr key={index}>
                  {keys.map((key) => {
                    const value = (item as Record<string, unknown>)[key];
                    return (
                      <td key={key} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {typeof value === 'object' && value !== null ? (
                          <div className="space-y-1">
                            {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                              <div key={subKey}>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {String(subValue).replace(/"/g, '&quot;')}
                                </div>
                                {(() => {
                                  const urlString = String(subValue);
                                  const isUrl = urlString.startsWith('http://') || urlString.startsWith('https://');
                                  
                                  if (isUrl) {
                                    return (
                                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        <a 
                                          href={urlString} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="hover:underline flex items-center gap-1"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                          {urlString.length > 50 ? urlString.substring(0, 50) + '...' : urlString}
                                        </a>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="max-w-xs truncate" title={String(value)}>
                            {(() => {
                              const urlString = String(value);
                              const isUrl = urlString.startsWith('http://') || urlString.startsWith('https://');
                              
                              if (isUrl) {
                                return (
                                  <a 
                                    href={urlString} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    {urlString.length > 30 ? urlString.substring(0, 30) + '...' : urlString}
                                  </a>
                                );
                              }
                              return <span>{urlString}</span>;
                            })()}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSectionContent = (content: unknown, category: string) => {
    if (typeof content === "string") {
      return (
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {content}
          </pre>
        </div>
      );
    }

    if (typeof content === "object" && content !== null) {
      // Handle different data structures based on category
      if (category === 'founder_profile') {
        return renderTableFromObject(content as Record<string, unknown>, 'Founder Information');
      } else if (category === 'industry_analysis') {
        return renderTableFromObject(content as Record<string, unknown>, 'Industry Analysis');
      } else if (category === 'technology_analysis') {
        const techData = content as Record<string, unknown>;
        if (Array.isArray(techData.industries_using_technology)) {
          return (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Technology</h4>
                <p className="text-blue-800 dark:text-blue-200">{String(techData.technology)}</p>
              </div>
              {renderArrayTable(techData.industries_using_technology as unknown[], 'Industries Using This Technology')}
            </div>
          );
        }
        return renderTableFromObject(techData, 'Technology Analysis');
      } else if (category === 'revenue_stream') {
        const revenueData = content as Record<string, unknown>;
        if (Array.isArray(revenueData.revenue_streams)) {
          return renderArrayTable(revenueData.revenue_streams as unknown[], 'Revenue Streams');
        }
        return renderTableFromObject(revenueData, 'Revenue Analysis');
      } else if (category === 'competitor_analysis') {
        const competitorData = content as Record<string, unknown>;
        if (Array.isArray(competitorData.competitors)) {
          return renderArrayTable(competitorData.competitors as unknown[], 'Competitor Analysis');
        }
        return renderTableFromObject(competitorData, 'Competitor Analysis');
      }
      
      // Default table rendering for other categories
      return renderTableFromObject(content as Record<string, unknown>, getCategoryTitle(category));
    }

    return <div className="text-gray-500 italic">No data available</div>;
  };

  const categories = Object.keys(analysis).filter((key) => key !== "metadata");
  const hasMetadata = Boolean(analysis.metadata && analysis.metadata !== null);

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const isOpen = openSections.has(category);
        const content = analysis[category as keyof ParsedAnalysis];

        if (!content) return null;

        return (
          <div
            key={category}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <button
              onClick={() => toggleSection(category)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getCategoryIcon(category)}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getCategoryTitle(category)}
                </h3>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

              {isOpen && (
                <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-4">{renderSectionContent(content, category)}</div>
                </div>
              )}
          </div>
        );
      })}

      {hasMetadata && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getCategoryIcon("metadata")}</span>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {getCategoryTitle("metadata")}
            </h4>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div>Timestamp: {String((analysis.metadata as Record<string, unknown>)?.timestamp || 'N/A')}</div>
            <div>Status: {String((analysis.metadata as Record<string, unknown>)?.pipeline_status || 'N/A')}</div>
            <div>
              Tasks: {Array.isArray((analysis.metadata as Record<string, unknown>)?.tasks_run) 
                ? ((analysis.metadata as Record<string, unknown>).tasks_run as string[]).join(", ")
                : 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
