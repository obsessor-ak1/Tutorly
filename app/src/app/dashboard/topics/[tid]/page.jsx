import React from "react";
import dbConnect from "@/lib/db";
import { Topic } from "@/models/Topic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

// Server Component
export default async function TopicDetailPage({ params }) {
  const resolvedParams = await params;
  const tid = resolvedParams.tid;

  const session = await auth();
  if (!session?.user) {
    redirect("/userauth/login");
  }

  await dbConnect();
  const topic = await Topic.findOne({ _id: tid, userId: session.user.id }).lean();

  if (!topic) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center w-full">
        <h1 className="text-2xl font-bold text-gray-900">Topic not found</h1>
        <p className="mt-2 text-gray-500">The topic you are looking for does not exist or you do not have permission to view it.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 w-full">
      {/* Topic Details Header */}
      <section 
        className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 mb-8"
        aria-labelledby="topic-title"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <h1 id="topic-title" className="text-3xl font-extrabold text-gray-900">
            {topic.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100" aria-label="Learning Style">
              Style: {topic.teachingStyle || "Standard"}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100" aria-label="Persona">
              Persona: {topic.persona || "Expert"}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 text-base leading-relaxed mb-6">
          {topic.description}
        </p>

        {topic.topicFamiliarityLevel && (
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Familiarity Level: </span>
            <span className="text-gray-600">{topic.topicFamiliarityLevel}</span>
          </div>
        )}
      </section>

      {/* Lessons List */}
      <section aria-labelledby="lessons-heading">
        <div className="flex items-center justify-between mb-6">
          <h2 id="lessons-heading" className="text-2xl font-bold text-gray-900">
            Curriculum Lessons
          </h2>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {topic.lessons?.length || 0} Lessons
          </span>
        </div>

        <div className="space-y-6 flex flex-col">
          {topic.lessons && topic.lessons.map((lesson, index) => (
            <LessonCardItem 
              key={lesson._id?.toString() || index} 
              lesson={lesson} 
              topicId={tid} 
              index={index} 
            />
          ))}
          {(!topic.lessons || topic.lessons.length === 0) && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500">No lessons available for this topic yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LessonCardItem({ lesson, topicId, index }) {
  const status = lesson.status || "not_started";
  const lessonIdStr = lesson._id?.toString() || `idx-${index}`;
  
  // Status UI mapping
  const statusConfig = {
    not_started: {
      label: "Not Started",
      badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
      buttonText: "Start Lesson",
      buttonClass: "bg-[#5438dc] hover:bg-[#4326cb] text-white shadow-md shadow-indigo-500/20"
    },
    in_progress: {
      label: "In Progress",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      buttonText: "Resume",
      buttonClass: "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
    },
    completed: {
      label: "Completed",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      buttonText: "View Details",
      buttonClass: "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
    }
  };

  const currentConfig = statusConfig[status] || statusConfig.not_started;
  
  return (
    <article 
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300 flex flex-col md:flex-row gap-6 items-start"
      aria-labelledby={`lesson-title-${index}`}
    >
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mb-2 gap-4">
          <h3 id={`lesson-title-${index}`} className="text-xl font-bold text-gray-900">
            {lesson.name}
          </h3>
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentConfig.badgeClass}`}
            aria-label={`Status: ${currentConfig.label}`}
          >
            {currentConfig.label}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-5 leading-relaxed">
          {lesson.description}
        </p>

        {lesson.modules && lesson.modules.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Modules in this lesson
            </h4>
            <ul className="space-y-2.5" role="list">
              {lesson.modules.map((mod, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start leading-snug">
                  <span className="text-indigo-400 mr-2.5 font-bold mt-0.5" aria-hidden="true">&bull;</span>
                  <span className="flex-1">{mod.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Button Section */}
      <div className="w-full md:w-auto md:min-w-35 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 flex flex-col justify-center shrink-0 self-stretch md:self-auto">
        <Link 
          href={`/dashboard/topics/${topicId}/lessons/${lessonIdStr}`}
          className={`w-full inline-flex items-center justify-center px-5 py-3 md:py-2.5 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${currentConfig.buttonClass}`}
          aria-label={`${currentConfig.buttonText} for ${lesson.name}`}
        >
          {currentConfig.buttonText}
        </Link>
      </div>
    </article>
  );
}

