import React from 'react';
import Link from 'next/link';

export function EmptyState({ title, description, actionHref, actionLabel }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center flex flex-col items-center justify-center">
      <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {actionHref && (
        <Link
          href={actionHref}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
