"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/lib/userauth';

export function DashboardLayoutClient({ children, user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard', icon: HomeIcon },
    { name: 'Topics', href: '/dashboard/topics', current: pathname?.startsWith('/dashboard/topics'), icon: BookOpenIcon },
    { name: 'Sessions', href: '/dashboard/sessions', current: pathname?.startsWith('/dashboard/sessions'), icon: CalendarIcon },
    { name: 'Assessments', href: '/dashboard/assessments', current: pathname?.startsWith('/dashboard/assessments'), icon: ChartBarIcon },
  ];

  // Derive initial for avatar
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shrink-0 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Navigation"
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#111827]">Tutorly</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  item.current 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                aria-current={item.current ? 'page' : undefined}
              >
                <item.icon 
                  className={`shrink-0 -ml-1 mr-3 h-5 w-5 transition-colors ${
                    item.current ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`} 
                  aria-hidden="true" 
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200 shadow-sm z-30 relative">
          
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden -ml-2 p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setIsSidebarOpen(true)}
              aria-expanded={isSidebarOpen}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell (Visual only) */}
            <button type="button" className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <span className="sr-only">View notifications</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-shadow"
                id="user-menu-button"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-sm border border-indigo-200">
                  {initial}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-xl bg-white ring-1 ring-black/5 divide-y divide-gray-100 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200"
                  role="menu" 
                  aria-orientation="vertical" 
                  aria-labelledby="user-menu-button"
                >
                  <div className="px-4 py-3" role="none">
                    <p className="text-sm font-medium text-gray-900 truncate" role="none">{user?.name || 'My Profile'}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5" role="none">{user?.email || 'Student Account'}</p>
                  </div>
                  <div className="py-1" role="none">
                    <button
                      type="button"
                      disabled
                      className="group flex items-center w-full px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                      role="menuitem"
                    >
                      <svg className="mr-3 h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Profile Settings (Soon)
                    </button>
                  </div>
                  <div className="py-1" role="none">
                    <form action={logoutUser} className="w-full">
                      <button
                        type="submit"
                        className="group flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors"
                        role="menuitem"
                      >
                        <svg className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>

      </div>
    </div>
  );
}

// Inline Icon Components for easy rendering
function HomeIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BookOpenIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function CalendarIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ChartBarIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

