'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

function isToolPart(part: any): part is { type: string; toolCallId: string; state: string; input?: any; output?: any; errorText?: string } {
  return typeof part?.type === 'string' && part.type.startsWith('tool-');
}

export function AssistantChat() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        // Route that actually exists in this app
        api: '/api/assistant',
      }),
    []
  );

  const {
    messages,
    status,
    error,
    sendMessage,
    regenerate,
    clearError,
    setMessages,
  } = useChat({
    transport,
  } as any); // Type assertion for AI SDK v5 compatibility

  const isLoading = status === 'submitted' || status === 'streaming';

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const suggestedQueries = [
    'What is the current ecosystem health?',
    'Show me all VPS services',
    'Are there any services down?',
    'Check VPS server health',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (!value || isLoading) return;

    // AI SDK v5 sendMessage expects { text: string }
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: value }],
    });
    setInput('');
  };

  const startNewConversation = () => {
    clearError();
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  const retry = () => {
    clearError();
    // Regenerate the last assistant response (works well as a “retry”)
    regenerate();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Control Room Assistant</h2>
            <p className="text-xs text-gray-500">AI-powered infrastructure management</p>
          </div>
        </div>

        {(messages?.length ?? 0) > 0 && (
          <button
            onClick={startNewConversation}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="New conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(messages?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-3 bg-blue-100 rounded-full mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">How can I help you today?</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              I can monitor services, check system health, manage VPS processes, and help troubleshoot issues.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestedQueries.map((query) => (
                <button
                  key={query}
                  onClick={() => {
                    if (!isLoading) {
                      // AI SDK v5 sendMessage expects { text: string }
                      sendMessage({
                        role: 'user',
                        parts: [{ type: 'text', text: query }],
                      });
                    }
                  }}
                  className="px-3 py-2 text-sm text-left text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ) : (
          (messages as UIMessage[]).map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                {/* Render message parts (AI SDK v5) */}
                {Array.isArray(message.parts) && message.parts.length > 0 ? (
                  message.parts.map((part: any, idx: number) => {
                    if (part.type === 'text' || part.type === 'reasoning') {
                      return (
                        <div key={idx} className="text-sm whitespace-pre-wrap leading-relaxed">
                          {part.text}
                        </div>
                      );
                    }

                    if (isToolPart(part)) {
                      const toolName = part.type.replace(/^tool-/, '');
                      const isDone = part.state === 'output-available';
                      const isErr = part.state === 'output-error';
                      const label = isErr ? 'Tool error' : isDone ? 'Used' : 'Calling';

                      return (
                        <div key={idx} className="mt-2 pt-2 border-t border-gray-200/50">
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full ${
                                isErr
                                  ? 'bg-red-500'
                                  : isDone
                                  ? 'bg-green-500'
                                  : 'bg-yellow-500 animate-pulse'
                              }`}
                            />
                            {label}: {toolName}
                          </div>

                          {isErr && (
                            <div className="mt-1 text-xs text-red-600 whitespace-pre-wrap">
                              {part.errorText || 'Unknown tool error'}
                            </div>
                          )}

                          {isDone && part.output !== undefined && (
                            <pre className="mt-2 text-xs bg-white/60 border border-gray-200 rounded-md p-2 overflow-x-auto">
                              {JSON.stringify(part.output, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    }

                    // Ignore other part types (file/data/source/etc.) for now
                    return null;
                  })
                ) : (
                  // Safety fallback (should be rare in v5)
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {/* @ts-expect-error legacy fallback */}
                    {message.content ?? ''}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Error: {error.message}</span>
            <button onClick={retry} className="ml-auto text-red-600 hover:text-red-800 underline">
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about services, health, or actions..."
            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
