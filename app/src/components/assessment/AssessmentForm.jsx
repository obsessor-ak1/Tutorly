"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DescriptiveQuestion } from '@/components/assessment/DescriptiveQuestion';
import { McqQuestion } from '@/components/assessment/McqQuestion';
import { QuestionSection } from '@/components/assessment/QuestionSection';
import { clearAssessmentDraft, useAssessmentDraft } from '@/hooks/useAssessmentDraft';

const mcqId = (index) => `mcq-${index}`;
const descriptiveId = (index) => `descriptive-${index}`;

function findUnanswered(answers) {
  return {
    mcq: answers.mcq.flatMap((answer, i) => (answer ? [] : [i])),
    descriptive: answers.descriptive.flatMap((answer, i) => (answer.trim() ? [] : [i])),
  };
}

function focusQuestion(unanswered) {
  const target =
    unanswered.mcq.length > 0
      ? document.getElementById(mcqId(unanswered.mcq[0]))
      : document.getElementById(`${descriptiveId(unanswered.descriptive[0])}-input`);
  target?.focus();
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/** The answer sheet of an unattempted assignment. */
export function AssessmentForm({ assignmentId, mcqs, descriptives, fresh = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const { answers, setMcqAnswer, setDescriptiveAnswer } = useAssessmentDraft(
    assignmentId,
    mcqs.length,
    descriptives.length
  );
  const [showErrors, setShowErrors] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Restart: start from a blank answer sheet, then drop `?fresh=1`.
  useEffect(() => {
    if (!fresh) return;
    clearAssessmentDraft(assignmentId);
    router.replace(pathname);
  }, [fresh, assignmentId, pathname, router]);

  const unanswered = findUnanswered(answers);
  const unansweredCount = unanswered.mcq.length + unanswered.descriptive.length;
  const totalCount = mcqs.length + descriptives.length;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (unansweredCount > 0) {
      setShowErrors(true);
      setError(`Please answer all questions before submitting. ${unansweredCount} remaining.`);
      focusQuestion(unanswered);
      return;
    }
    setError(null);
    setIsConfirmOpen(true);
  };

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/assessments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mcqAnswers: answers.mcq,
          descriptiveAnswers: answers.descriptive,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit your answers. Please try again.');
      }
      clearAssessmentDraft(assignmentId);
      // Re-render the page in its graded, read-only state.
      router.replace(`${pathname}?submitted=1`);
    } catch (err) {
      setError(err.message);
      setIsConfirmOpen(false);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-describedby="assessment-progress" className="space-y-10">
      <fieldset disabled={isSubmitting} className="space-y-10 min-w-0">
        <legend className="sr-only">Assignment questions</legend>

        {mcqs.length > 0 && (
          <QuestionSection id="mcq-heading" title="Multiple choice" description="Choose one answer for each question.">
            {mcqs.map((question, i) => (
              <McqQuestion
                key={mcqId(i)}
                id={mcqId(i)}
                number={i + 1}
                question={question}
                value={answers.mcq[i]}
                onChange={(option) => setMcqAnswer(i, option)}
                invalid={showErrors && !answers.mcq[i]}
              />
            ))}
          </QuestionSection>
        )}

        {descriptives.length > 0 && (
          <QuestionSection id="descriptive-heading" title="Written answers" description="Answer in your own words.">
            {descriptives.map((question, i) => (
              <DescriptiveQuestion
                key={descriptiveId(i)}
                id={descriptiveId(i)}
                number={mcqs.length + i + 1}
                question={question}
                value={answers.descriptive[i]}
                onChange={(text) => setDescriptiveAnswer(i, text)}
                invalid={showErrors && !answers.descriptive[i].trim()}
              />
            ))}
          </QuestionSection>
        )}
      </fieldset>

      <div className="sticky bottom-0 -mx-4 sm:mx-0 border-t sm:border border-gray-200 bg-white/95 backdrop-blur sm:rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm">
          <p id="assessment-progress" className="font-medium text-gray-700">
            {totalCount - unansweredCount} of {totalCount} answered
          </p>
          <p role="status" className="text-indigo-600 font-medium">
            {isSubmitting ? 'Grading your answers… this may take a moment.' : ''}
          </p>
          {error && (
            <p role="alert" className="text-red-700 font-medium">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#5438dc] hover:bg-[#4326cb] shadow-md shadow-indigo-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-wait"
        >
          {isSubmitting ? 'Submitting…' : 'Submit assignment'}
        </button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Submit your answers?"
        description="Your answers will be graded and can't be changed afterwards."
        confirmLabel="Submit"
        pendingLabel="Grading…"
        tone="primary"
        pending={isSubmitting}
        onConfirm={submit}
        onClose={() => setIsConfirmOpen(false)}
      />
    </form>
  );
}
