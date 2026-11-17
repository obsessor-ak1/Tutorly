"use client";

import React, { useEffect, useRef } from 'react';

function MessageBubble({ message }) {
  const isTutor = message.role === 'tutor';

  return (
    <article
      className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
        isTutor
          ? 'self-start bg-gray-50 border border-gray-100 text-gray-800'
          : 'self-end bg-[#5438dc] text-white'
      }`}
      aria-label={isTutor ? 'Tutor' : 'You'}
    >
      {message.content}
      {message.streaming && (
        <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-gray-400 align-text-bottom" aria-hidden="true" />
      )}
    </article>
  );
}

/**
 * The conversation with the tutor. Exposed as a log; `aria-busy` while
 * streaming makes screen readers wait for a complete response before
 * announcing it, instead of reading every token.
 */
export function Transcript({ messages, streaming, placeholder }) {
  const endRef = useRef(null);
  const lastContent = messages.at(-1)?.content;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, lastContent]);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-busy={streaming}
      aria-label="Conversation with your tutor"
      tabIndex={0}
      className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
    >
      {messages.length === 0 && placeholder && (
        <p className="m-auto text-sm text-gray-500 text-center">{placeholder}</p>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
