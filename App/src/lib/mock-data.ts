/**
 * ProjectDNA Mock Data
 *
 * Temporary placeholder data for frontend development.
 * All data here is DEMONSTRATION ONLY and will be replaced by
 * real Supabase queries and backend API responses.
 */

export type MockProject = {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  github_url: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
  ai_score: number | null;
};

export type MockSkill = {
  id: string;
  name: string;
  category: 'language' | 'framework' | 'tool' | 'concept';
  proficiency: number; // 0-100
  project_count: number;
  color: string;
};

export type MockReview = {
  id: string;
  project_id: string;
  overall_score: number; // 0-100
  code_quality: number;
  documentation: number;
  architecture: number;
  innovation: number;
  strengths: string[];
  suggestions: string[];
  generated_at: string;
};

export type MockActivity = {
  id: string;
  type: 'project_added' | 'review_completed' | 'skill_updated' | 'profile_updated';
  message: string;
  timestamp: string;
};

// ─── Projects ───────────────────────────────────────────────

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'proj-1',
    title: 'E-Commerce Platform',
    description:
      'A full-stack e-commerce application with cart management, payment integration, and order tracking. Built with React and Node.js.',
    tech_stack: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Docker'],
    github_url: 'https://github.com/user/ecommerce-app',
    status: 'completed',
    created_at: '2026-08-15T10:30:00Z',
    updated_at: '2026-09-01T14:20:00Z',
    thumbnail_url: null,
    ai_score: 82,
  },
  {
    id: 'proj-2',
    title: 'Task Management API',
    description:
      'RESTful API for managing tasks and projects with team collaboration features, role-based access, and real-time notifications.',
    tech_stack: ['Python', 'FastAPI', 'Redis', 'WebSocket'],
    github_url: 'https://github.com/user/task-api',
    status: 'active',
    created_at: '2026-09-02T09:00:00Z',
    updated_at: '2026-09-10T16:45:00Z',
    thumbnail_url: null,
    ai_score: null,
  },
  {
    id: 'proj-3',
    title: 'Weather Dashboard',
    description:
      'Interactive weather dashboard with forecast visualization, location search, and historical data comparison using OpenWeather API.',
    tech_stack: ['TypeScript', 'React Native', 'Expo', 'Chart.js'],
    github_url: 'https://github.com/user/weather-dash',
    status: 'completed',
    created_at: '2026-07-20T11:15:00Z',
    updated_at: '2026-08-05T13:30:00Z',
    thumbnail_url: null,
    ai_score: 74,
  },
  {
    id: 'proj-4',
    title: 'Chat Application',
    description:
      'Real-time chat application with group messaging, file sharing, read receipts, and end-to-end encryption.',
    tech_stack: ['React', 'Socket.io', 'MongoDB', 'AWS S3'],
    github_url: 'https://github.com/user/chat-app',
    status: 'archived',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-07-15T10:00:00Z',
    thumbnail_url: null,
    ai_score: 68,
  },
];

// ─── Skills ─────────────────────────────────────────────────

export const MOCK_SKILLS: MockSkill[] = [
  { id: 'skill-1', name: 'TypeScript', category: 'language', proficiency: 85, project_count: 3, color: '#3178c6' },
  { id: 'skill-2', name: 'React', category: 'framework', proficiency: 88, project_count: 3, color: '#61dafb' },
  { id: 'skill-3', name: 'Node.js', category: 'framework', proficiency: 78, project_count: 2, color: '#68a063' },
  { id: 'skill-4', name: 'Python', category: 'language', proficiency: 72, project_count: 1, color: '#3776ab' },
  { id: 'skill-5', name: 'PostgreSQL', category: 'tool', proficiency: 70, project_count: 2, color: '#336791' },
  { id: 'skill-6', name: 'Docker', category: 'tool', proficiency: 60, project_count: 1, color: '#2496ed' },
  { id: 'skill-7', name: 'React Native', category: 'framework', proficiency: 75, project_count: 1, color: '#61dafb' },
  { id: 'skill-8', name: 'MongoDB', category: 'tool', proficiency: 65, project_count: 1, color: '#47a248' },
  { id: 'skill-9', name: 'REST APIs', category: 'concept', proficiency: 90, project_count: 4, color: '#00c3e4' },
  { id: 'skill-10', name: 'Git', category: 'tool', proficiency: 85, project_count: 4, color: '#f05032' },
];

// ─── AI Review ──────────────────────────────────────────────

export const MOCK_REVIEW: MockReview = {
  id: 'review-1',
  project_id: 'proj-1',
  overall_score: 82,
  code_quality: 85,
  documentation: 72,
  architecture: 88,
  innovation: 78,
  strengths: [
    'Clean separation of concerns with well-defined service layers',
    'Comprehensive error handling and input validation',
    'Efficient database query patterns with proper indexing',
    'Consistent code style and naming conventions',
  ],
  suggestions: [
    'Add unit tests for critical business logic — current coverage is below 40%',
    'Implement API rate limiting to prevent abuse',
    'Consider adding a caching layer for frequently accessed data',
    'Improve README with setup instructions and API documentation',
  ],
  generated_at: '2026-09-10T14:30:00Z',
};

// ─── Activity Feed ──────────────────────────────────────────

export const MOCK_ACTIVITIES: MockActivity[] = [
  {
    id: 'act-1',
    type: 'project_added',
    message: 'Added "Task Management API" to portfolio',
    timestamp: '2026-09-10T16:45:00Z',
  },
  {
    id: 'act-2',
    type: 'review_completed',
    message: 'AI review completed for "E-Commerce Platform"',
    timestamp: '2026-09-10T14:30:00Z',
  },
  {
    id: 'act-3',
    type: 'skill_updated',
    message: 'TypeScript proficiency increased to 85%',
    timestamp: '2026-09-08T11:00:00Z',
  },
  {
    id: 'act-4',
    type: 'profile_updated',
    message: 'Updated bio and GitHub profile link',
    timestamp: '2026-09-05T09:15:00Z',
  },
];

// ─── Dashboard Stats ────────────────────────────────────────

export const MOCK_STATS = {
  projectCount: MOCK_PROJECTS.length,
  skillCount: MOCK_SKILLS.length,
  avgScore: 75,
  reviewCount: 2,
};
