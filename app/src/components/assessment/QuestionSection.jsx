import React from 'react';

/** A titled group of questions (multiple choice or written). */
export function QuestionSection({ id, title, description, children }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div>
        <h2 id={id} className="text-lg font-bold text-gray-900">
          {title}
        </h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}
