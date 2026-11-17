import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { TutorSessionClient } from '@/components/session/TutorSessionClient';
import { findOwnedLesson } from '@/lib/learningQueries';
import { startLessonAction } from '@/lib/lessonActions';

function BackLink() {
  return (
    <Link
      href="/dashboard/sessions"
      className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
    >
      <span aria-hidden="true" className="mr-1">&larr;</span>
      Back to sessions
    </Link>
  );
}

function Notice({ title, description, children }) {
  return (
    <div className="max-w-xl mx-auto py-12 text-center">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-500">{description}</p>
      <div className="mt-6 flex flex-col items-center gap-4">{children}</div>
    </div>
  );
}

export default async function SessionPage({ params }) {
  const { sid } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect('/userauth/login');
  }

  const owned = await findOwnedLesson(session.user.id, sid);
  if (!owned) {
    return (
      <Notice
        title="Session not found"
        description="The lesson you are looking for does not exist or you do not have permission to view it."
      >
        <BackLink />
      </Notice>
    );
  }

  const { topic, lesson } = owned;

  // Opened directly without starting: the lesson has no tutor thread yet.
  if (!lesson.thread_id) {
    return (
      <Notice title={lesson.name} description="This lesson hasn't been started yet.">
        <form action={startLessonAction.bind(null, sid)}>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#5438dc] hover:bg-[#4326cb] shadow-md shadow-indigo-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start lesson
          </button>
        </form>
        <BackLink />
      </Notice>
    );
  }

  return (
    <div className="w-full pb-6">
      <nav aria-label="Breadcrumb" className="mb-4">
        <BackLink />
      </nav>
      <TutorSessionClient
        // Remount on restart, which assigns a new thread.
        key={lesson.thread_id}
        sessionId={sid}
        lessonName={lesson.name}
        topicName={topic.name}
        initialModules={(lesson.modules ?? []).map(({ title, status }) => ({ title, status }))}
        initialResources={lesson.resources ?? []}
      />
    </div>
  );
}
