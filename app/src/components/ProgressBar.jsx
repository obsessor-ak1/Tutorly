import React from 'react';

export function ProgressBar({ value, max, label }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const valueText = `${value} of ${max}`;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
      >
        <div
          className="h-full rounded-full bg-[#5438dc] transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-500 tabular-nums" aria-hidden="true">
        {valueText}
      </span>
    </div>
  );
}
