import React from 'react';
import { auth } from '@/auth';
import { CardList } from '@/components/CardList';
import { EmptyState } from '@/components/EmptyState';
import { LessonSessionCard } from '@/components/LessonSessionCard';
import { PageHeader } from '@/components/PageHeader';
import { getUserLessons } from '@/lib/learningQueries';
import { sortByStatus } from '@/lib/status';

export default async function SessionsPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const lessons = sortByStatus(await getUserLessons(session.user.id));

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      <PageHeader
        headingId="sessions-heading"
        title="My Sessions"
        description="Start a new lesson, or pick up where you left off."
      />

      <section aria-labelledby="sessions-heading">
        {lessons.length > 0 ? (
          <CardList
            items={lessons}
            label="Lessons"
            renderItem={(lesson) => <LessonSessionCard lesson={lesson} />}
          />
        ) : (
          <EmptyState
            title="No lessons yet"
            description="Lessons appear here once you create a topic curriculum."
            actionHref="/dashboard/topics/new"
            actionLabel="+ Create your first topic"
          />
        )}
      </section>
    </div>
  );
}
