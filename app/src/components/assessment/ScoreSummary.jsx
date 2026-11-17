"use client";

import React, { useEffect, useRef } from 'react';

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/70 border border-indigo-100 px-4 py-3">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-gray-900 tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Overall result of a graded assignment. Takes focus when shown right after
 * submission so keyboard and screen-reader users land on their score.
 */
export function ScoreSummary({ result, focusOnMount = false }) {
  const ref = useRef(null);
  const percent = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

  useEffect(() => {
    if (focusOnMount) ref.current?.focus();
  }, [focusOnMount]);

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby="score-heading"
      className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <h2 id="score-heading" className="text-sm font-bold text-indigo-900">
        Your result
      </h2>
      <p className="mt-2 text-4xl font-extrabold text-indigo-700 tabular-nums">
        {result.score} <span className="text-xl font-bold text-indigo-400">/ {result.maxScore}</span>
        <span className="ml-3 text-base font-semibold text-indigo-600">({percent}%)</span>
      </p>
      <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Stat label="Multiple choice" value={`${result.mcqCorrect} / ${result.mcqTotal} correct`} />
        <Stat label="Written answers" value={`${result.descriptiveScore} / ${result.descriptiveMax} points`} />
      </dl>
    </section>
  );
}
