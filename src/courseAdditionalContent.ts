export interface CourseFAQ {
  question: string;
  answer: string;
}

export interface CourseAdditionalContent {
  about: string;
  faqs: CourseFAQ[];
}

export const courseAdditionalContent: Record<string, CourseAdditionalContent> = {
  "course-1": {
    about:
      "This course takes you from a complete beginner to a confident, professional editor in Adobe Premiere Pro. You'll start with the fundamentals — setting up projects, organizing files, and building clean sequences — before moving into the core editing tools and Effect Controls that power every professional edit. Along the way, you'll master the Graph Editor for smooth animations, craft polished text animations and transitions, and learn to work confidently with green screen footage. The course also covers sound design and audio mixing, creative speed and duration control, and a complete color grading workflow using Lumetri Color, Creative controls, Curves, Color Wheels, HSL Secondary, and vignettes. By the end, you'll be able to export platform-ready videos and follow a complete, professional editing workflow from start to finish.",

    faqs: [
      {
        question: "Do I need prior Premiere Pro experience?",
        answer:
          "No prior experience is required. The course begins with the fundamentals and progressively builds toward professional-level editing techniques."
      },
      {
        question: "What software do I need?",
        answer:
          "Adobe Premiere Pro installed on your computer is the only requirement."
      },
      {
        question: "Will I learn professional editing techniques?",
        answer:
          "Yes. You'll gain hands-on experience with editing, animation, transitions, green screen compositing, sound design, speed control, and export workflows."
      },
      {
        question: "Will I learn color grading?",
        answer:
          "Yes. The course covers a complete color grading workflow — Basic Correction, Creative controls, Curves, Color Wheels & Match, HSL Secondary, and Vignettes."
      },
      {
        question: "Do I get access to the lessons after purchasing?",
        answer:
          "Yes. You receive lifetime access to all course content."
      },
      {
        question: "Are the lessons video-based?",
        answer:
          "Yes. All lessons are delivered as streaming video through Bunny Stream."
      }
    ]
  },

  "course-2": {
    about:
      "This course introduces you to the rapidly evolving world of AI-powered video creation. You'll learn how to use AI tools to generate ideas faster, transform simple concepts into structured video plans, and write effective prompts that produce high-quality AI-generated visuals. The course walks you through building visual scenes from text-based instructions, experimenting with AI-driven storytelling, and creating short-form content suited for social media platforms. Rather than starting from scratch every time, you'll develop a repeatable, efficient AI-assisted workflow — giving you a practical foundation for producing content faster and smarter as a modern creator.",

    faqs: [
      {
        question: "Do I need prior AI experience?",
        answer:
          "No prior experience is needed. The course introduces the workflow step by step, starting from the basics."
      },
      {
        question: "Do I need video editing experience?",
        answer:
          "No. Basic familiarity with video content is helpful but not required."
      },
      {
        question: "What will I learn in this course?",
        answer:
          "You'll learn how to use AI tools and workflows to develop ideas, generate visuals, and create video content more efficiently."
      },
      {
        question: "Is this course useful for content creators?",
        answer:
          "Yes. It's built around practical, real-world AI-assisted video creation workflows."
      },
      {
        question: "Can I apply these skills to social media content?",
        answer:
          "Yes. The techniques you learn apply directly to short-form and social media content creation."
      },
      {
        question: "Will I get lifetime access?",
        answer:
          "Yes. You receive lifetime access to all current lessons, along with future course updates."
      }
    ]
  },

  "course-3": {
    about:
      "The Complete Creator Bundle takes you from technical skill-building to a fully monetizable creator career. You'll master professional video editing in Adobe Premiere Pro — from clean sequences and effects to a complete color grading workflow — then expand into AI-powered video generation, learning how to use AI tools to develop ideas, write prompts, and produce content faster than traditional workflows allow. Alongside these technical skills, you'll build the business foundation to freelance successfully: creating a portfolio, finding clients, writing proposals, pricing your services, and managing projects from start to finish. This bundle is the only place to access the Freelancing Mastery curriculum, making it the complete path from learning to earning.",

    faqs: [
      {
        question: "What's included in the Complete Creator Bundle?",
        answer:
          "The bundle includes three courses — Premiere Pro Complete Course, AI Video Generation Course, and Freelancing Mastery Course — covering editing, AI workflows, and the business skills to freelance professionally."
      },
      {
        question: "Can I buy the Freelancing Mastery course separately?",
        answer:
          "No. Freelancing Mastery is only available as part of the Complete Creator Bundle and is not sold as a standalone course."
      },
      {
        question: "Is the bundle cheaper than buying Premiere Pro and AI Video Generation separately?",
        answer:
          "Yes. The bundle is priced lower than buying the two standalone courses individually, and it also includes the Freelancing Mastery course at no extra cost."
      },
      {
        question: "Do I need to complete the courses in a specific order?",
        answer:
          "No. You get immediate access to all three courses and can go through them in any order that fits your goals."
      },
      {
        question: "Will I get lifetime access to all three courses?",
        answer:
          "Yes. The bundle includes lifetime access to all lessons and materials across all three courses."
      },
      {
        question: "Is this bundle suitable for complete beginners?",
        answer:
          "Yes. All three courses start from the basics, so no prior experience in editing, AI tools, or freelancing is required."
      },
      {
        question:
          "Can I upgrade from Premiere Pro or AI Video Generation to the full bundle later?",
        answer:
          "This depends on your platform's upgrade policy — check the course dashboard or contact support for upgrade pricing options."
      }
    ]
  }
};