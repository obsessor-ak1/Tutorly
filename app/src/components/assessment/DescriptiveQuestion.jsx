import React from 'react';
import { DESCRIPTIVE_MAX_SCORE } from '@/lib/assessment';

function scoreTone(score) {
  const ratio = score / DESCRIPTIVE_MAX_SCORE;
  if (ratio >= 0.8) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (ratio >= 0.4) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function GradedAnswer({ id, question }) {
  const { evaluation } = question;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your answer</h3>
        <p id={`${id}-answer`} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
          {question.answer || 'Not answered.'}
        </p>
      </div>

      {evaluation && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            Score
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${scoreTone(evaluation.score)}`}>
              {evaluation.score} / {DESCRIPTIVE_MAX_SCORE}
            </span>
          </p>
          {evaluation.feedback && (
            <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{evaluation.feedback}</p>
          )}
        </div>
      )}

      <details className="group rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
          Show reference answer
        </summary>
        <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{question.referenceAnswer}</p>
      </details>
    </div>
  );
}

/**
 * A written-answer question. With `readOnly`, it shows the submitted answer,
 * its score and feedback, and the reference answer.
 */
export function DescriptiveQuestion({ id, number, question, value, onChange, invalid = false, readOnly = false }) {
  const inputId = `${id}-input`;
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-2xl border bg-white p-5 sm:p-6 ${invalid ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-100'}`}
    >
      <h3 id={headingId} className="mb-4 text-base font-semibold text-gray-900">
        <span className="text-indigo-600 mr-2">{number}.</span>
        {readOnly ? question.questionText : <label htmlFor={inputId}>{question.questionText}</label>}
      </h3>

      {readOnly ? (
        <GradedAnswer id={id} question={question} />
      ) : (
        <textarea
          id={inputId}
          rows={5}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid || undefined}
          placeholder="Write your answer…"
          className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
    </section>
  );
}
