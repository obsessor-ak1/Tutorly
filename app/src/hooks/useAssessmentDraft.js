"use client";

import { useCallback, useMemo, useSyncExternalStore } from 'react';

// Unsubmitted answers are kept in localStorage so they survive reloads.
const storageKey = (assignmentId) => `tutorly:assessment-draft:${assignmentId}`;
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

function parseDraft(raw, mcqCount, descriptiveCount) {
  let draft = {};
  try {
    draft = raw ? JSON.parse(raw) : {};
  } catch {
    // Ignore a corrupt draft.
  }
  return {
    mcq: Array.from({ length: mcqCount }, (_, i) => draft.mcq?.[i] ?? null),
    descriptive: Array.from({ length: descriptiveCount }, (_, i) => draft.descriptive?.[i] ?? ''),
  };
}

/** Clears the saved draft of an assignment. */
export function clearAssessmentDraft(assignmentId) {
  localStorage.removeItem(storageKey(assignmentId));
  notify();
}

/**
 * Draft answers of an assignment: `{ mcq: (key|null)[], descriptive: string[] }`
 * plus setters for single answers.
 */
export function useAssessmentDraft(assignmentId, mcqCount, descriptiveCount) {
  const key = storageKey(assignmentId);
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null
  );
  const answers = useMemo(
    () => parseDraft(raw, mcqCount, descriptiveCount),
    [raw, mcqCount, descriptiveCount]
  );

  const update = useCallback(
    (kind, index, value) => {
      const current = parseDraft(localStorage.getItem(key), mcqCount, descriptiveCount);
      current[kind][index] = value;
      localStorage.setItem(key, JSON.stringify(current));
      notify();
    },
    [key, mcqCount, descriptiveCount]
  );

  return {
    answers,
    setMcqAnswer: (index, option) => update('mcq', index, option),
    setDescriptiveAnswer: (index, text) => update('descriptive', index, text),
  };
}
