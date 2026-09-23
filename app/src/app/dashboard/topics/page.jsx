import React from 'react';
import Link from 'next/link';
import { TopicCard } from '@/components/TopicCard';
import dbConnect from '@/lib/db';
import { Topic } from '@/models/Topic';
import { auth } from '@/auth';

export default async function TopicsPage() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  await dbConnect();

  // Fetch topics for current user. We use $or to catch records inserted by both Node.js (userId) and Python (user_id)
  const topicsData = await Topic.find({ 
    $or: [{ userId: session.user.id }, { user_id: session.user.id }] 
  }).sort({ createdAt: -1 }).lean();

  const topics = topicsData.map(topic => ({
    id: topic._id.toString(),
    name: topic.name,
    description: topic.description,
    dateCreated: topic.createdAt ? topic.createdAt.toISOString() : new Date().toISOString()
  }));

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" id="topics-heading">My Topics</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your learning curriculums.</p>
        </div>
        
        <Link 
          href="/dashboard/topics/new"
          className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#5438dc] hover:bg-[#4326cb] shadow-md shadow-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Start a new topic"
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Topic
        </Link>
      </header>

      {/* Topics List Section */}
      <section aria-labelledby="topics-heading">
        {topics.length > 0 ? (
          <div className="flex flex-col space-y-4" role="list">
            {topics.map((topic) => (
              <div key={topic.id} role="listitem">
                <TopicCard 
                  id={topic.id}
                  name={topic.name}
                  description={topic.description}
                  dateCreated={topic.dateCreated}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center flex flex-col items-center justify-center">
             <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-1">No topics for current user</h3>
             <p className="text-sm text-gray-500 max-w-sm mb-6">
               Get started by creating your first personalized curriculum to begin learning.
             </p>
             <Link 
                href="/dashboard/topics/new"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
             >
                + Create your first topic
             </Link>
          </div>
        )}
      </section>
    </div>
  );
}

