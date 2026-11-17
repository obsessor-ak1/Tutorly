"use client";

import React, { useId, useState } from 'react';
import { Modal } from '@/components/Modal';
import { hostnameOf } from '@/components/session/ResourceList';

const PREVIEW_LENGTH = 180;

function preview(content) {
  const text = String(content ?? '').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
}

/**
 * Required step after resources are gathered: the user picks which ones the
 * tutor should learn from. Resources arrive as `{ [url]: { score, content } }`.
 */
export function ResourceSelectionDialog({ open, resources, pending, onSubmit }) {
  const urls = Object.keys(resources ?? {});
  const [selected, setSelected] = useState(() => new Set(urls));
  const id = useId();

  const toggle = (url) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(urls.filter((url) => selected.has(url)));
  };

  return (
    <Modal
      open={open}
      title="Choose your learning resources"
      description="We found these resources for your lesson. Select the ones your tutor should use."
      dismissible={false}
      busy={pending}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="mt-5">
        <fieldset>
          <legend className="sr-only">Resources</legend>
          <div className="flex items-center justify-between mb-3 text-xs font-semibold">
            <span className="text-gray-500" aria-live="polite">
              {selected.size} of {urls.length} selected
            </span>
            <div className="flex gap-3">
              <button type="button" onClick={() => setSelected(new Set(urls))} className="text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
                Select all
              </button>
              <button type="button" onClick={() => setSelected(new Set())} className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
                Clear
              </button>
            </div>
          </div>

          <ul className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1" role="list">
            {urls.map((url, index) => {
              const inputId = `${id}-resource-${index}`;
              const previewId = `${inputId}-preview`;
              const score = Number(resources[url]?.score);

              return (
                <li key={url}>
                  <label
                    htmlFor={inputId}
                    className="flex gap-3 items-start rounded-xl border border-gray-200 p-3.5 cursor-pointer hover:border-indigo-300 has-checked:border-indigo-400 has-checked:bg-indigo-50/40 transition-colors"
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={selected.has(url)}
                      onChange={() => toggle(url)}
                      aria-describedby={previewId}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#5438dc]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-gray-900" title={url}>
                          {hostnameOf(url)}
                        </span>
                        {Number.isFinite(score) && (
                          <span className="shrink-0 text-xs font-medium text-gray-500">
                            {Math.round(score * 100)}% relevant
                          </span>
                        )}
                      </span>
                      <span id={previewId} className="mt-1 block text-xs text-gray-500 leading-relaxed">
                        {preview(resources[url]?.content)}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#5438dc] hover:bg-[#4326cb] shadow-md shadow-indigo-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-wait"
          >
            {pending ? 'Preparing lesson…' : selected.size > 0 ? 'Start learning' : 'Continue without resources'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
