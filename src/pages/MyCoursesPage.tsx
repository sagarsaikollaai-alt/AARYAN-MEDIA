import React from 'react';
import { Course, UserProfile } from '../types';
import { ArrowLeft, PlayCircle, BookOpen, Clock } from 'lucide-react';

interface MyCoursesPageProps {
  user: UserProfile | null;
  courses: Course[];
  onNavigateToCourse: (slug: string) => void;
  onBack: () => void;
  onExplore: () => void;
}

export function MyCoursesPage({ courses, onNavigateToCourse, onBack, onExplore }: MyCoursesPageProps) {
  const purchasedCourses = courses.filter(c => c.purchased);

  return (
    <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-5 sm:mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </button>

      <div className="flex items-end justify-between mb-5 sm:mb-8 pb-4 sm:pb-6 border-b border-white/[0.08] gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Enrolled Courses
          </h1>
          <p className="mt-1 text-zinc-400 text-xs sm:text-sm">
            {purchasedCourses.length > 0
              ? `${purchasedCourses.length} course${purchasedCourses.length > 1 ? 's' : ''} in your account`
              : 'Your learning journey starts here'}
          </p>
        </div>
        {purchasedCourses.length > 0 && (
          <span className="text-[10px] sm:text-xs font-mono text-[#D7FF2F] bg-[#D7FF2F]/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap shrink-0">
            {purchasedCourses.length} ACTIVE
          </span>
        )}
      </div>

      {purchasedCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {purchasedCourses.map(course => (
            <div
              key={course.id}
              className="bg-[#111111] border border-white/[0.08] hover:border-white/[0.15] rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200 group flex sm:block"
            >
              <div className="relative w-28 sm:w-full shrink-0 aspect-[4/3] sm:aspect-[21/9] overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-1.5 right-1.5 bg-[#D7FF2F] text-black text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  ENROLLED
                </div>
              </div>

              <div className="p-2 sm:p-3 flex-1 min-w-0">
                <h3 className="font-bold text-white text-xs mb-0.5 line-clamp-1">{course.title}</h3>
                <p className="text-zinc-500 text-[10px] mb-1">{course.instructor}</p>

                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-1.5">
                  <span className="flex items-center gap-0.5">
                    <BookOpen className="w-3 h-3 text-zinc-600" />
                    {course.lessonsCount} Lessons
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    {course.duration}
                  </span>
                </div>

                <button
                  onClick={() => onNavigateToCourse(course.slug)}
                  className="w-full py-1.5 rounded-lg bg-[#D7FF2F] hover:bg-[#c5ee20] text-black font-bold text-[11px] sm:text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3 h-3" />
                  Continue
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5 sm:mb-6">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No courses yet</h3>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md mb-6 sm:mb-8">
            You haven't enrolled in any courses yet. Explore our premium curriculum and start your learning journey.
          </p>
          <button
            onClick={onExplore}
            className="bg-[#D7FF2F] hover:bg-[#c5ee20] text-black font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm transition-colors"
          >
            Explore Courses
          </button>
        </div>
      )}
    </main>
  );
}