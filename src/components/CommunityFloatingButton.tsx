import React from 'react';
import { Course } from '../types';
import { MessageCircle, Instagram } from 'lucide-react';

interface CommunityFloatingButtonProps {
  course: Course;
}

export function CommunityFloatingButton({ course }: CommunityFloatingButtonProps) {
  if (!course.community) return null;

  return (
    <div className="flex items-center gap-3 bg-[#111111] border border-white/[0.08] rounded-xl p-3">
      <span className="text-xs text-zinc-400 font-medium hidden sm:block">Join the Community:</span>
      <div className="flex items-center gap-2 ml-auto">
        {course.community.whatsapp && (
          <a 
            href={course.community.whatsapp} 
            target="_blank" 
            rel="noreferrer"
            className="w-9 h-9 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 flex items-center justify-center transition-colors"
            title="Join WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        )}
        {course.community.instagram && (
          <a 
            href={course.community.instagram} 
            target="_blank" 
            rel="noreferrer"
            className="w-9 h-9 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 flex items-center justify-center transition-colors"
            title="Join Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}