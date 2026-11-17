"use client";

import React, { useState } from 'react';
import { ModuleChecklist } from '@/components/session/ModuleChecklist';
import { ResourceList } from '@/components/session/ResourceList';
import { ResourceSelectionDialog } from '@/components/session/ResourceSelectionDialog';
import { StageControls } from '@/components/session/StageControls';
import { Transcript } from '@/components/session/Transcript';
import { PHASE, useTutorSession } from '@/hooks/useTutorSession';
import { STATUS } from '@/lib/status';

const STATUS_TEXT = {
  [PHASE.LOADING]: 'Loading your session…',
  [PHASE.STREAMING]: 'Your tutor is working…',
  [PHASE.READY]: '',
  [PHASE.ERROR]: '',
};

function SidePanelSection({ id, title, children }) {
  return (
    <section
      aria-labelledby={id}
      className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-5"
    >
      <h2 id={id} className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function placeholderFor(phase, interruptType) {
  if (phase === PHASE.LOADING) return 'Loading your session…';
  if (phase === PHASE.STREAMING && !interruptType) {
    return 'Gathering learning resources for this lesson. This can take a minute…';
  }
  if (interruptType === 'review') return 'Select your learning resources to begin.';
  return null;
}

export function TutorSessionClient({ sessionId, lessonName, topicName, initialModules, initialResources }) {
  const session = useTutorSession(sessionId);
  const [resources, setResources] = useState(initialResources);
  const { stage, phase, interruptType, isBusy } = session;

  const modules = stage?.lesson?.modules ?? initialModules;
  const currentIndex = modules.findIndex((m) => m.status === STATUS.IN_PROGRESS);
  const isLastModule = currentIndex === modules.length - 1;

  const handleResourceSubmit = (selected) => {
    setResources(selected);
    session.submitResources(selected);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] items-start">
      <aside aria-label="Lesson outline" className="space-y-6 lg:sticky lg:top-0">
        <SidePanelSection id="modules-heading" title="Modules">
          <ModuleChecklist modules={modules} />
        </SidePanelSection>
        <SidePanelSection id="resources-heading" title="Selected resources">
          <ResourceList resources={resources} />
        </SidePanelSection>
      </aside>

      <section
        aria-labelledby="session-heading"
        className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col h-[calc(100vh-10rem)] min-h-120 overflow-hidden"
      >
        <header className="px-5 sm:px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400">{topicName}</p>
          <h1 id="session-heading" className="text-lg font-bold text-gray-900">
            {lessonName}
          </h1>
          <p role="status" className="text-xs text-indigo-600 font-medium min-h-4 mt-0.5">
            {STATUS_TEXT[phase]}
          </p>
        </header>

        <Transcript
          messages={session.messages}
          streaming={phase === PHASE.STREAMING}
          placeholder={placeholderFor(phase, interruptType)}
        />

        {session.error && (
          <div role="alert" className="mx-5 sm:mx-6 mb-4 flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-800">
            <span>{session.error}</span>
            <button
              type="button"
              onClick={session.retry}
              className="shrink-0 font-semibold text-red-700 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              Retry
            </button>
          </div>
        )}

        {phase !== PHASE.LOADING && (
          <StageControls
            interruptType={interruptType}
            // A run cut short (e.g. the page was closed mid-response) also has
            // no pending interrupt, so only trust a completed lesson status.
            finished={stage?.finished && stage?.lesson?.status === STATUS.COMPLETED}
            assignmentId={stage?.assignment?.assignment_id}
            busy={isBusy}
            isLastModule={isLastModule}
            onProceed={session.proceed}
            onAdvance={session.advance}
            onFollowup={session.askFollowup}
          />
        )}
      </section>

      {interruptType === 'review' && (
        <ResourceSelectionDialog
          open={!isBusy}
          resources={stage.resources}
          pending={isBusy}
          onSubmit={handleResourceSubmit}
        />
      )}
    </div>
  );
}
