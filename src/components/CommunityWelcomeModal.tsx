import React, { useEffect, useState } from 'react';
import { Course } from '../types';
import { Sparkles, MessageCircle, Instagram, Users, Trophy, Lightbulb, Bell } from 'lucide-react';

interface CommunityWelcomeModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityWelcomeModal({ course, isOpen, onClose }: CommunityWelcomeModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoinWhatsapp = () => {
    if (course.community?.whatsapp) {
      window.open(course.community.whatsapp, '_blank');
    }
    handleClose();
  };

  const handleJoinInstagram = () => {
    if (course.community?.instagram) {
      window.open(course.community.instagram, '_blank');
    }
    handleClose();
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem(`community_shown_${course.id}`, 'true');
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`relative w-full max-w-md bg-[#111111] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Removed the X close button here */}

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#D7FF2F]/10 blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8">
          <div className="w-14 h-14 rounded-2xl bg-[#D7FF2F]/10 border border-[#D7FF2F]/20 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-7 h-7 text-[#D7FF2F]" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Welcome to the Community 🎉
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              You're now enrolled in <strong className="text-zinc-200">{course.title}</strong>
            </p>
          </div>

          <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-xl p-4 mb-6">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
              Join your exclusive student community to:
            </p>
            <div className="space-y-2.5">
              {[
                { icon: MessageCircle, text: 'Ask questions & get help' },
                { icon: Users, text: 'Share your work & get feedback' },
                { icon: Bell, text: 'Get course updates & announcements' },
                { icon: Trophy, text: 'Participate in challenges & win prizes' },
                { icon: Lightbulb, text: 'Connect with fellow creators' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#D7FF2F]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#D7FF2F]" />
                  </div>
                  <span className="text-sm text-zinc-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <button
              onClick={handleJoinWhatsapp}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm transition-colors shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              Join WhatsApp Community
            </button>

            <button
              onClick={handleJoinInstagram}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90 text-white font-bold text-sm transition-opacity shadow-lg shadow-[#DD2A7B]/20"
            >
              <Instagram className="w-4.5 h-4.5" />
              Join Instagram Broadcast
            </button>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Maybe Later
          </button>

          <p className="text-center text-[10px] text-zinc-600 mt-3 leading-relaxed">
            These communities are exclusive to enrolled students.
          </p>
        </div>
      </div>
    </div>
  );
}