import React from 'react';

export function LessonCard({ name, description, modules }) {
  const lessonId = `lesson-${name.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <article 
      className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all hover:shadow-md"
      aria-labelledby={lessonId}
    >
      <h4 id={lessonId} className="font-bold text-gray-900 text-base mb-1.5">
        {name}
      </h4>
      <p className="text-sm text-gray-500 mb-4">
        {description}
      </p>
      
      {modules && modules.length > 0 && (
        <div className="bg-gray-50/80 rounded-lg p-3.5 border border-gray-100">
          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
            Modules
          </h5>
          <ul className="space-y-2" role="list">
            {modules.map((mod, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start leading-snug">
                <span className="text-indigo-400 mr-2 font-black mt-0.5" aria-hidden="true">•</span>
                <span className="flex-1">{mod.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

