import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AssessmentForm } from '@/components/assessment/AssessmentForm';
import { AssessmentResults } from '@/components/assessment/AssessmentResults';
import { StatusBadge } from '@/components/StatusBadge';
import { getAssessmentView } from '@/lib/assessmentQueries';
import { STATUS } from '@/lib/status';

function BackLink() {
  return (
    <Link
      href="/dashboard/assessments"
      className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
    >
      <span aria-hidden="true" className="mr-1">&larr;</span>
      Back to assignments
    </Link>
  );
}

export default async function AssessmentPage({ params, searchParams }) {
  const [{ asid }, query] = await Promise.all([params, searchParams]);

  const session = await auth();
  if (!session?.user) {
    redirect('/userauth/login');
  }

  const assessment = await getAssessmentView(session.user.id, asid);
  if (!assessment) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Assignment not found</h1>
        <p className="mt-2 text-gray-500">
          The assignment you are looking for does not exist or you do not have permission to view it.
        </p>
        <div className="mt-6">
          <BackLink />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      <nav aria-label="Breadcrumb" className="mb-4">
        <BackLink />
      </nav>

      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
          <StatusBadge status={assessment.attempted ? STATUS.COMPLETED : STATUS.IN_PROGRESS} />
        </div>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">{assessment.description}</p>
      </header>

      {assessment.attempted ? (
        <AssessmentResults
          mcqs={assessment.mcqs}
          descriptives={assessment.descriptives}
          result={assessment.result}
          justSubmitted={query?.submitted === '1'}
        />
      ) : (
        <AssessmentForm
          assignmentId={assessment.id}
          mcqs={assessment.mcqs}
          descriptives={assessment.descriptives}
          fresh={query?.fresh === '1'}
        />
      )}
    </div>
  );
}
