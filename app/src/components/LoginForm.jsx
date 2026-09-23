"use client";

import React, { useState, useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StatusBox } from '@/components/StatusBox';
import { validateAndLoginUser, loginStatus } from '@/lib/userauth';

export default function LoginPage() {
  
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);

  // useActionState handles our form state with the server action
  const [state, formAction, isPending] = useActionState(validateAndLoginUser, null);

  useEffect(() => {
    // If login is successful, we can reset the form (though it will redirect)
    if (state?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state?.success]);

  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-hidden bg-gray-50 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-50">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-300/30 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-300/30 blur-[130px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-300/30 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-white/50 backdrop-blur-3xl"></div>
      </div>

      {/* Floating handwritten notes */}
      <div className="hidden lg:block absolute top-1/4 left-[15%] text-indigo-600/60 font-medium italic text-lg transform -rotate-12 z-10">
        <span>Small<br/>Steps<br/>Big Progress</span>
      </div>
      <div className="hidden lg:flex absolute top-1/3 right-[15%] text-indigo-600/60 font-medium italic text-lg transform rotate-6 z-10 flex-col items-center">
        <span className="text-center">Curiosity<br/>today.<br/>A brighter<br/>tomorrow.</span>
        <svg aria-hidden="true" className="w-8 h-8 mt-1 text-indigo-400/50 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header / Logo */}
        <div className="mb-10 flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#111827]">Tutorly</span>
          </Link>
          <div className="flex items-center gap-4 text-[10px] sm:text-xs font-bold text-gray-400 tracking-[0.25em]">
            <span>LEARN</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>GROW</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>ACHIEVE</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-4xl p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-[#111827] mb-3 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-62.5 mx-auto">
              Log in to continue your learning journey with Tutorly.
            </p>
          </div>

          <form ref={formRef} action={formAction} className="space-y-6">
            
            {/* Status Box */}
            {state && (
              <StatusBox type={state.success ? 'success' : 'error'} message={state.error || state.message} />
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900 block" htmlFor="email">Email</label>
              <Input 
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900 block" htmlFor="password">Password</label>
              <div className="relative">
                <Input 
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pr-11"
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isPending}
              variant="primary" 
              className="w-full justify-center bg-[#5438dc] hover:bg-[#4326cb] disabled:opacity-70 disabled:cursor-not-allowed py-3.5 text-base font-semibold shadow-lg shadow-indigo-500/25 group transition-all"
            >
              {isPending ? 'Logging in...' : 'Log in'}
              {!isPending && (
                <svg aria-hidden="true" className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </Button>
            
            <div className="text-center mt-4">
               <Link href="#" className="text-sm font-semibold text-[#5438dc] hover:text-[#4326cb] transition-colors">
                 Forgot password?
               </Link>
            </div>
            
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">
                Don{"\u0027"}t have an account yet?{' '}
                <Link href="/userauth/signup" className="font-semibold text-[#5438dc] hover:text-[#4326cb] transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full flex justify-center pb-8 pt-4 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs font-bold text-gray-400/80 tracking-[0.25em]">
            <div className="hidden sm:block h-px w-12 bg-gray-300"></div>
            <span>KNOW MORE</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>DO MORE</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>BE MORE</span>
            <div className="hidden sm:block h-px w-12 bg-gray-300"></div>
          </div>
      </footer>
    </div>
  );
}
