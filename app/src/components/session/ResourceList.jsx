import React from 'react';

export function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ResourceList({ resources }) {
  if (resources.length === 0) {
    return <p className="text-sm text-gray-500">No resources selected yet.</p>;
  }

  return (
    <ul className="space-y-2" role="list">
      {resources.map((url) => (
        <li key={url} className="min-w-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={url}
            className="block truncate text-sm text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            {hostnameOf(url)}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
