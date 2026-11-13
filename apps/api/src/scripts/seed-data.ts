import type { WellnessActivityInput } from '@mindbridge/shared';

/** Public institution names for optional profile selection (no contact details). */
export const UNIVERSITIES = [
  { name: 'University of Ghana', shortName: 'UG', city: 'Accra' },
  { name: 'Kwame Nkrumah University of Science and Technology', shortName: 'KNUST', city: 'Kumasi' },
  { name: 'University of Cape Coast', shortName: 'UCC', city: 'Cape Coast' },
  { name: 'University of Education, Winneba', shortName: 'UEW', city: 'Winneba' },
  { name: 'University of Professional Studies, Accra', shortName: 'UPSA', city: 'Accra' },
  { name: 'Ghana Institute of Management and Public Administration', shortName: 'GIMPA', city: 'Accra' },
  { name: 'University for Development Studies', shortName: 'UDS', city: 'Tamale' },
  { name: 'University of Mines and Technology', shortName: 'UMaT', city: 'Tarkwa' },
  { name: 'University of Health and Allied Sciences', shortName: 'UHAS', city: 'Ho' },
  { name: 'Ashesi University', shortName: 'Ashesi', city: 'Berekuso' },
  { name: 'Accra Technical University', shortName: 'ATU', city: 'Accra' },
  { name: 'Kumasi Technical University', shortName: 'KsTU', city: 'Kumasi' },
];

/**
 * Starter wellness activities based on widely used, low-risk self-help
 * techniques. They are seeded as PENDING_PROFESSIONAL_REVIEW: a qualified
 * professional should review them before the status is changed in the admin dashboard.
 */
export const WELLNESS_ACTIVITIES: WellnessActivityInput[] = [
  {
    title: 'Slow breathing with a longer exhale',
    description: 'A short breathing exercise to help your body settle when you feel tense or rushed.',
    category: 'BREATHING',
    durationMinutes: 3,
    instructions: [
      'Sit comfortably and let your shoulders drop.',
      'Breathe in gently through your nose for a count of 4.',
      'Breathe out slowly through your mouth for a count of 6.',
      'Repeat for about 10 breaths. If you feel light-headed, return to normal breathing.',
      'Notice how your body feels now compared with when you started.',
    ],
    reviewStatus: 'PENDING_PROFESSIONAL_REVIEW',
    published: true,
  },
  {
    title: 'Box breathing',
    description: 'An even, four-part breathing pattern that many people use to steady themselves before exams or presentations.',
    category: 'BREATHING',
    durationMinutes: 4,
    instructions: [
      'Breathe in for a count of 4.',
      'Hold gently for a count of 4.',
      'Breathe out for a count of 4.',
      'Hold gently for a count of 4.',
      'Repeat four to six rounds at a pace that feels comfortable.',
    ],
    reviewStatus: 'PENDING_PROFESSIONAL_REVIEW',
    published: true,
  },
  {
    title: '5-4-3-2-1 grounding',
    description: 'Use your senses to bring your attention back to the present moment when your thoughts are racing.',
    category: 'GROUNDING',
    durationMinutes: 5,
    instructions: [
      'Name 5 things you can see around you.',
      'Name 4 things you can feel or touch.',
      'Name 3 things you can hear.',
      'Name 2 things you can smell.',
      'Name 1 thing you can taste.',
      'Take one slow breath and notice how you feel.',
    ],
    reviewStatus: 'PENDING_PROFESSIONAL_REVIEW',
    published: true,
  },
  {
    title: 'Two-minute body scan',
    description: 'A brief mindfulness practice to notice and release tension you may be carrying.',
    category: 'MINDFULNESS',
    durationMinutes: 2,
    instructions: [
      'Close your eyes or lower your gaze.',
      'Bring your attention to your forehead and jaw. Let them soften.',
      'Move your attention to your shoulders, then your hands. Let them loosen.',
      'Notice your back and stomach as you breathe.',
      'Finish by noticing your feet on the ground.',
    ],
    reviewStatus: 'PENDING_PROFESSIONAL_REVIEW',
    published: true,
  },
  {
    title: 'Focused study block (Pomodoro)',
    description: 'Break heavy study sessions into focused blocks with real breaks so your brain can recharge.',
    category: 'STUDY_BREAK',
    durationMinutes: 30,
    instructions: [
      'Choose one specific task, for example "summarise lecture 4".',
      'Put your phone out of reach and set a timer for 25 minutes.',
      'Work only on that task until the timer ends.',
      'Take a 5-minute break: stand, stretch, drink water, look away from screens.',
      'After four blocks, take a longer 15–30 minute break.',
    ],
    reviewStatus: 'PENDING_PROFESSIONAL_REVIEW',
    published: true,
  },
  {
    title: 'Brain dump and next step',
    description: 'Get everything out of your head onto paper, then choose just one small next step.',
    category: 'STRESS_MANAGEMENT',
    durationMinutes: 10,
    instructions: [
      'Write down everything that is on your mind — assignments, worries, errands. Do not organise yet.',
      'Circle anything with a deadline in the next 3 days.',
      'For one circled item, write the smallest possible next step (for example "open the assignment brief").',
      'Do that one step now or schedule it.',
      'Remind yourself that the rest of the list can wait its turn.',
    ],
    reviewStatus: 'PENDING_PROFESSIONAL_REVIEW',
    published: true,
  },
  {
    title: 'Wind-down routine for better sleep',
    description: 'Simple habits that help your body prepare for rest, especially during exam periods.',
    category: 'SLEEP_ROUTINE',
    durationMinutes: 20,
    instructions: [
      'Try to go to bed and wake up at roughly the same time each day.',
      'Stop studying 30 minutes before bed and dim the lights.',
      'Put your phone on silent and away from your bed if you can.',
      'Avoid caffeine in the late afternoon and evening.',
      'If you cannot sleep after about 20 minutes, get up, do something calm, and return when sleepy.',
    ],
    reviewStatus: 'PENDING_PROFESSIONAL_REVIEW',
    published: true,
  },
  {
    title: 'Three good things',
    description: 'A short reflection to notice what went well, however small.',
    category: 'POSITIVE_REFLECTION',
    durationMinutes: 5,
    instructions: [
      'Think back over your day.',
      'Write down three things that went well or that you appreciated.',
      'For each one, write a sentence about why it happened or what it meant to you.',
      'Small things count — a good meal, a kind message, finishing a task.',
    ],
    reviewStatus: 'PENDING_PROFESSIONAL_REVIEW',
    published: true,
  },
];
