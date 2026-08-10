// src/types.ts
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  purchasedCourseIds: string[];
}
export interface CourseResource {
  title: string;
  url: string;
  type?: string;
}

export interface CourseInstructor {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;

  price: number;
  original_price: number;

  category: string;
  instructor: string;

  lessonsCount: number;
  duration: string;

  bunnyStreamId?: string;

  status: 'published' | 'coming_soon';

  whatYoullLearn: string[];
  longDescription: string;

  specs: {
    language: string;
    lastUpdated: string;
    certificate: string;
    access: string;
  };

  modules: any[];
  faqs: any[];

  community?: {
    whatsapp?: string;
    instagram?: string;
  };

  instructorDetails?: CourseInstructor;

  resources?: CourseResource[];

  purchased?: boolean;
}