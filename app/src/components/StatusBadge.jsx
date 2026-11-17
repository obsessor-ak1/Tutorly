import React from 'react';
import { STATUS_META, normalizeStatus } from '@/lib/status';

export function StatusBadge({ status }) {
  const { label, badgeClass } = STATUS_META[normalizeStatus(status)];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${badgeClass}`}
    >
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}
