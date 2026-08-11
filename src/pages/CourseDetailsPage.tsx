import VideoPlayer from "../components/VideoPlayer";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Course, UserProfile } from '../types';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { CommunityWelcomeModal } from "../components/CommunityWelcomeModal";
import {
  Play, Clock, BookOpen, Check, Lock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Download, Award, Globe, Calendar, ShieldCheck, Sparkles, ArrowLeft, FileCode, Sliders,
  Volume2, Type, Video, Music, Layers, FileText, Package, PlayCircle, MessageCircle,
  ExternalLink, Users, AlertCircle
} from 'lucide-react';

const IconMap: Record<string, any> = {
  FileCode, Sliders, Sparkles, Volume2, Type, Video, Layers, Music, FileText, Package
};

interface CourseDetailsPageProps {
  course: Course;
  allCourses: Course[];
  user: UserProfile | null;
  isPurchased?: boolean;
  onNavigateToCourse: (slug: string) => void;
  onBackToCourses: () => void;
  onBuyCourse: (course: Course) => void;
  onContinueLearning: (course: Course) => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({
  course, allCourses, user, isPurchased: isPurchasedProp, onNavigateToCourse, onBackToCourses, onBuyCourse, onContinueLearning,
}) => {
  const fallbackIsPurchased = !!user?.purchasedCourseIds.includes(course.id) || !!course.purchased;
  const isPurchased = isPurchasedProp === undefined ? fallbackIsPurchased : isPurchasedProp;

  const hasBunnyVideos = Boolean(course.bunnyStreamId);
  const initialModules = course.modules;

  const isCourseComingSoon = course.status === 'coming_soon';

  // Accordion state for modules — only ONE module can be open at a time
  const [openModuleId, setOpenModuleId] = useState<string | null>(initialModules[0]?.id ?? null);
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  const [playbackData, setPlaybackData] = useState<{ videoId: string, token: string, expires: number } | null>(null);
  const [isFetchingVideo, setIsFetchingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const { saveProgress, saveProgressImmediate, getProgress, getLastWatchedLesson } = useLessonProgress(user?.id, course.id);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialModules[0]?.lessons[0]?.id || null);
  const [resumeSeconds, setResumeSeconds] = useState<number>(0);
  const [progressLoaded, setProgressLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!isPurchased || !hasBunnyVideos || !user?.id) {
      setProgressLoaded(true);
      return;
    }
    (async () => {
      const last = await getLastWatchedLesson();
      if (last) {
        const lesson = initialModules.flatMap((m) => m.lessons).find((l) => l.id === last.lesson_id);
        if (lesson) {
          setActiveLessonId(lesson.id);
          setResumeSeconds(last.last_position_seconds || 0);
          const parentModule = initialModules.find((m) => m.lessons.some((l) => l.id === lesson.id));
          if (parentModule) {
            setOpenModuleId(parentModule.id);
          }
        }
      }
      setProgressLoaded(true);
    })();
  }, [isPurchased, hasBunnyVideos, user?.id]);

  useEffect(() => {
    if (isPurchased && course.community) {
      const seen = localStorage.getItem(`community_shown_${course.id}`);
      if (seen !== 'true') {
        const timer = setTimeout(() => setShowCommunityModal(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isPurchased, course.id, course.community]);

  const toggleModule = (id: string) => setOpenModuleId((currentId) => (currentId === id ? null : id));
  const toggleFaq = (index: number) => setOpenFaqIndices((prev) => prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]);

  const handleSelectLesson = async (lessonId: string) => {
    const selectedLesson = initialModules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
    if (!selectedLesson) return;

    setActiveLessonId(lessonId);
    setPlaybackData(null);
    setVideoError(null);

    if (user?.id) {
      const saved = await getProgress(lessonId);
      setResumeSeconds(saved?.last_position_seconds ?? 0);
    } else {
      setResumeSeconds(0);
    }
  };

  const handlePlayLesson = async () => {
    if (!activeLessonId) return;

    const selectedLesson = initialModules.flatMap((m) => m.lessons).find((l) => l.id === activeLessonId);
    if (!selectedLesson || selectedLesson.hasVideo === false) return;

    if (isPurchased && hasBunnyVideos) {
      setIsFetchingVideo(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session ? { Authorization: `Bearer ${session.access_token}` } : {};

        const res = await fetch(`/api/lessons/${activeLessonId}/playback-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ courseSlug: course.slug })
        });

        // SAFE JSON PARSING: Prevent UI crash if backend returns 404 HTML/Text
        if (!res.ok) {
          let errorMessage = 'Failed to fetch video token';
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Server returned ${res.status}: ${res.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        setPlaybackData(data);
      } catch (err: any) {
        console.error('Video token fetch failed:', err);
        setVideoError(err.message || 'Unable to authorize video.');
      } finally {
        setIsFetchingVideo(false);
      }
    }
  };

  const relatedCourses = allCourses.filter((c) => c.id !== course.id).slice(0, 3);
  const activeLesson = initialModules.flatMap(m => m.lessons).find(l => l.id === activeLessonId);
  const activeModule = initialModules.find(m => m.lessons.some(l => l.id === activeLessonId));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  let uiState = 'poster';
  if (!isPurchased) {
    if (isCourseComingSoon) {
      uiState = 'coming_soon_global';
    } else {
      uiState = 'locked';
    }
  } else if (activeLesson && activeLesson.hasVideo === false) {
    uiState = 'coming_soon';
  } else if (isFetchingVideo) {
    uiState = 'loading';
  } else if (videoError) {
    uiState = 'error';
  } else if (playbackData) {
    uiState = 'playing';
  }

  const groupedSections = initialModules.reduce((acc, mod) => {
    const section = mod.sectionTitle || 'MAIN';
    if (!acc[section]) acc[section] = [];
    acc[section].push(mod);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 sm:pt-24 pb-12 selection:bg-[#D7FF2F] selection:text-black">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <button onClick={onBackToCourses} className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Explore Courses</span>
          </button>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-[#18181B] border border-white/[0.12] text-[#D7FF2F] text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">{course.category}</span>
            <span className="text-zinc-400 text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-zinc-500" /> {course.duration}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 text-xs flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-zinc-500" /> {course.lessonsCount} Lessons</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">{course.title}</h1>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-3xl">{course.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start mb-12">

          {/* 1. Video - mobile order 1, desktop left column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/[0.08] shadow-2xl">

                {uiState === 'locked' && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-900 overflow-hidden">
                    <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none" />
                    <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
                      <Lock className="w-10 h-10 text-white mb-2" />
                      <p className="text-white font-bold text-xl">Premium Content</p>
                      <p className="text-zinc-200 text-sm max-w-xs">Purchase this course to unlock all lessons and start your learning journey.</p>
                      <button onClick={() => onBuyCourse(course)} className="mt-2 bg-[#D7FF2F] text-black font-bold px-6 py-3 rounded-full text-sm hover:bg-[#c5ee20] transition-colors inline-flex items-center gap-2">
                        <PlayCircle className="w-4 h-4" /> Buy Now • ₹{course.price.toLocaleString('en-IN')}
                      </button>
                    </div>
                  </div>
                )}

                {uiState === 'coming_soon_global' && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-900 overflow-hidden">
                    <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
                    <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
                      <Sparkles className="w-12 h-12 text-[#D7FF2F] mb-2" />
                      <h3 className="text-2xl font-bold text-white">Coming Soon</h3>
                      <p className="text-zinc-300 text-sm max-w-xs">This course is currently being prepared. Videos will be available soon.</p>
                      <button disabled className="mt-2 bg-zinc-700 text-zinc-400 font-bold px-6 py-3 rounded-full text-sm cursor-not-allowed inline-flex items-center gap-2">
                        <PlayCircle className="w-4 h-4" /> Coming Soon • ₹{course.price.toLocaleString('en-IN')}
                      </button>
                    </div>
                  </div>
                )}

                {uiState === 'coming_soon' && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-900 overflow-hidden">
                    <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
                    <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
                      <Lock className="w-12 h-12 text-[#D7FF2F] mb-2" />
                      <h3 className="text-2xl font-bold text-white">Locked / Coming Soon</h3>
                      {activeModule?.lockedMessage ? (
                        <p className="text-[#D7FF2F] text-sm font-medium max-w-xs">{activeModule.lockedMessage}</p>
                      ) : (
                        <p className="text-zinc-300 text-sm max-w-xs">This lesson is currently being prepared. Video will be available soon.</p>
                      )}
                    </div>
                  </div>
                )}

                {uiState === 'loading' && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#D7FF2F]/30 border-t-[#D7FF2F] rounded-full animate-spin"></div>
                    <p className="text-zinc-400 text-sm">Fetching secure playback token...</p>
                  </div>
                )}

                {uiState === 'error' && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 bg-zinc-900 overflow-hidden p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                    <p className="text-white font-bold text-lg">Playback Error</p>
                    <p className="text-zinc-400 text-sm max-w-xs">{videoError}</p>
                    <button onClick={() => handlePlayLesson()} className="mt-4 bg-[#1F1F1F] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#2a2a2a]">
                      Try Again
                    </button>
                  </div>
                )}

                {uiState === 'playing' && playbackData && (
                  <div className="relative w-full h-full">
                    <VideoPlayer
                      key={playbackData.videoId}
                      videoId={playbackData.videoId}
                      token={playbackData.token}
                      expires={playbackData.expires}
                      resumeSeconds={resumeSeconds}
                      autoplay={true}
                      onProgress={(seconds, duration) => activeLessonId && saveProgress(activeLessonId, seconds, duration)}
                      onLeave={(seconds, duration) => activeLessonId && saveProgressImmediate(activeLessonId, seconds, duration)}
                    />
                    {isPurchased && user && (
                      <div className="absolute bottom-4 right-4 z-50 text-white/50 font-bold text-sm pointer-events-none select-none">
                        Licensed to: {user.email}
                      </div>
                    )}
                  </div>
                )}

                {uiState === 'poster' && (
                  <button
                    onClick={() => handlePlayLesson()}
                    className="relative w-full h-full flex items-center justify-center group bg-zinc-900"
                  >
                    <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-80" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#D7FF2F]/20 border border-[#D7FF2F] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-8 h-8 text-[#D7FF2F] fill-[#D7FF2F]/20" />
                      </div>
                      {resumeSeconds > 0 ? (
                        <div className="mt-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
                          <span className="text-white text-sm font-medium">Resume at {formatTime(resumeSeconds)}</span>
                        </div>
                      ) : (
                        <p className="mt-2 text-white text-sm font-medium">Click to Play</p>
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* 2. Currently Selected Bar (Moved directly under video) */}
              {isPurchased && activeLesson && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111111] border border-white/[0.08] rounded-xl p-3 lg:col-span-2">
                  <div>
                    <span className="text-[#D7FF2F] text-xs font-bold uppercase tracking-wider">Currently Selected</span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">{activeLesson.title}</h3>
                  </div>
                  {isPurchased && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        const idx = initialModules.flatMap(m=>m.lessons).findIndex(l => l.id === activeLessonId);
                        if (idx > 0) handleSelectLesson(initialModules.flatMap(m=>m.lessons)[idx - 1].id);
                      }} className="p-2 bg-[#1F1F1F] hover:bg-[#2a2a2a] rounded-lg transition-colors">
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => {
                        const idx = initialModules.flatMap(m=>m.lessons).findIndex(l => l.id === activeLessonId);
                        const lessons = initialModules.flatMap(m=>m.lessons);
                        if (idx < lessons.length - 1) handleSelectLesson(lessons[idx + 1].id);
                      }} className="p-2 bg-[#1F1F1F] hover:bg-[#2a2a2a] rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Join Community Button - placed here in DOM for mobile ordering; moves to sidebar on lg */}
              {isPurchased && course.community && (
                <div className="lg:col-start-3 lg:col-span-1">
                  <button onClick={() => setShowCommunityModal(true)} className="flex items-center gap-2 w-full bg-[#111111] border border-white/[0.08] hover:border-[#D7FF2F] text-white hover:text-[#D7FF2F] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                    <Users className="w-4 h-4 text-[#D7FF2F]" /> Join Community
                  </button>
                </div>
              )}

              {isPurchased && (
                <div className="lg:col-start-3 lg:col-span-1">
                  <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Instructor</div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#D7FF2F]/20 text-[#D7FF2F] border border-[#D7FF2F]/40 flex items-center justify-center font-bold text-lg">
                        {course.instructor[0]}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">{course.instructor}</span>
                        <span className="text-xs text-zinc-400">Lead Creator at Aaryan Media</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 sm:p-8 lg:col-span-2">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#D7FF2F]" />What You'll Learn</h2>
              <div className="space-y-4">
                {course.whatYoullLearn.map((item, idx) => <p key={idx} className="text-sm text-zinc-300 leading-relaxed">{item}</p>)}
              </div>
            </div>

            {/* Downloadable Resources - DOM placement for mobile; moves to sidebar on lg */}
            {course.downloadableResources && course.downloadableResources.length > 0 && (
              <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 sm:p-8 lg:col-start-3 lg:col-span-1">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Download className="w-5 h-5 text-[#D7FF2F]" />Downloadable Resources</h2>
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                  {course.downloadableResources.map((res: any) => {
                    const Icon = IconMap[res.iconName] || Package;
                    return (
                      <div key={res.id} className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-white/[0.04] rounded-xl hover:border-[#D7FF2F]/30 transition-all group">
                        <Icon className="w-5 h-5 text-zinc-500 group-hover:text-[#D7FF2F] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-zinc-200 truncate pr-2">{res.title}</p>
                            <span className="text-[10px] text-zinc-500 font-mono bg-white/[0.04] px-2 py-0.5 rounded-full shrink-0">{res.size}</span>
                          </div>
                          <p className="text-xs text-zinc-500 mb-3">{res.description}</p>
                          <a
                            href={res.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#D7FF2F] font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 sm:p-8 lg:col-span-2">
              <h2 className="text-xl font-bold text-white mb-6">Course Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-black/40 border border-white/[0.06] p-4 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-zinc-400" /> Language</div>
                  <span className="text-sm font-semibold text-white">{course.specs?.language || 'Telugu'}</span>
                </div>
                <div className="bg-black/40 border border-white/[0.06] p-4 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-400" /> Last Updated</div>
                  <span className="text-sm font-semibold text-white">{course.specs?.lastUpdated || 'Recently'}</span>
                </div>
                <div className="bg-black/40 border border-white/[0.06] p-4 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-zinc-400" /> Certificate</div>
                  <span className="text-sm font-semibold text-white">Included</span>
                </div>
                <div className="bg-black/40 border border-white/[0.06] p-4 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> Access</div>
                  <span className="text-sm font-semibold text-white">{course.specs?.access || 'Lifetime'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 sm:p-8 lg:col-span-2">
              <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {course.faqs.map((faq, index) => {
                  const isOpen = openFaqIndices.includes(index);
                  return (
                    <div key={index} className="border border-white/[0.06] rounded-xl overflow-hidden bg-black/40">
                      <button onClick={() => toggleFaq(index)} className="w-full text-left p-4 flex items-center justify-between text-base font-semibold text-white hover:bg-white/[0.02] transition-colors">
                        <span>{faq.question}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />}
                      </button>
                      {isOpen && <div className="p-4 pt-0 text-sm text-zinc-300 border-t border-white/[0.04] leading-relaxed">{faq.answer}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          {/* Sidebar and action items - keep as individual blocks placed into the right column on lg */}

          {/* Enrollment / Buy box - place in sidebar on lg */}
          {!isPurchased && !isCourseComingSoon && (
            <div className="lg:col-start-3 lg:col-span-1">
              <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-2xl">
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Enrollment Status</span>
                  <h3 className="text-2xl font-extrabold text-white">Enroll Today</h3>
                </div>
                <button onClick={() => onBuyCourse(course)} className="w-full bg-[#D7FF2F] hover:bg-[#C7F51A] text-black font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-lg transition-all text-sm">
                  <span>Buy Now • ₹{course.price.toLocaleString('en-IN')}</span>
                </button>
                <div className="border-t border-white/[0.08] pt-5 space-y-3 text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-[#D7FF2F] shrink-0" /> Full Lifetime Access</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-[#D7FF2F] shrink-0" /> Verified Completion Certificate</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-[#D7FF2F] shrink-0" /> All Downloadable Resources & Assets</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-[#D7FF2F] shrink-0" /> HD Video Streaming on Mobile & Desktop</div>
                </div>
              </div>
            </div>
          )}

          {/* Course Curriculum / Modules - place into sidebar on lg, in DOM order for mobile */}
          <div className="lg:col-start-3 lg:col-span-1">
            <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Course Curriculum</h2>
              </div>
              <div className="space-y-6">
                {Object.entries(groupedSections).map(([sectionTitle, mods]) => (
                  <div key={sectionTitle}>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 px-1">{sectionTitle}</h3>
                    <div className="space-y-3">
                      {mods.map((mod) => {
                        const isOpen = openModuleId === mod.id;
                        return (
                          <div key={mod.id} className="border border-white/[0.06] rounded-xl overflow-hidden bg-black/40">
                            <button onClick={() => toggleModule(mod.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors">
                              <span className="text-sm font-semibold text-white">{mod.title}</span>
                              <div className="flex items-center gap-3 text-xs text-zinc-400">
                                <span>{mod.lessons.length} lessons</span>
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>
                            {isOpen && (
                              <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                                {mod.lessons.map((lesson: any) => {
                                  const canPlay = isPurchased;
                                  const isActive = lesson.id === activeLessonId;
                                  return (
                                    <div key={lesson.id} onClick={() => canPlay && handleSelectLesson(lesson.id)} className={`flex items-center justify-between p-3 px-4 text-sm transition-colors ${canPlay ? "cursor-pointer hover:bg-white/[0.02]" : "cursor-not-allowed"} ${isActive ? "bg-[#D7FF2F]/[0.06]" : ""}`}>
                                      <div className="flex items-center gap-3">
                                        {canPlay ? <PlayCircle className="w-4 h-4 text-[#D7FF2F] shrink-0" /> : <Lock className="w-4 h-4 text-zinc-500 shrink-0" />}
                                        <div>
                                          <p className={`font-medium ${canPlay ? "text-zinc-200" : "text-zinc-500"} ${isActive ? "text-[#D7FF2F]" : ""}`}>{lesson.title}</p>
                                        </div>
                                      </div>
                                      <span className="text-xs text-zinc-500 font-mono">{lesson.duration}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {relatedCourses.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/[0.08]">
            <h2 className="text-2xl font-bold text-white mb-6">Related Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCourses.map((rel) => (
                <div key={rel.id} onClick={() => onNavigateToCourse(rel.slug)} className="bg-[#111111] border border-white/[0.08] hover:border-[#D7FF2F] p-4 rounded-xl cursor-pointer transition-all hover:-translate-y-1 group">
                  <div className="aspect-[16/9] rounded-lg overflow-hidden bg-zinc-900 mb-3">
                    <img src={rel.thumbnail} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#D7FF2F] uppercase tracking-wider">{rel.category}</span>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#D7FF2F] transition-colors line-clamp-1 mt-1 mb-2">{rel.title}</h3>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mt-3 pt-2 border-t border-white/[0.06]">
                    <span>{rel.duration}</span>
                    <span className="font-bold text-white">₹{rel.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CommunityWelcomeModal course={course} isOpen={showCommunityModal} onClose={() => setShowCommunityModal(false)} />
    </div>
  );
};