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

  const renderJsonValue = (value: unknown, depth = 0): React.ReactElement => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    if (typeof value === "string") {
      return (
        <span className="text-gray-700 dark:text-gray-300">"{value}"</span>
      );
    }

    if (typeof value === "number") {
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    }

    if (typeof value === "boolean") {
      return (
        <span className="text-green-600 dark:text-green-400">
          {value.toString()}
        </span>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="ml-4">
          <span className="text-gray-500">[</span>
          <div className="ml-4">
            {value.map((item, index) => (
              <div key={index} className="flex">
                <span className="text-gray-500 mr-2">{index}:</span>
                {renderJsonValue(item, depth + 1)}
                {index < value.length - 1 && (
                  <span className="text-gray-500">,</span>
                )}
              </div>
            ))}
          </div>
          <span className="text-gray-500">]</span>
        </div>
      );
    }

    if (typeof value === "object") {
      return (
        <div className="ml-4">
          <span className="text-gray-500">{"{"}</span>
          <div className="ml-4">
            {Object.entries(value).map(([key, val], index, array) => (
              <div key={key} className="flex">
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  "{key}":
                </span>
                <span className="text-gray-500 mx-2">:</span>
                {renderJsonValue(val, depth + 1)}
                {index < array.length - 1 && (
                  <span className="text-gray-500">,</span>
                )}
              </div>
            ))}
          </div>
          <span className="text-gray-500">{"}"}</span>
        </div>
      );
    }

    return <span className="text-gray-500">{String(value)}</span>;
  };

  const renderSectionContent = (content: unknown) => {
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
      return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm">{renderJsonValue(content)}</pre>
        </div>
      );
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
                <div className="pt-4">{renderSectionContent(content)}</div>
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
            <div>Timestamp: {(analysis.metadata as any)?.timestamp}</div>
            <div>Status: {(analysis.metadata as any)?.pipeline_status}</div>
            <div>
              Tasks: {(analysis.metadata as any)?.tasks_run?.join(", ")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
