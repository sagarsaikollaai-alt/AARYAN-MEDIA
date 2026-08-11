export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoId: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export const premiereModules: Module[] = [
  {
    id: "1",
    title: "Module 1 • Getting Started",
    lessons: [
      {
        id: "1",
        title: "Course Introduction",
        duration: "03:17",
        videoId: "b6bc8d63-93f8-4769-89d6-b41a51228f8e",
      },
      {
        id: "2",
        title: "Installation",
        duration: "05:11",
        videoId: "acd87bb8-0421-41e1-9809-9267a3efb984",
      },
      {
        id: "3",
        title: "Project File Creation",
        duration: "08:17",
        videoId: "662a8197-ac8a-40dc-a94d-353db5d064fc",
      },
      {
        id: "4",
        title: "Sequence Creation",
        duration: "07:01",
        videoId: "15e92f3a-8545-4437-8d4d-4c8bc70a102d",
      },
    ],
  },

  {
    id: "2",
    title: "Module 2 • Premiere Pro Fundamentals",
    lessons: [
      {
        id: "5",
        title: "Tools Panel",
        duration: "33:31",
        videoId: "6c8dbfe6-6be8-4c53-8114-f1543fa3a628",
      },
      {
        id: "6",
        title: "Effect Controls",
        duration: "10:13",
        videoId: "54452797-0421-4096-9098-bb60d1ddb689",
      },
    ],
  },

  {
    id: "3",
    title: "Module 3 • Editing Workflow",
    lessons: [
      {
        id: "7",
        title: "Easy Ease Graph Editor",
        duration: "10:58",
        videoId: "19b68091-50a4-4d4f-8773-6d6137f2344a",
      },
      {
        id: "8",
        title: "Fast Cuts Editing",
        duration: "06:02",
        videoId: "85746f4d-089b-4052-9372-440fd260e6d6",
      },
      {
        id: "9",
        title: "Text Animations",
        duration: "35:08",
        videoId: "eb1e2229-ca0d-48a0-93e9-3a0593a68ac4",
      },
      {
        id: "10",
        title: "Transitions",
        duration: "11:35",
        videoId: "be314408-a239-4c62-8592-36ff363013e1",
      },
    ],
  },

  {
    id: "4",
    title: "Module 4 • Professional Editing",
    lessons: [
      {
        id: "11",
        title: "Green Screen",
        duration: "12:14",
        videoId: "0bc22d94-b8fa-4a51-aeac-b6d11fc12a11",
      },
      {
        id: "12",
        title: "Sound Design",
        duration: "39:40",
        videoId: "8acaf271-f5b4-4ff4-93a4-fcb209f261f0",
      },
      {
        id: "13",
        title: "Speed & Duration",
        duration: "11:39",
        videoId: "a9c5a3ec-7687-485d-a426-186dd7805c4a",
      },
    ],
  },

  {
    id: "5",
    title: "Module 5 • Color Grading Masterclass",
    lessons: [
      {
        id: "14",
        title: "Basic Correction",
        duration: "10:28",
        videoId: "f74847d1-4e52-401b-ace2-934998c6445a",
      },
      {
        id: "15",
        title: "Creative",
        duration: "04:09",
        videoId: "8e0072ea-8c65-479f-9fdf-189214441a65",
      },
      {
        id: "16",
        title: "Curves",
        duration: "06:31",
        videoId: "ef3dd769-6086-431c-9c7b-311e2b065962",
      },
      {
        id: "17",
        title: "Color Wheels & Match",
        duration: "03:44",
        videoId: "a0857145-e8e5-406d-8b86-9952064b9c2e",
      },
      {
        id: "18",
        title: "HSL Secondary",
        duration: "03:52",
        videoId: "4f1964aa-e47f-49ac-82d4-55194b1fb0b6",
      },
      {
        id: "19",
        title: "Vignette",
        duration: "01:44",
        videoId: "d6534861-5f52-4ed0-ab5f-2ea43d3d86af",
      },
    ],
  },

  {
    id: "6",
    title: "Module 6 • Export & Completion",
    lessons: [
      {
        id: "20",
        title: "Exporting",
        duration: "10:23",
        videoId: "afabdd2c-58a3-44a7-9e1e-1ea6a9c1c27d",
      },
      {
        id: "21",
        title: "Course Conclusion",
        duration: "00:56",
        videoId: "9b969ec6-fb9f-4434-a90f-59fe1097aac2",
      },
    ],
  },
];