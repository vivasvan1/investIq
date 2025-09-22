"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface WebResearch {
  query: string;
  result: string;
}

interface PDFAnalysis {
  analysis_type: string;
  findings: string | object;
  pdf_analysis?: string;
  company_name?: string;
  web_research?: WebResearch[];
  document_length: number;
  filename: string;
  confidence_score?: number;
  timestamp: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  tools_used?: string[];
  pdf_analysis?: PDFAnalysis;
  file_name?: string;
}

interface ChatInterfaceProps {
  onAnalysisComplete?: (analysis: PDFAnalysis) => void;
}

export default function ChatInterface({
  onAnalysisComplete,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState("");
  const [marketData, setMarketData] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          conversation_history: messages,
          company_data: companyData,
          market_data: marketData,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        timestamp: data.timestamp,
        tools_used: data.tools_used,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please make sure the Python backend is running on port 8000.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("pdf_file", file);
      formData.append("analysis_type", "investment_document");

      const response = await fetch("http://localhost:8000/api/analyze-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("PDF analysis failed");
      }

      const analysisData = await response.json();

      // Add user message showing file upload
      const userMessage: ChatMessage = {
        role: "user",
        content: `📄 Uploaded PDF: ${file.name}`,
        timestamp: new Date().toISOString(),
        file_name: file.name,
      };

      // Add assistant message with analysis
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: `I've analyzed your PDF document "${file.name}". Here's what I found:`,
        timestamp: new Date().toISOString(),
        pdf_analysis: analysisData,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Call the analysis complete callback
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisData);
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("PDF upload error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "Sorry, I encountered an error analyzing the PDF. Please make sure the backend is running and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IQ</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                InvestIQ Assistant
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered investment analysis
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Context Inputs */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Company name or URL..."
            value={companyData}
            onChange={(e) => setCompanyData(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="text"
            placeholder="Market/Industry..."
            value={marketData}
            onChange={(e) => setMarketData(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Start a conversation with InvestIQ to analyze investment
              opportunities
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* PDF Analysis Results */}
              {message.pdf_analysis && (
                <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                    📊 Comprehensive PDF Analysis
                    {message.pdf_analysis.company_name && (
                      <span className="ml-2 text-sm font-normal text-blue-700 dark:text-blue-300">
                        - {message.pdf_analysis.company_name}
                      </span>
                    )}
                  </h4>

                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Document:</span>{" "}
                        {message.pdf_analysis.filename}
                      </div>
                      <div>
                        <span className="font-medium">Analysis Type:</span>{" "}
                        {message.pdf_analysis.analysis_type}
                      </div>
                      <div>
                        <span className="font-medium">Document Length:</span>{" "}
                        {message.pdf_analysis.document_length} characters
                      </div>
                      {message.pdf_analysis.confidence_score && (
                        <div>
                          <span className="font-medium">Confidence Score:</span>{" "}
                          {(
                            message.pdf_analysis.confidence_score * 100
                          ).toFixed(1)}
                          %
                        </div>
                      )}
                    </div>

                    {/* PDF Analysis */}
                    {message.pdf_analysis.pdf_analysis && (
                      <div className="mt-4">
                        <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          📄 Document Analysis:
                        </h5>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border text-sm">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.pdf_analysis.pdf_analysis}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Web Research Results */}
                    {message.pdf_analysis.web_research &&
                      message.pdf_analysis.web_research.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            🔍 Web Research Findings:
                          </h5>
                          <div className="space-y-3">
                            {message.pdf_analysis.web_research.map(
                              (research, index) => (
                                <div
                                  key={index}
                                  className="p-3 bg-white dark:bg-gray-800 rounded border"
                                >
                                  <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                                    {research.query}
                                  </div>
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {research.result}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Fallback for old format */}
                    {!message.pdf_analysis.pdf_analysis &&
                      !message.pdf_analysis.web_research && (
                        <div className="mt-3">
                          <span className="font-medium">Key Findings:</span>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {typeof message.pdf_analysis.findings === "string"
                                ? message.pdf_analysis.findings
                                : JSON.stringify(
                                    message.pdf_analysis.findings,
                                    null,
                                    2
                                  )}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {message.tools_used && message.tools_used.length > 0 && (
                <div className="mt-2 text-xs opacity-75">
                  Tools used: {message.tools_used.join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about investment opportunities, market analysis, or company research..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading || isUploading}
          />
          <button
            onClick={triggerFileUpload}
            disabled={isLoading || isUploading}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            title="Upload PDF for analysis"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Send"}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Upload status */}
        {isUploading && (
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Analyzing PDF document...</span>
          </div>
        )}
      </div>
    </div>
  );
}
