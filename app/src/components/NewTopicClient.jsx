"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LessonCard } from '@/components/LessonCard';
import { generateTopicAction, refineTopicAction, createTopicAction } from '@/lib/topicActions';

export function NewTopicClient({ userId }) {
  const router = useRouter();
  
  // State for Panel 1 (Input)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    familiarity_level: '',
    additional_info: ''
  });
  
  // State for Panel 2 (Review)
  const [generatedTopic, setGeneratedTopic] = useState(null);
  const [refineInstruction, setRefineInstruction] = useState('');
  
  // Create a unique thread ID for the LangGraph agent to remember the conversation
  const [threadId] = useState(() => crypto.randomUUID());

  // Loading & Error states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const isFormDisabled = isGenerating || generatedTopic !== null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    if (!formData.name || !formData.description || !formData.familiarity_level) {
      setError("Please fill out the required fields (Name, Description, Familiarity Level).");
      return;
    }
    
    setIsGenerating(true);
    setError(null);

    // Call the Server Action instead of a direct browser fetch
    const result = await generateTopicAction({ ...formData, user_id: userId, thread_id: threadId });
    
    if (result.success) {
      setGeneratedTopic(result.data);
    } else {
      setError(result.error);
    }
    setIsGenerating(false);
  };
  
  const handleRefine = async () => {
    if (!refineInstruction.trim()) return;
    
    setIsRefining(true);
    setError(null);

    // Call the Server Action for refinement
    const result = await refineTopicAction({ 
      thread_id: threadId, 
      refine_instruction: refineInstruction 
    });

    if (result.success) {
      setGeneratedTopic(result.data);
      setRefineInstruction(''); // Clear instruction after success
    } else {
      setError(result.error);
    }
    setIsRefining(false);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    // Call the Server Action to save to DB
    const result = await createTopicAction(generatedTopic);

    if (result.success) {
      router.push('/dashboard/topics');
      router.refresh();
    } else {
      setError(result.error);
      setIsCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch w-full max-w-7xl mx-auto pb-12">
      
      {/* Panel 1: Topic Input */}
      <section 
        className={`bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col h-auto lg:h-187.5 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${isFormDisabled ? 'opacity-60 pointer-events-none' : ''}`}
        aria-labelledby="create-topic-heading"
      >
        <h2 id="create-topic-heading" className="text-xl font-bold text-gray-900 mb-6">
          Curriculum Requirements
        </h2>

        {error && !generatedTopic && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-1.5">Topic Name <span className="text-red-500">*</span></label>
            <input 
              id="name"
              name="name"
              type="text"
              required
              disabled={isFormDisabled}
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Advanced Quantum Mechanics"
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none border"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-1.5">Topic Description <span className="text-red-500">*</span></label>
            <textarea 
              id="description"
              name="description"
              required
              disabled={isFormDisabled}
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="What specifically do you want to learn?"
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none border resize-none"
            />
          </div>

          <div>
            <label htmlFor="familiarity_level" className="block text-sm font-semibold text-gray-900 mb-1.5">Familiarity Level <span className="text-red-500">*</span></label>
            <input 
              id="familiarity_level"
              name="familiarity_level"
              type="text"
              required
              disabled={isFormDisabled}
              value={formData.familiarity_level}
              onChange={handleChange}
              placeholder="e.g. Absolute Beginner, College Level"
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none border"
            />
          </div>

          <div>
            <label htmlFor="additional_info" className="block text-sm font-semibold text-gray-900 mb-1.5">Additional Information <span className="text-gray-400 font-normal">(Optional)</span></label>
            <textarea 
              id="additional_info"
              name="additional_info"
              disabled={isFormDisabled}
              rows={2}
              value={formData.additional_info}
              onChange={handleChange}
              placeholder="Any specific goals, preferred learning styles, or timeline?"
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none border resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isFormDisabled}
            className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-[#5438dc] hover:bg-[#4326cb] shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Drafting Curriculum...
              </>
            ) : (
              'Generate Curriculum'
            )}
          </button>
        </div>
      </section>

      {/* Panel 2: Review & Refine */}
      <section 
        className={`bg-white rounded-3xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col h-auto lg:h-187.5 overflow-hidden transition-all duration-500 ${generatedTopic ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
        aria-labelledby="review-topic-heading"
        aria-hidden={!generatedTopic}
      >
        {generatedTopic ? (
          <>
            {/* Scrollable Curriculum Display */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <h2 id="review-topic-heading" className="text-2xl font-extrabold text-gray-900 mb-2">
                {generatedTopic.name}
              </h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {generatedTopic.description}
              </p>
              
              <div className="flex gap-4 mb-8">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  Style: {generatedTopic.teaching_style}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                  Persona: {generatedTopic.persona}
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  Curriculum Plan
                </h3>
                {generatedTopic.lessons?.map((lesson, idx) => (
                  <LessonCard 
                    key={idx}
                    name={lesson.name}
                    description={lesson.description}
                    modules={lesson.modules}
                  />
                ))}
              </div>
            </div>

            {/* Sticky Refinement & Action Footer */}
            <div className="p-6 sm:p-8 bg-gray-50 border-t border-gray-200">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100" role="alert" aria-live="polite">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="refineInstruction" className="block text-sm font-semibold text-gray-900 mb-1.5">Refine Curriculum</label>
                <div className="flex gap-3">
                  <input 
                    id="refineInstruction"
                    type="text"
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="e.g. Add a module about string theory..."
                    className="flex-1 rounded-xl border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none border shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRefine}
                    disabled={isRefining || !refineInstruction.trim()}
                    className="inline-flex items-center justify-center px-5 py-2.5 border border-indigo-200 text-sm font-semibold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isRefining ? 'Refining...' : 'Refine'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating || isRefining}
                className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-[#5438dc] hover:bg-[#4326cb] shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isCreating ? 'Saving Topic...' : 'Approve & Create Topic'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
            <div className="mx-auto h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 border border-indigo-100">
               <svg className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
               </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Curriculum Preview</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Fill out the requirements on the left and click generate. The AI agent will research and structure a personalized learning path for you here.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}