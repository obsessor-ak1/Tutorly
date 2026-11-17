"use client";

import React, { useEffect, useId, useRef } from 'react';

/**
 * Accessible modal built on the native <dialog>, which provides focus
 * trapping and inert background content. Non-dismissible modals ignore the
 * Escape key, for steps the user must complete.
 */
export function Modal({
  open,
  title,
  description,
  role = 'dialog',
  dismissible = true,
  busy = false,
  onClose,
  className = 'max-w-md',
  children,
}) {
  const dialogRef = useRef(null);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleCancel = (event) => {
    if (!dismissible) event.preventDefault();
  };

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={busy}
      onCancel={handleCancel}
      onClose={onClose}
      className={`m-auto w-[calc(100%-2rem)] rounded-2xl p-6 shadow-xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm ${className}`}
    >
      <h2 id={titleId} className="text-lg font-bold text-gray-900">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mt-2 text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </dialog>
  );
}
