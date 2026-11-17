import React from 'react';
import Link from 'next/link';
import { ItemActions } from '@/components/ItemActions';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { restartLessonAction, startLessonAction } from '@/lib/lessonActions';

export function LessonSessionCard({ lesson }) {
  const titleId = `lesson-title-${lesson.id}`;

  return (
    <article
      className="bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 p-5 sm:p-6 flex flex-col md:flex-row gap-6 transition-shadow hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]"
      aria-labelledby={titleId}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-1.5">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            {lesson.name}
          </h2>
          <StatusBadge status={lesson.status} />
        </div>

        <p className="text-xs font-medium text-gray-400 mb-3">
          <span className="sr-only">Topic: </span>
          <Link
            href={`/dashboard/topics/${lesson.topicId}`}
            className="hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            {lesson.topicName}
          </Link>
        </p>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{lesson.description}</p>

        {lesson.modulesTotal > 0 && (
          <ProgressBar
            value={lesson.modulesCompleted}
            max={lesson.modulesTotal}
            label={`Modules completed in ${lesson.name}`}
          />
        )}
      </div>

      <div className="w-full md:w-40 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 flex flex-col justify-center">
        <ItemActions
          itemName={lesson.name}
          itemType="lesson"
          status={lesson.status}
          href={`/dashboard/sessions/${lesson.id}`}
          startAction={startLessonAction.bind(null, lesson.id)}
          restartAction={restartLessonAction.bind(null, lesson.id)}
          viewLabel="Review"
          restartDescription="Your progress and conversation with the tutor for this lesson will be discarded, and the lesson will begin again from the first module."
        />
      </div>
    </article>
  );
}
