"use client";

import React, { useId, useState } from 'react';
import Link from 'next/link';

const PRIMARY_CLASS =
  'inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#5438dc] hover:bg-[#4326cb] shadow-md shadow-indigo-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-wait';
const SECONDARY_CLASS =
  'inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-wait';

function Panel({ title, description, children }) {
  const id = useId();
  return (
    <section aria-labelledby={`${id}-title`} className="border-t border-gray-100 bg-gray-50/60 p-5 sm:p-6">
      <h2 id={`${id}-title`} className="text-sm font-bold text-gray-900">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Shown at the end of a module or after answering a follow-up. */
function FollowupPanel({ busy, isLastModule, onAdvance, onFollowup }) {
  const [question, setQuestion] = useState('');
  const inputId = useId();

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    onFollowup(trimmed);
    setQuestion('');
  };

  return (
    <Panel
      title="Module checkpoint"
      description={`Ask a follow-up question, or ${isLastModule ? 'finish the lesson' : 'move on to the next module'}.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor={inputId} className="sr-only">
          Follow-up question
        </label>
        <textarea
          id={inputId}
          rows={2}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) handleSubmit(event);
          }}
          disabled={busy}
          placeholder="Ask about anything in this module…"
          className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
        />
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onAdvance} disabled={busy} className={SECONDARY_CLASS}>
            {isLastModule ? 'Finish lesson' : 'Next module'}
          </button>
          <button type="submit" disabled={busy || !question.trim()} className={PRIMARY_CLASS}>
            Ask follow-up
          </button>
        </div>
      </form>
    </Panel>
  );
}

/** Renders the controls for the interrupt the session is waiting on. */
export function StageControls({ interruptType, finished, assignmentId, busy, isLastModule, onProceed, onAdvance, onFollowup }) {
  if (interruptType === 'continue') {
    return (
      <Panel title="Ready for more?" description="Your tutor has more to explain in this module.">
        <button type="button" onClick={onProceed} disabled={busy} className={PRIMARY_CLASS}>
          Continue
        </button>
      </Panel>
    );
  }

  if (interruptType === 'complete') {
    return (
      <FollowupPanel busy={busy} isLastModule={isLastModule} onAdvance={onAdvance} onFollowup={onFollowup} />
    );
  }

  if (interruptType === 'assess') {
    return (
      <Panel title="Lesson complete" description="Your assessment is ready. Test what you have learned.">
        <Link href={`/dashboard/assessments/${assignmentId}`} className={PRIMARY_CLASS}>
          Start Assessment
        </Link>
      </Panel>
    );
  }

  if (finished) {
    return (
      <Panel title="Lesson complete" description="You have completed this lesson and its assessment.">
        {assignmentId && (
          <Link href={`/dashboard/assessments/${assignmentId}`} className={SECONDARY_CLASS}>
            View Results
          </Link>
        )}
      </Panel>
    );
  }

  return null;
}
