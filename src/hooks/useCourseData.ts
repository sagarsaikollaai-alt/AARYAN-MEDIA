import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  long_description: string;
  thumbnail: string;
  category: string;
  instructor: string;
  price: number;
  original_price: number | null;
  currency: string;
  bunny_stream_id: string | null;
  status: string;
  language: string;
  certificate_included: boolean;
  lifetime_access: boolean;
  lessons_count: number;
  total_duration_seconds: number;
  modules_count: number;
  popularity_score: number;
  published_date: string | null;
  preview_video_url: string | null;
}

export interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  duration: string | null;
  duration_seconds: number;
  video_id: string | null;
  is_free_preview: boolean;
  sort_order: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
}

export function useCourseData(courseIdOrSlug: string | undefined) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseIdOrSlug) return;

    async function loadCourse() {
      setLoading(true);
      setError(null);

      try {
        // Get course using either ID or slug
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .or(`id.eq.${courseIdOrSlug},slug.eq.${courseIdOrSlug}`)
          .maybeSingle();

        if (courseError) {
          throw courseError;
        }

        if (!courseData) {
          throw new Error("Course not found");
        }

        setCourse(courseData);

        // Get modules
        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .select("*")
          .eq("course_id", courseData.id)
          .order("sort_order", { ascending: true });

        if (moduleError) {
          throw moduleError;
        }

        // Get lessons
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .select("*")
          .eq("course_id", courseData.id)
          .order("sort_order", { ascending: true });

        if (lessonError) {
          throw lessonError;
        }

        const formattedModules: Module[] = (moduleData || []).map((module) => ({
          ...module,
          lessons: (lessonData || [])
            .filter((lesson) => lesson.module_id === module.id)
            .sort((a, b) => a.sort_order - b.sort_order),
        }));

        setModules(formattedModules);
      } catch (err: any) {
        console.error("Course loading error:", err);
        setError(err.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [courseIdOrSlug]);

  return {
    course,
    modules,
    loading,
    error,
  };
}