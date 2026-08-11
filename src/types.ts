export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  purchasedCourseIds: string[];
}

export interface CourseLesson {
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

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  lessons: CourseLesson[];
}

export interface CourseFAQ {
  id: string;
  course_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface CourseResource {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  icon_name: string;
  download_url: string | null;
  file_size: string | null;
  sort_order: number;
}

export interface CourseCommunity {
  id: string;
  course_id: string;
  whatsapp: string | null;
  instagram: string | null;
  telegram: string | null;
  discord: string | null;
}

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
  status: 'live' | 'coming_soon';
  language: string;
  certificate_included: boolean;
  lifetime_access: boolean;
  lessons_count: number;
  total_duration_seconds: number;
  modules_count: number;
  popularity_score: number;
  published_date: string | null;
  preview_video_url: string | null;
  created_at: string;
  updated_at: string;

  // Related database data
  whatYoullLearn: string[];
  modules: CourseModule[];
  faqs: CourseFAQ[];
  resources: CourseResource[];
  community: CourseCommunity | null;

  // Frontend-only field
  purchased?: boolean;
}