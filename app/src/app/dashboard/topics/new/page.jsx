import React from 'react';
import { auth } from '@/auth';
import { NewTopicClient } from '@/components/NewTopicClient';

export default async function NewTopicPage() {
  const session = await auth();
  
  if (!session?.user) {
    return null; // Layout handles redirect
  }

  return (
    <div className="w-full">
      {/* Header */}
      <header className="mb-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Create a New Topic</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tell us what you want to learn. Our AI agent will research the topic and structure a personalized curriculum.
        </p>
      </header>
      
      {/* Client Component handling the dual-panel state and agent communication */}
      <NewTopicClient userId={session.user.id} />
    </div>
  );
}

