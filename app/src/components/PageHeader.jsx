import React from 'react';

export function PageHeader({ headingId, title, description, children }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 id={headingId} className="text-2xl font-bold text-gray-900">
          {title}
        </h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </header>
  );
}
