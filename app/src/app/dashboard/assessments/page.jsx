import React from 'react';
import { auth } from '@/auth';
import { AssignmentCard } from '@/components/AssignmentCard';
import { CardList } from '@/components/CardList';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { getUserAssignments } from '@/lib/learningQueries';
import { sortByStatus } from '@/lib/status';

export default async function AssessmentsPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const assignments = sortByStatus(await getUserAssignments(session.user.id));

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      <PageHeader
        headingId="assignments-heading"
        title="My Assignments"
        description="Test your understanding of the lessons you have completed."
      />

      <section aria-labelledby="assignments-heading">
        {assignments.length > 0 ? (
          <CardList
            items={assignments}
            label="Assignments"
            renderItem={(assignment) => <AssignmentCard assignment={assignment} />}
          />
        ) : (
          <EmptyState
            title="No assignments yet"
            description="An assignment is created for you at the end of every lesson."
            actionHref="/dashboard/sessions"
            actionLabel="Go to your sessions"
          />
        )}
      </section>
    </div>
  );
}
