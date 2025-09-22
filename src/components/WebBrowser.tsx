'use client';

import { useState } from 'react';

interface WebBrowserProps {
  onUrlSubmit: (url: string) => void;
}

export default function WebBrowser({ onUrlSubmit }: WebBrowserProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/mcp', {
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

      const result = await response.json();
      onUrlSubmit(result.content?.[0]?.text || 'No content found');
    } catch (error) {
      console.error('Web browsing error:', error);
      onUrlSubmit('Error fetching web content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        🌐 Web Research
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL for web research (e.g., company website, news article)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Fetching...' : 'Fetch Web Content'}
        </button>
      </form>
    </div>
  );
}
