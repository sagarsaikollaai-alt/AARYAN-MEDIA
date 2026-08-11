import React, { useEffect, useMemo, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { supabase } from "../lib/supabase";
import { useCourseData, Course as DbCourse, Module, Lesson } from "../hooks/useCourseData";
import { useLessonProgress } from "../hooks/useLessonProgress";
import { CommunityWelcomeModal } from "../components/CommunityWelcomeModal";
import {
  PlayCircle,
  Clock,
  BookOpen,
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Globe,
  Calendar,
  Award,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Users,
} from "lucide-react";

interface CourseDetailsPageProps {
  course: any;
  allCourses: any[];
  user: any;
  isPurchased?: boolean;
  onNavigateToCourse: (slug: string) => void;
  onBackToCourses: () => void;
  onBuyCourse: (course: any) => void;
  onContinueLearning: (course: any) => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({
  course: passedCourse,
  allCourses,
  user,
  isPurchased: isPurchasedProp,
  onNavigateToCourse,
  onBackToCourses,
  onBuyCourse,
}) => {
  /*
   * IMPORTANT:
   * Course data now comes from Supabase.
   *
   * We use the passed course only to find the correct
   * database course by ID or slug.
   */
  const courseKey = passedCourse?.id || passedCourse?.slug;

  const {
    course,
    modules,
    loading,
    error,
  } = useCourseData(courseKey);

  const [openModuleIds, setOpenModuleIds] = useState<string[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const [playbackData, setPlaybackData] = useState<{
    videoId: string;
    token: string;
    expires: number;
  } | null>(null);

  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [isFetchingVideo, setIsFetchingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  /*
   * Purchase status.
   *
   * If parent gives isPurchased, use it.
   * Otherwise check purchasedCourseIds if available.
   */
  const isPurchased =
    isPurchasedProp ??
    Boolean(user?.purchasedCourseIds?.includes(course?.id));

  const {
    saveProgress,
    saveProgressImmediate,
    getProgress,
    getLastWatchedLesson,
  } = useLessonProgress(user?.id, course?.id || "");

  /*
   * Open first module and select first lesson
   * after Supabase data loads.
   */
  useEffect(() => {
    if (!modules.length) return;

    setOpenModuleIds((previous) => {
      if (previous.length > 0) return previous;
      return [modules[0].id];
    });

    setActiveLessonId((previous) => {
      if (previous) return previous;
      return modules[0]?.lessons?.[0]?.id || null;
    });
  }, [modules]);

  /*
   * Restore the user's last watched lesson.
   */
  useEffect(() => {
    if (!course?.id || !user?.id || !isPurchased || !modules.length) {
      return;
    }

    let cancelled = false;

    const loadLastProgress = async () => {
      const last = await getLastWatchedLesson();

      if (cancelled || !last) return;

      const lesson = modules
        .flatMap((module) => module.lessons)
        .find((item) => item.id === last.lesson_id);

      if (!lesson) return;

      setActiveLessonId(lesson.id);
      setResumeSeconds(last.last_position_seconds || 0);

      const parentModule = modules.find((module) =>
        module.lessons.some((item) => item.id === lesson.id)
      );

      if (parentModule) {
        setOpenModuleIds((previous) =>
          previous.includes(parentModule.id)
            ? previous
            : [...previous, parentModule.id]
        );
      }
    };

    loadLastProgress();

    return () => {
      cancelled = true;
    };
  }, [
    course?.id,
    user?.id,
    isPurchased,
    modules,
    getLastWatchedLesson,
  ]);

  const allLessons = useMemo(
    () => modules.flatMap((module) => module.lessons),
    [modules]
  );

  const activeLesson = useMemo(
    () =>
      allLessons.find((lesson) => lesson.id === activeLessonId) || null,
    [allLessons, activeLessonId]
  );

  const activeModule = useMemo(
    () =>
      modules.find((module) =>
        module.lessons.some((lesson) => lesson.id === activeLessonId)
      ) || null,
    [modules, activeLessonId]
  );

  const toggleModule = (moduleId: string) => {
    setOpenModuleIds((previous) =>
      previous.includes(moduleId)
        ? previous.filter((id) => id !== moduleId)
        : [...previous, moduleId]
    );
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndices((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  };

  /*
   * Select lesson.
   */
  const handleSelectLesson = async (lessonId: string) => {
    const lesson = allLessons.find((item) => item.id === lessonId);

    if (!lesson) return;

    setActiveLessonId(lessonId);
    setPlaybackData(null);
    setVideoError(null);

    if (user?.id && course?.id) {
      const saved = await getProgress(lessonId);

      setResumeSeconds(
        saved?.last_position_seconds || 0
      );
    } else {
      setResumeSeconds(0);
    }

    const parentModule = modules.find((module) =>
      module.lessons.some((item) => item.id === lessonId)
    );

    if (parentModule && !openModuleIds.includes(parentModule.id)) {
      setOpenModuleIds((previous) => [
        ...previous,
        parentModule.id,
      ]);
    }
  };

  /*
   * Get secure Bunny playback token.
   */
  const handlePlayLesson = async () => {
    if (!activeLesson || !isPurchased) return;

    if (!activeLesson.video_id) {
      setVideoError("This lesson does not have a video yet.");
      return;
    }

    setIsFetchingVideo(true);
    setVideoError(null);

    try {
      const {
  data: { session },
  error: sessionError,
} = await supabase.auth.getSession();

if (sessionError) {
  throw new Error("Unable to get login session.");
}

if (!session?.access_token) {
  throw new Error("You are not logged in. Please login again.");
}

const headers = {
  Authorization: `Bearer ${session.access_token}`,
};

      const response = await fetch(
        `/api/lessons/${activeLesson.id}/playback-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            courseSlug: course?.slug,
          }),
        }
      );

      if (!response.ok) {
        let message = "Failed to fetch video token.";

        try {
          const data = await response.json();
          message = data?.error || message;
        } catch {
          message = `Server returned ${response.status}`;
        }

        throw new Error(message);
      }

      const data = await response.json();

      setPlaybackData({
        videoId: data.videoId,
        token: data.token,
        expires: data.expires,
      });
    } catch (err: any) {
      console.error("Playback error:", err);
      setVideoError(
        err?.message || "Unable to load this video."
      );
    } finally {
      setIsFetchingVideo(false);
    }
  };

  const playPreviousLesson = () => {
    if (!activeLessonId) return;

    const index = allLessons.findIndex(
      (lesson) => lesson.id === activeLessonId
    );

    if (index > 0) {
      handleSelectLesson(allLessons[index - 1].id);
    }
  };

  const playNextLesson = () => {
    if (!activeLessonId) return;

    const index = allLessons.findIndex(
      (lesson) => lesson.id === activeLessonId
    );

    if (index < allLessons.length - 1) {
      handleSelectLesson(allLessons[index + 1].id);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-[#D7FF2F]/30 border-t-[#D7FF2F] rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">
            Loading course...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error
   */
  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />

          <h2 className="text-xl font-bold mb-2">
            Course not found
          </h2>

          <p className="text-zinc-400 text-sm mb-6">
            {error || "Unable to load this course."}
          </p>

          <button
            onClick={onBackToCourses}
            className="bg-[#D7FF2F] text-black px-5 py-3 rounded-full font-bold text-sm"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const isComingSoon = course.status === "coming_soon";

  /*
   * Related courses can still come from the parent.
   */
  const relatedCourses = (allCourses || [])
    .filter((item) => item.id !== course.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 sm:pt-24 pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={onBackToCourses}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-[#18181B] border border-white/[0.12] text-[#D7FF2F] text-xs font-semibold px-3 py-1 rounded-full uppercase">
              {course.category}
            </span>

            <span className="text-zinc-400 text-xs flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {course.lessons_count} Lessons
            </span>

            <span className="text-zinc-600">•</span>

            <span className="text-zinc-400 text-xs">
              {course.modules_count} Modules
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            {course.title}
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg max-w-3xl">
            {course.description}
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">

            {/* VIDEO */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/[0.08]">

              {/* LOCKED */}
              {!isPurchased && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />

                  <div className="absolute inset-0 bg-black/60" />

                  <div className="relative z-10 text-center p-6">
                    <Lock className="w-10 h-10 mx-auto mb-4" />

                    <h3 className="text-xl font-bold mb-2">
                      Premium Content
                    </h3>

                    <p className="text-zinc-300 text-sm max-w-sm mb-5">
                      Purchase this course to access all lessons.
                    </p>

                    <button
                      onClick={() => onBuyCourse(course)}
                      className="bg-[#D7FF2F] text-black font-bold px-6 py-3 rounded-full"
                    >
                      Buy Now • ₹
                      {course.price.toLocaleString("en-IN")}
                    </button>
                  </div>
                </div>
              )}

              {/* COMING SOON */}
              {isPurchased && isComingSoon && (
                <div className="w-full h-full flex items-center justify-center text-center p-6">
                  <div>
                    <Sparkles className="w-10 h-10 text-[#D7FF2F] mx-auto mb-4" />

                    <h3 className="text-xl font-bold mb-2">
                      Coming Soon
                    </h3>

                    <p className="text-zinc-400 text-sm">
                      This course is being prepared.
                    </p>
                  </div>
                </div>
              )}

              {/* VIDEO POSTER */}
              {isPurchased &&
                !isComingSoon &&
                !playbackData &&
                !isFetchingVideo && (
                  <button
                    onClick={handlePlayLesson}
                    className="relative w-full h-full flex items-center justify-center group"
                  >
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />

                    <div className="absolute inset-0 bg-black/40" />

                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-full bg-[#D7FF2F]/20 border border-[#D7FF2F] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-8 h-8 text-[#D7FF2F]" />
                      </div>

                      <p className="mt-4 text-sm font-medium">
                        {resumeSeconds > 0
                          ? `Resume at ${formatDuration(resumeSeconds)}`
                          : "Click to Play"}
                      </p>
                    </div>
                  </button>
                )}

              {/* LOADING */}
              {isFetchingVideo && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#D7FF2F]/30 border-t-[#D7FF2F] rounded-full animate-spin mb-4" />

                  <p className="text-zinc-400 text-sm">
                    Loading secure video...
                  </p>
                </div>
              )}

              {/* ERROR */}
              {videoError && !isFetchingVideo && (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                  <AlertCircle className="w-10 h-10 text-red-500 mb-4" />

                  <h3 className="font-bold mb-2">
                    Playback Error
                  </h3>

                  <p className="text-zinc-400 text-sm mb-5">
                    {videoError}
                  </p>

                  <button
                    onClick={handlePlayLesson}
                    className="bg-[#1F1F1F] px-5 py-2 rounded-lg text-sm"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* VIDEO PLAYER */}
              {playbackData && (
                <VideoPlayer
                  key={playbackData.videoId}
                  videoId={playbackData.videoId}
                  token={playbackData.token}
                  expires={playbackData.expires}
                  resumeSeconds={resumeSeconds}
                  autoplay
                  onProgress={(seconds, duration) => {
                    if (activeLessonId) {
                      saveProgress(
                        activeLessonId,
                        seconds,
                        duration
                      );
                    }
                  }}
                  onLeave={(seconds, duration) => {
                    if (activeLessonId) {
                      saveProgressImmediate(
                        activeLessonId,
                        seconds,
                        duration
                      );
                    }
                  }}
                  onEnded={playNextLesson}
                />
              )}
            </div>

            {/* CURRENT LESSON */}
            {isPurchased && activeLesson && (
              <div className="flex items-center justify-between gap-4 bg-[#111111] border border-white/[0.08] rounded-xl p-4">
                <div>
                  <span className="text-[#D7FF2F] text-xs font-bold uppercase">
                    Currently Watching
                  </span>

                  <h3 className="text-sm font-semibold mt-1">
                    {activeLesson.title}
                  </h3>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={playPreviousLesson}
                    className="p-2 bg-[#1F1F1F] rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={playNextLesson}
                    className="p-2 bg-[#1F1F1F] rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* COMMUNITY */}
            {isPurchased && (
              <button
                onClick={() => setShowCommunityModal(true)}
                className="flex items-center gap-2 bg-[#111111] border border-white/[0.08] hover:border-[#D7FF2F] px-4 py-3 rounded-xl text-sm"
              >
                <Users className="w-4 h-4 text-[#D7FF2F]" />
                Join Community
              </button>
            )}

            {/* DESCRIPTION */}
            <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">
                About This Course
              </h2>

              <p className="text-zinc-300 text-sm leading-relaxed">
                {course.long_description}
              </p>
            </div>

            {/* COURSE SPECS */}
            <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-6">
                Course Specifications
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

                <div className="bg-black/40 p-4 rounded-xl">
                  <Globe className="w-4 h-4 text-zinc-400 mb-2" />
                  <p className="text-xs text-zinc-500">
                    Language
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {course.language}
                  </p>
                </div>

                <div className="bg-black/40 p-4 rounded-xl">
                  <Calendar className="w-4 h-4 text-zinc-400 mb-2" />
                  <p className="text-xs text-zinc-500">
                    Published
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {course.published_date
                      ? new Date(
                          course.published_date
                        ).toLocaleDateString("en-IN")
                      : "Not published"}
                  </p>
                </div>

                <div className="bg-black/40 p-4 rounded-xl">
                  <Award className="w-4 h-4 text-zinc-400 mb-2" />
                  <p className="text-xs text-zinc-500">
                    Certificate
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {course.certificate_included
                      ? "Included"
                      : "Not included"}
                  </p>
                </div>

                <div className="bg-black/40 p-4 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-zinc-400 mb-2" />
                  <p className="text-xs text-zinc-500">
                    Access
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {course.lifetime_access
                      ? "Lifetime"
                      : "Limited"}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* PURCHASE */}
              {!isPurchased && !isComingSoon && (
                <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 space-y-5">
                  <div>
                    <span className="text-xs text-zinc-500 uppercase">
                      Enrollment
                    </span>

                    <h3 className="text-2xl font-extrabold mt-1">
                      Enroll Today
                    </h3>
                  </div>

                  <div>
                    <span className="text-3xl font-extrabold">
                      ₹{course.price.toLocaleString("en-IN")}
                    </span>

                    {course.original_price && (
                      <span className="ml-2 text-zinc-500 line-through">
                        ₹
                        {course.original_price.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onBuyCourse(course)}
                    className="w-full bg-[#D7FF2F] text-black font-bold py-3.5 rounded-full"
                  >
                    Buy Now
                  </button>

                  <div className="border-t border-white/[0.08] pt-5 space-y-3 text-xs text-zinc-300">
                    {course.lifetime_access && (
                      <div className="flex gap-2">
                        <Check className="w-4 h-4 text-[#D7FF2F]" />
                        Lifetime Access
                      </div>
                    )}

                    {course.certificate_included && (
                      <div className="flex gap-2">
                        <Check className="w-4 h-4 text-[#D7FF2F]" />
                        Completion Certificate
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Check className="w-4 h-4 text-[#D7FF2F]" />
                      HD Video Streaming
                    </div>
                  </div>
                </div>
              )}

              {/* CURRICULUM */}
              <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6">
                  Course Curriculum
                </h2>

                <div className="space-y-3">
                  {modules.map((module: Module) => {
                    const isOpen = openModuleIds.includes(
                      module.id
                    );

                    return (
                      <div
                        key={module.id}
                        className="border border-white/[0.06] rounded-xl overflow-hidden bg-black/40"
                      >
                        <button
                          onClick={() =>
                            toggleModule(module.id)
                          }
                          className="w-full flex items-center justify-between p-4 text-left"
                        >
                          <div>
                            <p className="text-sm font-semibold">
                              {module.title}
                            </p>

                            <p className="text-xs text-zinc-500 mt-1">
                              {module.lessons.length} lessons
                            </p>
                          </div>

                          {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="border-t border-white/[0.06]">
                            {module.lessons.map(
                              (lesson: Lesson) => {
                                const isActive =
                                  lesson.id === activeLessonId;

                                const canPlay =
                                  isPurchased;

                                return (
                                  <button
                                    key={lesson.id}
                                    disabled={!canPlay}
                                    onClick={() =>
                                      handleSelectLesson(
                                        lesson.id
                                      )
                                    }
                                    className={`w-full flex items-center justify-between p-3 px-4 text-left border-b border-white/[0.04] ${
                                      isActive
                                        ? "bg-[#D7FF2F]/[0.06]"
                                        : "hover:bg-white/[0.02]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {canPlay ? (
                                        <PlayCircle className="w-4 h-4 text-[#D7FF2F] shrink-0" />
                                      ) : (
                                        <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                                      )}

                                      <span
                                        className={`text-sm truncate ${
                                          isActive
                                            ? "text-[#D7FF2F]"
                                            : canPlay
                                            ? "text-zinc-200"
                                            : "text-zinc-500"
                                        }`}
                                      >
                                        {lesson.title}
                                      </span>
                                    </div>

                                    <span className="text-xs text-zinc-500 font-mono ml-3 shrink-0">
                                      {lesson.duration ||
                                        formatDuration(
                                          lesson.duration_seconds
                                        )}
                                    </span>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INSTRUCTOR */}
              {isPurchased && (
                <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6">
                  <p className="text-xs text-zinc-500 uppercase mb-4">
                    Instructor
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#D7FF2F]/20 text-[#D7FF2F] border border-[#D7FF2F]/40 flex items-center justify-center font-bold text-lg">
                      {course.instructor?.[0] || "A"}
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {course.instructor}
                      </p>

                      <p className="text-xs text-zinc-400">
                        Aaryan Media
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RELATED COURSES */}
        {relatedCourses.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/[0.08]">
            <h2 className="text-2xl font-bold mb-6">
              Related Courses
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCourses.map((related) => (
                <button
                  key={related.id}
                  onClick={() =>
                    onNavigateToCourse(related.slug)
                  }
                  className="text-left bg-[#111111] border border-white/[0.08] hover:border-[#D7FF2F] p-4 rounded-xl"
                >
                  <div className="aspect-video rounded-lg overflow-hidden bg-zinc-900 mb-3">
                    <img
                      src={related.thumbnail}
                      alt={related.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <span className="text-[10px] font-semibold text-[#D7FF2F] uppercase">
                    {related.category}
                  </span>

                  <h3 className="text-sm font-bold mt-1">
                    {related.title}
                  </h3>

                  <div className="flex justify-between text-xs text-zinc-400 mt-3">
                    <span>
                      {related.lessons_count || 0} Lessons
                    </span>

                    <span className="font-bold text-white">
                      ₹
                      {Number(
                        related.price || 0
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* COMMUNITY MODAL */}
      {isPurchased && (
        <CommunityWelcomeModal
          course={passedCourse}
          isOpen={showCommunityModal}
          onClose={() =>
            setShowCommunityModal(false)
          }
        />
      )}
    </div>
  );
};

export default CourseDetailsPage;