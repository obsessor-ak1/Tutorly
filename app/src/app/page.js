import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/Button';
export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#f8f9fc] via-[#f5f3ff] to-[#fcebfa] flex flex-col font-sans overflow-hidden text-gray-800">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-6 md:px-12 lg:px-20 w-full max-w-350 mx-auto z-50">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded bg-indigo-600 text-white">
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-[#111827]">Tutorly</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/userauth/login">
            <Button variant="outline" className="hidden sm:inline-flex border-gray-300 px-6 font-semibold text-gray-700">Log in</Button>
          </Link>
          <Link href="/userauth/signup">
            <Button variant="primary" className="px-6 font-semibold bg-[#5438dc] hover:bg-[#4326cb]">Sign up</Button>
          </Link>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 flex flex-col lg:flex-row w-full max-w-350 mx-auto px-6 md:px-12 lg:px-20 pt-8 pb-16 relative">
        
        {/* Left Content */}
        <div className="flex-1 flex flex-col justify-center max-w-xl z-10 pt-10 lg:pt-0">
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 tracking-[0.2em] mb-8">
            <span>LEARN</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>GROW</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>ACHIEVE</span>
          </div>
          
          <h1 className="text-[2.75rem] sm:text-5xl md:text-6xl lg:text-[4rem] font-extrabold text-[#111827] leading-[1.1] mb-6 tracking-tight">
            A Smarter<br/>
            Learning Partner<br/>
            for a <span className="text-transparent bg-clip-text bg-linear-to-r from-[#4d6bfe] to-[#8c3cf9]">Brighter You</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-md leading-relaxed">
            Set your goals. Get a personalized learning path. Learn with AI. Track your progress. Become the best version of you.
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-16">
            <Link href="/userauth/signup">
              <Button variant="primary" size="lg" className="group shadow-xl shadow-indigo-500/20 bg-[#5438dc] hover:bg-[#4326cb] px-8 py-3.5 text-lg rounded-full">
                Get Started 
                <svg aria-hidden="true" className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </Link>
            <p className="text-sm text-gray-400 font-medium">
              It{"\u0027"}s free. Just a step closer to your goals.
            </p>
          </div>
          
          {/* Features Row */}
          <div className="flex flex-wrap items-start gap-10 md:gap-14 text-sm font-semibold text-[#111827]">
            <div className="flex flex-col gap-4">
              <svg aria-hidden="true" className="w-6 h-6 text-[#5438dc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Personalized<br/>Learning</span>
            </div>
            <div className="flex flex-col gap-4">
              <svg aria-hidden="true" className="w-6 h-6 text-[#5438dc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Track<br/>Progress</span>
            </div>
            <div className="flex flex-col gap-4">
              <svg aria-hidden="true" className="w-6 h-6 text-[#5438dc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Learn<br/>Anything</span>
            </div>
          </div>
        </div>
        
        {/* Right Content / Illustration Area (Hidden on small screens) */}
        <div className="flex-1 relative hidden lg:flex items-center justify-center mt-10 lg:mt-0">
          
          {/* Decorative background glow */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-100 h-100 bg-purple-200/50 rounded-full blur-3xl -z-10"></div>
          <div className="absolute right-40 top-1/4 w-75 h-75 bg-blue-200/40 rounded-full blur-3xl -z-10"></div>
          
          <div className="relative w-full h-150 flex items-center justify-center">
             
             {/* Mocking the Illustration Elements */}
             <div className="relative w-full h-full max-w-lg">
                
                {/* Floating Handwritten Notes */}
                <div className="absolute top-32 -left-4 text-gray-500/70 italic text-sm transform -rotate-12 flex flex-col items-end">
                   <svg aria-hidden="true" className="w-8 h-8 mb-1 text-gray-300 transform scale-x-[-1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                   <span>Your path.<br/>Your pace.</span>
                </div>

                <div className="absolute top-24 right-4 text-gray-500/70 italic text-sm transform rotate-6">
                   <span>Same goals.<br/>Brighter tomorrows.</span>
                   <svg aria-hidden="true" className="w-8 h-8 mt-1 text-gray-300 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                </div>

                {/* Floating UI Cards */}
                <div className="absolute top-10 right-28 flex flex-col gap-4 w-65 z-20">
                  
                  {/* Card: Plan */}
                  <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] flex items-center gap-4 transform hover:-translate-y-1 transition-all duration-300">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-0.5">Plan</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Set your learning goals</p>
                    </div>
                  </div>
                  
                  {/* Card: Learn */}
                  <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] flex items-center gap-4 transform translate-x-6 hover:-translate-y-1 transition-all duration-300">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5438dc]">
                      <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-0.5">Learn</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Get personalized content</p>
                    </div>
                  </div>
                  
                  {/* Card: Practice */}
                  <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] flex items-center gap-4 transform hover:-translate-y-1 transition-all duration-300">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-0.5">Practice</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Test your understanding</p>
                    </div>
                  </div>
                  
                  {/* Card: Track */}
                  <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] flex items-center gap-4 transform translate-x-3 hover:-translate-y-1 transition-all duration-300">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-gray-700">
                      <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-0.5">Track</h3>
                      <p className="text-[11px] text-gray-500 font-medium">See real progress</p>
                    </div>
                  </div>
                </div>

                {/* Central Illustration Area */}
                <div className="absolute bottom-10 left-10 w-100 h-75 bg-linear-to-t from-indigo-100/50 to-transparent rounded-b-[40px] flex items-end justify-center z-10 border-b-2 border-indigo-50/50">
                  <div className="w-[80%] h-[80%] relative shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.05)]">
                     <div className="absolute inset-0 rounded-t-3xl rounded-b-lg overflow-hidden border border-white/40">
                        <Image 
                           src="/images/hero-illustration.jpg" 
                           alt="Student studying on laptop" 
                           fill
                           sizes="(max-width: 768px) 100vw, 50vw"
                           className="object-cover"
                           priority
                        />
                     </div>
                     
                     {/* Floating robot mockup */}
                     <div className="absolute -top-16 -right-12 w-24 h-24 rounded-[30px] bg-white shadow-2xl flex flex-col items-center justify-center animate-bounce border border-gray-50">
                        <div className="w-16 h-12 bg-[#1a1c29] rounded-2xl relative overflow-hidden flex items-center justify-center gap-2">
                           <div className="w-3 h-3 bg-blue-400 rounded-full blur-[1px]"></div>
                           <div className="w-3 h-3 bg-blue-400 rounded-full blur-[1px]"></div>
                        </div>
                     </div>
                  </div>
                </div>

             </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full flex justify-center pb-12 pt-4">
          <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs font-bold text-gray-400 tracking-[0.25em]">
            <div className="hidden sm:block h-px w-16 bg-gray-300"></div>
            <span>KNOW MORE</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>DO MORE</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>BE MORE</span>
            <div className="hidden sm:block h-px w-16 bg-gray-300"></div>
          </div>
      </footer>
    </div>
  );
}
