"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { readServerSentEvents } from '@/lib/sse';

export const PHASE = {
  LOADING: 'loading',
  STREAMING: 'streaming',
  READY: 'ready',
  ERROR: 'error',
};

const newId = () => crypto.randomUUID();

async function readError(response) {
  const body = await response.json().catch(() => ({}));
  return body.error || 'Something went wrong. Please try again.';
}

/** Appends a streamed token to the tutor message it belongs to. */
function appendToken(messages, { message_id: messageId, content }) {
  const last = messages.at(-1);
  if (last?.role === 'tutor' && last.streaming && last.id === (messageId ?? last.id)) {
    return [...messages.slice(0, -1), { ...last, content: last.content + content }];
  }
  return [...messages, { id: messageId ?? newId(), role: 'tutor', content, streaming: true }];
}

const settle = (messages) =>
  messages.map((m) => (m.streaming ? { ...m, streaming: false } : m));

/**
 * Drives a tutor session through the `/api/tutor/[sid]` proxy.
 *
 * Exposes the latest stage (current interrupt, lesson, assignment...), the
 * conversation built from streamed tutor tokens and the user's follow-ups,
 * and one function per interrupt the user can answer.
 */
export function useTutorSession(sessionId) {
  const [stage, setStage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState(PHASE.LOADING);
  const [error, setError] = useState(null);
  const hasLoaded = useRef(false);

  const runAction = useCallback(
    async (action, body = {}, userMessage = null) => {
      setError(null);
      setPhase(PHASE.STREAMING);
      if (userMessage) {
        setMessages((prev) => [...prev, { id: newId(), role: 'user', content: userMessage }]);
      }

      try {
        const response = await fetch(`/api/tutor/${sessionId}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(await readError(response));

        let receivedTokens = false;
        let finalStage = null;
        for await (const { event, data } of readServerSentEvents(response)) {
          if (event === 'token') {
            receivedTokens = true;
            setMessages((prev) => appendToken(prev, data));
          } else if (event === 'stage') {
            finalStage = data;
          } else if (event === 'error') {
            throw new Error(data?.detail || 'The tutor ran into a problem.');
          }
        }
        if (!finalStage) throw new Error('The connection to the tutor was interrupted.');

        // Fallback for responses that arrived without token streaming.
        if (!receivedTokens && finalStage.tutor_message && finalStage.interrupt?.int_type !== 'review') {
          setMessages((prev) => [...prev, { id: newId(), role: 'tutor', content: finalStage.tutor_message }]);
        }
        setStage(finalStage);
        setPhase(PHASE.READY);
      } catch (err) {
        setError(err.message);
        setPhase(PHASE.ERROR);
      } finally {
        setMessages(settle);
      }
    },
    [sessionId]
  );

  /** Loads the current stage, starting the tutor if it has not run yet. */
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/tutor/${sessionId}/stage`, { cache: 'no-store' });
      if (!response.ok) throw new Error(await readError(response));

      const { stage: current } = await response.json();
      if (!current) return runAction('start');

      setStage(current);
      if (current.tutor_message) {
        setMessages([{ id: 'latest', role: 'tutor', content: current.tutor_message }]);
      }
      setPhase(PHASE.READY);
    } catch (err) {
      setError(err.message);
      setPhase(PHASE.ERROR);
    }
  }, [sessionId, runAction]);

  const retry = useCallback(() => {
    setError(null);
    setPhase(PHASE.LOADING);
    load();
  }, [load]);

  useEffect(() => {
    // Guard against double-invocation (React Strict Mode) starting the tutor twice.
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    load();
  }, [load]);

  return {
    stage,
    messages,
    phase,
    error,
    isBusy: phase === PHASE.LOADING || phase === PHASE.STREAMING,
    interruptType: stage?.interrupt?.int_type ?? null,
    retry,
    submitResources: (selectedSources) => runAction('review', { selectedSources }),
    proceed: () => runAction('proceed'),
    advance: () => runAction('advance'),
    askFollowup: (followup) => runAction('followup', { followup }, followup),
  };
}
