import React from 'react';

export default async function DashboardPage() {
  return (
    <>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      
      {/* Decorative Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 px-4 py-5 sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Upcoming Sessions</dt>
          <dd className="mt-2 text-3xl font-bold tracking-tight text-indigo-600">2</dd>
        </div>
        <div className="bg-white overflow-hidden rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 px-4 py-5 sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Topics Mastered</dt>
          <dd className="mt-2 text-3xl font-bold tracking-tight text-purple-600">14</dd>
        </div>
        <div className="bg-white overflow-hidden rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 px-4 py-5 sm:p-6 sm:col-span-2 lg:col-span-1">
          <dt className="truncate text-sm font-medium text-gray-500">Avg. Assessment Score</dt>
          <dd className="mt-2 text-3xl font-bold tracking-tight text-blue-600">92%</dd>
        </div>
      </div>

      {/* Main Empty State / Content Card */}
      <div className="bg-white rounded-4xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white p-8 sm:p-12 text-center min-h-100 flex flex-col items-center justify-center relative overflow-hidden">
         {/* Decorative background gradients for the card */}
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-50/50 blur-3xl pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-50/50 blur-3xl pointer-events-none"></div>
         
         <div className="relative z-10">
           <div className="mx-auto h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <svg className="h-12 w-12 text-indigo-600/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to your Dashboard</h3>
           <p className="text-gray-500 max-w-md mx-auto mb-8">
             You&apos;re all set up! Select a topic from the sidebar to begin learning or check your upcoming sessions.
           </p>
           <button type="button" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-[#5438dc] hover:bg-[#4326cb] shadow-lg shadow-indigo-500/25 transition-all">
             Start Learning
           </button>
         </div>
      </div>
    </>
  );
}
