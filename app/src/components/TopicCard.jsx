import React from 'react';
import Link from 'next/link';

export function TopicCard({ id, name, description, dateCreated }) {
  // Format the date defensively in case of invalid strings
  const formattedDate = new Date(dateCreated).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <article 
      className="bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-shadow hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]"
      aria-labelledby={`topic-title-${id}`}
    >
      <div className="flex-1 min-w-0">
        <h3 id={`topic-title-${id}`} className="text-lg font-bold text-gray-900 mb-1.5 truncate">
          {name}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center text-xs font-medium text-gray-400">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <time dateTime={dateCreated}>
            Created on {formattedDate}
          </time>
        </div>
      </div>
      
      <div className="shrink-0 mt-1 sm:mt-0">
        <Link 
          href={`/dashboard/topics/${id}`}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
          aria-label={`Open topic: ${name}`}
        >
          Open Topic
          <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

