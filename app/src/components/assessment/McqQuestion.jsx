import React from 'react';

const OPTION_BASE =
  'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors';

function optionState(question, key) {
  if (key === question.correctOption) return 'correct';
  if (key === question.selected) return 'incorrect';
  return 'neutral';
}

const RESULT_CLASS = {
  correct: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  incorrect: 'border-red-300 bg-red-50 text-red-900',
  neutral: 'border-gray-200 text-gray-600',
};

const RESULT_NOTE = {
  correct: (selected) => (selected ? 'Your answer, correct' : 'Correct answer'),
  incorrect: () => 'Your answer, incorrect',
  neutral: () => null,
};

/**
 * A multiple choice question as a radio group. With `readOnly`, it shows the
 * graded result: the user's choice, the correct option and the explanation.
 */
export function McqQuestion({ id, number, question, value, onChange, invalid = false, readOnly = false }) {
  const explanationId = `${id}-explanation`;

  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-invalid={invalid || undefined}
      aria-describedby={readOnly ? explanationId : undefined}
      className={`rounded-2xl border bg-white p-5 sm:p-6 focus:outline-none ${invalid ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-100'}`}
    >
      <legend className="float-left w-full mb-4 text-base font-semibold text-gray-900">
        <span className="text-indigo-600 mr-2">{number}.</span>
        {question.questionText}
      </legend>

      <div className="clear-both space-y-2.5">
        {question.options.map(({ key, text }) => {
          const optionId = `${id}-option-${key}`;
          const state = readOnly ? optionState(question, key) : null;
          const note = readOnly ? RESULT_NOTE[state](key === question.selected) : null;

          return (
            <label
              key={key}
              htmlFor={optionId}
              className={`${OPTION_BASE} ${
                readOnly
                  ? RESULT_CLASS[state]
                  : 'border-gray-200 cursor-pointer hover:border-indigo-300 has-checked:border-indigo-400 has-checked:bg-indigo-50/50 text-gray-800'
              }`}
            >
              <input
                id={optionId}
                type="radio"
                name={id}
                value={key}
                checked={(readOnly ? question.selected : value) === key}
                onChange={() => onChange?.(key)}
                disabled={readOnly}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#5438dc]"
              />
              <span className="flex-1">
                <span className="font-semibold uppercase mr-1.5" aria-hidden="true">{key}.</span>
                {text}
              </span>
              {note && (
                <span className="shrink-0 text-xs font-semibold">{note}</span>
              )}
            </label>
          );
        })}
      </div>

      {readOnly && (
        <div id={explanationId} className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-700 leading-relaxed">
          <p className="font-semibold text-gray-900 mb-1">
            {question.isCorrect ? 'Correct.' : question.selected ? 'Incorrect.' : 'Not answered.'} Explanation
          </p>
          <p className="whitespace-pre-wrap">{question.explanation}</p>
        </div>
      )}
    </fieldset>
  );
}
