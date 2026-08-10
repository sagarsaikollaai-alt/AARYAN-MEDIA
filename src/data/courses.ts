// src/data/courses.ts

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
  purchased?: boolean;
  whatYoullLearn: string[];
  longDescription: string;
  specs: { language: string; lastUpdated: string; certificate: string; access: string };
  modules: any[];
  faqs: any[];
  community?: { whatsapp: string; instagram: string };
  downloadableResources?: any[];
}

// All hardcoded course arrays (INITIAL_COURSES, premiereModules, etc.) 
// have been permanently removed. The app now fetches dynamically via /api/courses.