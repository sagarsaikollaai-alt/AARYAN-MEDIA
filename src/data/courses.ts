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
  status: 'live' | 'coming_soon';
  whatYoullLearn: string[];
  longDescription: string;
  specs: { language: string; lastUpdated: string; certificate: string; access: string };
  modules: any[];
  faqs: any[];
  community?: { whatsapp: string; instagram: string };
  downloadableResources?: any[];
}

// ─────────────────────────────────────────────────────────────
// 1. PREMIERE PRO COMPLETE COURSE
// ─────────────────────────────────────────────────────────────
const premiereModules = [
  {
    id: "prem_m1",
    title: "MODULE 1 — Getting Started",
    sectionTitle: "SECTION 1: VIDEO EDITING",
    lessons: [
      { id: "prem_l1", title: "Course Introduction", duration: "03:17", hasVideo: true },
      { id: "prem_l2", title: "Installation", duration: "05:11", hasVideo: true }
    ]
  },
  {
    id: "prem_m2",
    title: "MODULE 2 — Project Setup",
    sectionTitle: "SECTION 1: VIDEO EDITING",
    lessons: [
      { id: "prem_l3", title: "Project File Creation", duration: "08:17", hasVideo: true },
      { id: "prem_l4", title: "Sequence Creation", duration: "07:01", hasVideo: true }
    ]
  },
  {
    id: "prem_m3",
    title: "MODULE 3 — Premiere Pro Fundamentals",
    sectionTitle: "SECTION 1: VIDEO EDITING",
    lessons: [
      { id: "prem_l5", title: "Tools Panel", duration: "33:31", hasVideo: true },
      { id: "prem_l6", title: "Effect Controls", duration: "10:13", hasVideo: true }
    ]
  },
  {
    id: "prem_m4",
    title: "MODULE 4 — Professional Editing",
    sectionTitle: "SECTION 1: VIDEO EDITING",
    lessons: [
      { id: "prem_l7", title: "Easy Ease Graph", duration: "10:58", hasVideo: true },
      { id: "prem_l8", title: "Fast Cuts Editing", duration: "06:02", hasVideo: true },
      { id: "prem_l9", title: "Text Animations", duration: "35:08", hasVideo: true },
      { id: "prem_l10", title: "Transitions", duration: "11:35", hasVideo: true },
      { id: "prem_l11", title: "Green Screen Editing", duration: "12:14", hasVideo: true },
      { id: "prem_l12", title: "Sound Design", duration: "39:40", hasVideo: true },
      { id: "prem_l13", title: "Speed & Duration", duration: "11:39", hasVideo: true }
    ]
  },
  {
    id: "prem_m5",
    title: "MODULE 5 — Professional Color Grading",
    sectionTitle: "SECTION 1: VIDEO EDITING",
    lessons: [
      { id: "prem_l14", title: "Basic Correction", duration: "10:28", hasVideo: true },
      { id: "prem_l15", title: "Creative", duration: "04:09", hasVideo: true },
      { id: "prem_l16", title: "Curves", duration: "06:31", hasVideo: true },
      { id: "prem_l17", title: "Color Wheels & Match", duration: "03:44", hasVideo: true },
      { id: "prem_l18", title: "HSL Secondary", duration: "03:52", hasVideo: true },
      { id: "prem_l19", title: "Vignette", duration: "01:44", hasVideo: true }
    ]
  },
  {
    id: "prem_m6",
    title: "MODULE 6 — Export & Completion",
    sectionTitle: "SECTION 1: VIDEO EDITING",
    lessons: [
      { id: "prem_l20", title: "Exporting", duration: "10:23", hasVideo: true },
      { id: "prem_l21", title: "Course Ending", duration: "00:56", hasVideo: true }
    ]
  }
];

// ─────────────────────────────────────────────────────────────
// 2. AI VIDEO GENERATION MASTERCLASS
// ─────────────────────────────────────────────────────────────
const aiModules = [
  {
    id: "ai_m1",
    title: "MODULE 1 — AI Foundations",
    sectionTitle: "SECTION 2: AI VIDEO GENERATION",
    lessons: [
      { id: "ai_l1", title: "ChatGPT", duration: "10:00", hasVideo: false },
      { id: "ai_l2", title: "Google Gemini", duration: "10:00", hasVideo: false },
      { id: "ai_l3", title: "Google Veo", duration: "10:00", hasVideo: false },
      { id: "ai_l4", title: "Google Omni", duration: "10:00", hasVideo: false }
    ]
  },
  {
    id: "ai_m2",
    title: "MODULE 2 — AI Content Creation",
    sectionTitle: "SECTION 2: AI VIDEO GENERATION",
    lessons: [
      { id: "ai_l5", title: "AI Image Generation", duration: "10:00", hasVideo: false },
      { id: "ai_l6", title: "AI Video Generation", duration: "10:00", hasVideo: false },
      { id: "ai_l7", title: "AI Avatar Creation", duration: "10:00", hasVideo: false },
      { id: "ai_l8", title: "AI Voice Generation", duration: "10:00", hasVideo: false }
    ]
  },
  {
    id: "ai_m3",
    title: "MODULE 3 — Prompt Engineering",
    sectionTitle: "SECTION 2: AI VIDEO GENERATION",
    lessons: [
      { id: "ai_l9", title: "Prompt Engineering", duration: "10:00", hasVideo: false },
      { id: "ai_l10", title: "Premium Prompt Library", duration: "10:00", hasVideo: false },
      { id: "ai_l11", title: "AI Workflow Templates", duration: "10:00", hasVideo: false }
    ]
  },
  {
    id: "ai_m4",
    title: "MODULE 4 — Viral Content Creation",
    sectionTitle: "SECTION 2: AI VIDEO GENERATION",
    lessons: [
      { id: "ai_l12", title: "AI Story Creation", duration: "10:00", hasVideo: false },
      { id: "ai_l13", title: "Human-like Story Creation", duration: "10:00", hasVideo: false },
      { id: "ai_l14", title: "Character Consistency", duration: "10:00", hasVideo: false },
      { id: "ai_l15", title: "Viral Content Creation", duration: "10:00", hasVideo: false },
      { id: "ai_l16", title: "AI Reels", duration: "10:00", hasVideo: false },
      { id: "ai_l17", title: "AI Shorts", duration: "10:00", hasVideo: false },
      { id: "ai_l18", title: "AI YouTube Videos", duration: "10:00", hasVideo: false }
    ]
  },
  {
    id: "ai_m5",
    title: "MODULE 5 — Commercial AI",
    sectionTitle: "SECTION 2: AI VIDEO GENERATION",
    lessons: [
      { id: "ai_l19", title: "Product Commercials", duration: "10:00", hasVideo: false },
      { id: "ai_l20", title: "AI Advertisements", duration: "10:00", hasVideo: false },
      { id: "ai_l21", title: "Cinematic AI Videos", duration: "10:00", hasVideo: false },
      { id: "ai_l22", title: "Talking AI Avatars", duration: "10:00", hasVideo: false },
      { id: "ai_l23", title: "AI Voiceovers", duration: "10:00", hasVideo: false },
      { id: "ai_l24", title: "Thumbnail Creation", duration: "10:00", hasVideo: false }
    ]
  },
  {
    id: "ai_m6",
    title: "MODULE 6 — Productivity",
    sectionTitle: "SECTION 2: AI VIDEO GENERATION",
    lessons: [
      { id: "ai_l25", title: "AI Research", duration: "10:00", hasVideo: false },
      { id: "ai_l26", title: "Business Automation", duration: "10:00", hasVideo: false },
      { id: "ai_l27", title: "Content Planning", duration: "10:00", hasVideo: false },
      { id: "ai_l28", title: "Resources", duration: "10:00", hasVideo: false },
      { id: "ai_l29", title: "Lifetime Updates", duration: "10:00", hasVideo: false },
      { id: "ai_l30", title: "Lifetime Access", duration: "10:00", hasVideo: false },
      { id: "ai_l31", title: "Certificate", duration: "10:00", hasVideo: false }
    ]
  }
];

// ─────────────────────────────────────────────────────────────
// 3. FREELANCING MASTERY (Exclusive to Bundle)
// ─────────────────────────────────────────────────────────────
const freelancingModules = [
  {
    id: "free_m1",
    title: "MODULE 1 — Freelancing Basics",
    sectionTitle: "SECTION 3: FREELANCING",
    lessons: [
      { id: "free_l1", title: "Understanding Freelancing", duration: "10:00", hasVideo: false },
      { id: "free_l2", title: "Choosing Your Service", duration: "10:00", hasVideo: false },
      { id: "free_l3", title: "Building Your Portfolio", duration: "10:00", hasVideo: false }
    ]
  },
  {
    id: "free_m2",
    title: "MODULE 2 — Finding Clients",
    sectionTitle: "SECTION 3: FREELANCING",
    lessons: [
      { id: "free_l4", title: "LinkedIn Outreach", duration: "10:00", hasVideo: false },
      { id: "free_l5", title: "Instagram Outreach", duration: "10:00", hasVideo: false },
      { id: "free_l6", title: "Email Outreach", duration: "10:00", hasVideo: false },
      { id: "free_l7", title: "Cold Outreach", duration: "10:00", hasVideo: false },
      { id: "free_l8", title: "Finding High-Paying Clients", duration: "10:00", hasVideo: false }
    ]
  },
  {
    id: "free_m3",
    title: "MODULE 3 — Client Communication",
    sectionTitle: "SECTION 3: FREELANCING",
    lessons: [
      { id: "free_l9", title: "Writing Client Messages", duration: "10:00", hasVideo: false },
      { id: "free_l10", title: "Replying Professionally", duration: "10:00", hasVideo: false },
      { id: "free_l11", title: "Discovery Calls", duration: "10:00", hasVideo: false },
      { id: "free_l12", title: "Building Trust", duration: "10:00", hasVideo: false },
      { id: "free_l13", title: "Following Up", duration: "10:00", hasVideo: false }
    ]
  },
  {
    id: "free_m4",
    title: "MODULE 4 — Closing Premium Clients",
    sectionTitle: "SECTION 3: FREELANCING",
    lessons: [
      { id: "free_l14", title: "Sales Psychology", duration: "10:00", hasVideo: false },
      { id: "free_l15", title: "Negotiation Techniques", duration: "10:00", hasVideo: false },
      { id: "free_l16", title: "Pricing Your Services", duration: "10:00", hasVideo: false },
      { id: "free_l17", title: "Handling Objections", duration: "10:00", hasVideo: false },
      { id: "free_l18", title: "Closing Premium Clients", duration: "10:00", hasVideo: false }
    ]
  },
  {
    id: "free_m5",
    title: "MODULE 5 — Scaling",
    sectionTitle: "SECTION 3: FREELANCING",
    lessons: [
      { id: "free_l19", title: "Client Management", duration: "10:00", hasVideo: false },
      { id: "free_l20", title: "Project Delivery", duration: "10:00", hasVideo: false },
      { id: "free_l21", title: "Getting Testimonials", duration: "10:00", hasVideo: false },
      { id: "free_l22", title: "Getting Repeat Clients", duration: "10:00", hasVideo: false },
      { id: "free_l23", title: "Building a Personal Brand", duration: "10:00", hasVideo: false },
      { id: "free_l24", title: "Scaling Your Freelancing Business", duration: "10:00", hasVideo: false }
    ]
  }
];

const bundleModules = [
  ...premiereModules,
  ...aiModules.map(m => ({ ...m, lockedMessage: "Complete all Premiere Pro tutorials to unlock this section." })),
  ...freelancingModules.map(m => ({ ...m, lockedMessage: "Complete AI Video Generation to unlock this section." }))
];

const googleDriveLink = "https://drive.google.com/drive/folders/1tcFPMUDGMP47cXseZsBqUuVnmaRhKmEn?usp=sharing";

// ─────────────────────────────────────────────────────────────
// COURSES ARRAY
// ─────────────────────────────────────────────────────────────
export const INITIAL_COURSES: Course[] = [
  {
    id: "1",
    slug: "premiere-pro-complete",
    title: "Premiere Pro Complete Course",
    description: "Master Adobe Premiere Pro from scratch and learn the complete editing workflow used by professional content creators.",
    thumbnail: "/premiere.png",
    price: 4999,
    original_price: 9999,
    category: "Video Editing",
    instructor: "Sagar Sai Kolla",
    lessonsCount: 21,
    duration: "4h 15m",
    bunnyStreamId: "active",
    status: "live",
    community: { whatsapp: "https://chat.whatsapp.com/EtUyGEBa8a9IZzLdTlSnvC", instagram: "https://www.instagram.com/channel/AbbqWBgmMdVSOi-g/" },
    longDescription: "This course is designed to help beginners become confident video editors by covering everything from project setup to exporting high-quality videos.",
    whatYoullLearn: [
      "This course is designed to help beginners become confident video editors by covering everything from project setup to exporting high-quality videos."
    ],
    specs: { language: "Telugu", lastUpdated: "Recently", certificate: "Yes", access: "Lifetime" },
    modules: premiereModules,
    downloadableResources: [
      { id: '1', title: 'Project Files', description: 'All project files used in the course', iconName: 'FileCode', size: '125 MB', downloadUrl: googleDriveLink }
    ],
    faqs: [
      { question: "Do I need any prior editing experience?", answer: "No. This course starts from the basics and gradually covers professional editing techniques." },
      { question: "Which software is used?", answer: "The entire course is taught using Adobe Premiere Pro." },
      { question: "What will I learn?", answer: "You'll learn project setup, editing workflow, transitions, text animations, green screen editing, sound design, color correction, exporting, and professional editing techniques." },
      { question: "Will I get project files?", answer: "Yes. Practice project files and downloadable resources are included wherever required." },
      { question: "Can I watch the course on mobile and desktop?", answer: "Yes. You can access the course from both desktop and mobile devices." },
      { question: "Will I get lifetime access?", answer: "Yes. Once enrolled, you'll have lifetime access along with future updates." }
    ]
  },
  {
    id: "2",
    slug: "ai-video-generation-masterclass",
    title: "AI Video Generation",
    description: "Learn how to leverage the latest AI tools to create professional-quality content faster than ever.",
    thumbnail: "/ai.png",
    price: 2999,
    original_price: 5999,
    category: "Artificial Intelligence",
    instructor: "Sagar Sai Kolla",
    lessonsCount: 31,
    duration: "5h 10m",
    bunnyStreamId: "active",
    status: "coming_soon",
    community: { whatsapp: "https://chat.whatsapp.com/EtUyGEBa8a9IZzLdTlSnvC", instagram: "https://www.instagram.com/channel/AbbqWBgmMdVSOi-g/" },
    longDescription: "This course covers the complete AI content creation workflow using industry-leading platforms like ChatGPT, Google Gemini, Google Veo, and Google Omni.",
    whatYoullLearn: [
      "This course covers the complete AI content creation workflow using industry-leading platforms like ChatGPT, Google Gemini, Google Veo, and Google Omni."
    ],
    specs: { language: "Telugu", lastUpdated: "Recently", certificate: "Yes", access: "Lifetime" },
    modules: aiModules,
    downloadableResources: [],
    faqs: [
      { question: "Is this course beginner friendly?", answer: "Yes. No AI experience is required. Everything is explained from the fundamentals." },
      { question: "Which AI tools are covered?", answer: "ChatGPT, Google Gemini, Google Veo, Google Omni, AI image generation, AI video generation, AI avatars, AI voice generation, prompt engineering, and more." },
      { question: "Will I learn how to create viral content?", answer: "Yes. The course covers AI reels, shorts, YouTube videos, advertisements, cinematic videos, and content creation workflows." },
      { question: "Will I get prompts and templates?", answer: "Yes. Premium prompts, workflow templates, and resources are included." },
      { question: "Are the AI tools free?", answer: "Some tools offer free plans, while others may require paid subscriptions for advanced features. The course explains suitable options." },
      { question: "Is lifetime access included?", answer: "Yes. You'll receive lifetime access along with future course updates." }
    ]
  },
  {
    id: "3",
    slug: "complete-creator-bundle",
    title: "Complete Creator Bundle",
    description: "Get Premiere Pro, AI Video Generation, and an exclusive Freelancing Mastery course to build a sustainable income.",
    thumbnail: "/bundle.png",
    price: 5999,
    original_price: 10998,
    category: "Bundle",
    instructor: "Sagar Sai Kolla",
    lessonsCount: 76,
    duration: "12h 40m",
    bunnyStreamId: "active",
    status: "live",
    community: { whatsapp: "https://chat.whatsapp.com/EtUyGEBa8a9IZzLdTlSnvC", instagram: "https://www.instagram.com/channel/AbbqWBgmMdVSOi-g/" },
    longDescription: "You'll learn proven strategies for finding high-quality clients, reaching out through different platforms, writing effective client messages, conducting professional conversations, negotiating confidently, and closing premium projects.",
    whatYoullLearn: [
      "You'll learn proven strategies for finding high-quality clients, reaching out through different platforms, writing effective client messages, conducting professional conversations, negotiating confidently, and closing premium projects."
    ],
    specs: { language: "Telugu", lastUpdated: "Recently", certificate: "Yes", access: "Lifetime" },
    modules: bundleModules,
    downloadableResources: [
      { id: '1', title: 'Project Files', description: 'All project files used in the bundle', iconName: 'FileCode', size: '125 MB', downloadUrl: googleDriveLink }
    ],
    faqs: [
      { question: "What is included in the bundle?", answer: "The bundle includes: Premiere Pro Complete Course, AI Content Creation Masterclass, and Freelancing Mastery." },
      { question: "Do I get access to every lesson?", answer: "Yes. Purchasing the bundle unlocks every module and lesson from all three courses." },
      { question: "How much do I save with the bundle?", answer: "Buying the courses separately costs significantly more than purchasing the Complete Creator Bundle, making it the best value option." },
      { question: "Is the bundle suitable for beginners?", answer: "Yes. Every course starts from the basics and progresses to advanced topics." },
      { question: "Can I learn at my own pace?", answer: "Yes. There are no deadlines. You can start, pause, and continue whenever you like." },
      { question: "Will I receive certificates?", answer: "Yes. Certificates are included for the eligible courses upon completion." }
    ]
  }
];
