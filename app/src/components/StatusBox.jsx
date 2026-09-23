import React from 'react';

export function StatusBox({ type = 'error', message }) {
  if (!message) return null;

  const isError = type === 'error';
  
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${isError ? 'bg-red-50/50 border-red-100 text-red-800' : 'bg-emerald-50/50 border-emerald-100 text-emerald-800'} animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className={`mt-0.5 shrink-0 ${isError ? 'text-red-500' : 'text-emerald-500'}`}>
        {isError ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <p className="text-sm font-medium leading-relaxed">
        {message}
      </p>
    </div>
  );
}

