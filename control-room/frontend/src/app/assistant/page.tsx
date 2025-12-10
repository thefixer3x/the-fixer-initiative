'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { AssistantChat } from '@/components/assistant/AssistantChat';

export default function AssistantPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-gray-600 mt-1">
            Chat with the AI to manage your dashboard, services, and data.
          </p>
        </div>
        <AssistantChat />
      </div>
    </DashboardLayout>
  );
}
