"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { STATUS, normalizeStatus } from '@/lib/status';

const BASE_CLASS =
  'w-full inline-flex items-center justify-center px-5 py-3 md:py-2.5 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-wait';

const VARIANT_CLASS = {
  start: 'bg-[#5438dc] hover:bg-[#4326cb] text-white shadow-md shadow-indigo-500/20',
  resume: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20',
  restart: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  view: 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50',
};

/**
 * Status-driven actions for a lesson or assignment:
 *  - not started -> Start
 *  - in progress -> Resume + Restart (with confirmation)
 *  - completed   -> View
 *
 * `startAction` / `restartAction` are server actions already bound to the
 * item; they redirect on success and resolve to `{ error }` on failure.
 */
export function ItemActions({
  itemName,
  itemType,
  status,
  href,
  startAction,
  restartAction,
  viewLabel = 'View',
  restartDescription,
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState(null);

  const run = (name, action) => {
    setError(null);
    setPendingAction(name);
    startTransition(async () => {
      const result = await action();
      // Only reached on failure: success redirects to the item's page.
      if (result?.error) {
        setError(result.error);
        setIsConfirmOpen(false);
      }
      setPendingAction(null);
    });
  };

  const label = (verb) => `${verb} ${itemType}: ${itemName}`;
  const current = normalizeStatus(status);

  return (
    <div className="flex flex-col gap-2.5" role="group" aria-label={`Actions for ${itemName}`}>
      {current === STATUS.NOT_STARTED && (
        <button
          type="button"
          onClick={() => run('start', startAction)}
          disabled={isPending}
          aria-busy={pendingAction === 'start'}
          aria-label={label('Start')}
          className={`${BASE_CLASS} ${VARIANT_CLASS.start}`}
        >
          {pendingAction === 'start' ? 'Starting…' : 'Start'}
        </button>
      )}

      {current === STATUS.IN_PROGRESS && (
        <>
          <Link href={href} aria-label={label('Resume')} className={`${BASE_CLASS} ${VARIANT_CLASS.resume}`}>
            Resume
          </Link>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isPending}
            aria-haspopup="dialog"
            aria-label={label('Restart')}
            className={`${BASE_CLASS} ${VARIANT_CLASS.restart}`}
          >
            Restart
          </button>
          <ConfirmDialog
            open={isConfirmOpen}
            title={`Restart this ${itemType}?`}
            description={restartDescription}
            confirmLabel="Restart"
            pendingLabel="Restarting…"
            pending={pendingAction === 'restart'}
            onConfirm={() => run('restart', restartAction)}
            onClose={() => setIsConfirmOpen(false)}
          />
        </>
      )}

      {current === STATUS.COMPLETED && (
        <Link href={href} aria-label={label(viewLabel)} className={`${BASE_CLASS} ${VARIANT_CLASS.view}`}>
          {viewLabel}
        </Link>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
