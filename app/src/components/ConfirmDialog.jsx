"use client";

import React from 'react';
import { Modal } from '@/components/Modal';

const CONFIRM_TONE_CLASS = {
  danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  primary: 'bg-[#5438dc] hover:bg-[#4326cb] focus:ring-indigo-500',
};

/** Modal confirmation for irreversible actions. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  pendingLabel = 'Working…',
  pending = false,
  tone = 'danger',
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      role="alertdialog"
      busy={pending}
      onClose={onClose}
    >
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        {/* Receives initial focus: the safe choice. */}
        <button
          type="button"
          autoFocus
          onClick={onClose}
          disabled={pending}
          className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${CONFIRM_TONE_CLASS[tone]}`}
        >
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
