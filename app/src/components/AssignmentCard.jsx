import React from 'react';
import { ItemActions } from '@/components/ItemActions';
import { StatusBadge } from '@/components/StatusBadge';
import { restartAssignmentAction, startAssignmentAction } from '@/lib/assignmentActions';
import { STATUS } from '@/lib/status';

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AssignmentCard({ assignment }) {
  const titleId = `assignment-title-${assignment.id}`;
  const showScore = assignment.status === STATUS.COMPLETED && assignment.score !== null;

  return (
    <article
      className="bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 p-5 sm:p-6 flex flex-col md:flex-row gap-6 transition-shadow hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]"
      aria-labelledby={titleId}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-1.5">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            {assignment.title}
          </h2>
          <StatusBadge status={assignment.status} />
        </div>

        {assignment.lessonName && (
          <p className="text-xs font-medium text-gray-400 mb-3">
            <span className="sr-only">Lesson: </span>
            {assignment.topicName ? `${assignment.topicName} · ` : ''}
            {assignment.lessonName}
          </p>
        )}

        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{assignment.description}</p>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-gray-500">
          <div className="flex gap-1">
            <dt>Questions:</dt>
            <dd className="text-gray-700">{assignment.questionCount}</dd>
          </div>
          {showScore && (
            <div className="flex gap-1">
              <dt>Score:</dt>
              <dd className="text-emerald-700 font-semibold">
                {assignment.score} / {assignment.maxScore}
              </dd>
            </div>
          )}
          {assignment.createdAt && (
            <div className="flex gap-1">
              <dt>Assigned:</dt>
              <dd>
                <time dateTime={assignment.createdAt}>{formatDate(assignment.createdAt)}</time>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="w-full md:w-40 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 flex flex-col justify-center">
        <ItemActions
          itemName={assignment.title}
          itemType="assignment"
          status={assignment.status}
          href={`/dashboard/assessments/${assignment.id}`}
          startAction={startAssignmentAction.bind(null, assignment.id)}
          restartAction={restartAssignmentAction.bind(null, assignment.id)}
          viewLabel="View Results"
          restartDescription="Your unsubmitted draft answers for this assignment will be cleared and you will start again from a blank answer sheet."
        />
      </div>
    </article>
  );
}
