import React from 'react';
import { Course } from '../types';
import { Clock, PlayCircle, BookOpen, CheckCircle, Eye } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onCardClick: (course: Course) => void;
  onCtaClick: (e: React.MouseEvent, course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onCardClick,
  onCtaClick,
}) => {
  const isPurchased = course.purchased;
  const isComingSoon = course.status === 'coming_soon';

  return (
    <div
      onClick={() => onCardClick(course)}
      className="group bg-[#111111] border border-white/[0.08] hover:border-[#D7FF2F] rounded-xl p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none hover:shadow-lg hover:shadow-black/30"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-900 mb-3 border border-white/[0.05]">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-[#0A0A0A]/90 backdrop-blur-md text-zinc-300 border border-white/[0.12] text-[10px] font-medium px-2 py-1 rounded-full">
            {course.category}
          </span>
        </div>

        {/* Enrolled Badge */}
        {isPurchased && (
          <div className="absolute top-2 right-2 bg-[#D7FF2F] text-black text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            <CheckCircle className="w-3 h-3" />
            <span>Enrolled</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 px-1">
        <h3 className="text-sm font-semibold text-white group-hover:text-[#D7FF2F] transition-colors line-clamp-2 mb-1 min-h-[2.5rem]">
          {course.title}
        </h3>

        <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed mb-3 min-h-[2rem]">
          {course.description}
        </p>

        <div className="mt-auto">
          <p className="text-[11px] text-zinc-500 mb-2">
            By <span className="text-zinc-300 font-medium truncate">{course.instructor}</span>
          </p>

          {/* Stats Divider */}
          <div className="flex items-center gap-3 text-[11px] text-zinc-400 border-t border-white/[0.06] pt-2 mb-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              <span>{course.lessons_count || 0} Lessons</span>
            </div>
          </div>

          {/* Footer Section */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
            <div>
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider leading-none mb-0.5">
                {isPurchased ? 'Status' : 'Price'}
              </span>
              <span className="text-sm font-bold text-white tracking-tight">
                {isPurchased ? 'Enrolled' : `₹${course.price.toLocaleString('en-IN')}`}
              </span>
            </div>

            {/* Buy Now / Enrolled / Coming Soon Button */}
            <button
              onClick={(e) => onCtaClick(e, course)}
              disabled={isComingSoon && !isPurchased}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                isPurchased 
                  ? 'bg-[#D7FF2F] text-black hover:bg-[#C7F51A]' 
                  : isComingSoon 
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                    : 'bg-[#D7FF2F] text-black hover:bg-[#C7F51A]'
              }`}
            >
              {isPurchased ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Continue</span>
                </>
              ) : isComingSoon ? (
                <span>Coming Soon</span>
              ) : (
                <span>Buy Now</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};