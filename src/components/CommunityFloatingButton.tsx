import React, { useState, useEffect, useRef } from 'react';
import { Course } from '../types';
import { MessageCircle, Instagram, X } from 'lucide-react';

interface CommunityFloatingButtonProps {
  course: Course;
}

export function CommunityFloatingButton({ course }: CommunityFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [isOpen]);

  if (!course.community?.whatsapp && !course.community?.instagram) return null;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          isOpen
            ? 'bg-[#D7FF2F] text-black'
            : 'bg-white/[0.06] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.1]'
        }`}
      >
        {isOpen ? (
          <>
            <X className="w-3.5 h-3.5" />
            Close
          </>
        ) : (
          <>
            <MessageCircle className="w-3.5 h-3.5" />
            Community
          </>
        )}
      </button>

      <div
        className={`absolute bottom-full left-0 mb-2 w-56 bg-[#111111] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-bottom-left z-50 ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="p-1.5">
          {course.community?.whatsapp && (
            <a
              href={course.community.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.06] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
              </div>
              <div>
                <p className="text-sm text-white font-medium group-hover:text-[#25D366] transition-colors">WhatsApp</p>
                <p className="text-[10px] text-zinc-500">Join the group chat</p>
              </div>
            </a>
          )}

          {course.community?.instagram && (
            <a
              href={course.community.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.06] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#DD2A7B]/15 flex items-center justify-center shrink-0">
                <Instagram className="w-4 h-4 text-[#DD2A7B]" />
              </div>
              <div>
                <p className="text-sm text-white font-medium group-hover:text-[#DD2A7B] transition-colors">Instagram</p>
                <p className="text-[10px] text-zinc-500">Follow the broadcast channel</p>
              </div>
            </a>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-3 py-2">
          <p className="text-[10px] text-zinc-600 text-center">Exclusive to enrolled students</p>
        </div>
      </div>
    </div>
  );
}