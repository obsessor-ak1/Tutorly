import React from 'react';
import { DescriptiveQuestion } from '@/components/assessment/DescriptiveQuestion';
import { McqQuestion } from '@/components/assessment/McqQuestion';
import { QuestionSection } from '@/components/assessment/QuestionSection';
import { ScoreSummary } from '@/components/assessment/ScoreSummary';

/** Read-only view of a graded assignment. */
export function AssessmentResults({ mcqs, descriptives, result, justSubmitted = false }) {
  return (
    <div className="space-y-10">
      <ScoreSummary result={result} focusOnMount={justSubmitted} />

      {mcqs.length > 0 && (
        <QuestionSection id="mcq-heading" title="Multiple choice" description="Explanations for each question.">
          {mcqs.map((question, i) => (
            <McqQuestion key={i} id={`mcq-${i}`} number={i + 1} question={question} readOnly />
          ))}
        </QuestionSection>
      )}

      {descriptives.length > 0 && (
        <QuestionSection id="descriptive-heading" title="Written answers" description="Your score and feedback for each answer.">
          {descriptives.map((question, i) => (
            <DescriptiveQuestion
              key={i}
              id={`descriptive-${i}`}
              number={mcqs.length + i + 1}
              question={question}
              readOnly
            />
          ))}
        </QuestionSection>
      )}
    </div>
  );
}
