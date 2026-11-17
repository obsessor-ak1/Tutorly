import React from 'react';
import { STATUS, STATUS_META, normalizeStatus } from '@/lib/status';

const TICK_CLASS = {
  [STATUS.NOT_STARTED]: 'border-gray-300 bg-white',
  [STATUS.IN_PROGRESS]: 'border-amber-500 bg-amber-50 text-amber-600',
  [STATUS.COMPLETED]: 'border-emerald-600 bg-emerald-600 text-white',
};

/** Tri-state tickbox: empty, partially filled (in progress) or ticked. */
function StatusTick({ status }) {
  return (
    <span
      className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center ${TICK_CLASS[status]}`}
      aria-hidden="true"
    >
      {status === STATUS.COMPLETED && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {status === STATUS.IN_PROGRESS && <span className="h-0.5 w-2.5 rounded-full bg-current" />}
    </span>
  );
}

export function ModuleChecklist({ modules }) {
  return (
    <ol className="space-y-3" role="list">
      {modules.map((module, index) => {
        const status = normalizeStatus(module.status);
        const isCurrent = status === STATUS.IN_PROGRESS;

        return (
          <li
            key={`${index}-${module.title}`}
            className="flex items-start gap-3"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <StatusTick status={status} />
            <span
              className={`text-sm leading-snug ${
                isCurrent ? 'font-semibold text-gray-900' : status === STATUS.COMPLETED ? 'text-gray-500' : 'text-gray-700'
              }`}
            >
              <span className="sr-only">
                Module {index + 1}, {STATUS_META[status].label}:{' '}
              </span>
              {module.title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
