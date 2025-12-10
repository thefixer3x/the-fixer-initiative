'use client';

import { AssistantChat } from '@/components/assistant/AssistantChat';

export default function AssistantPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your infrastructure with natural language commands
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
