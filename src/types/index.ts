/**
 * API Request/Response Types
 * Centralized type definitions for all API endpoints
 */

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserListResponse {
  users: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Project Types
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  description?: string;
  key?: string;
  icon?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  icon?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  key: string;
  icon?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectListResponse {
  projects: ProjectResponse[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Team/Project Member Types
// ============================================================================

export interface AddTeamMemberRequest {
  userId: string;
  role: 'member' | 'admin' | 'lead';
}

export interface UpdateTeamMemberRequest {
  role?: 'member' | 'admin' | 'lead';
}

export interface TeamMemberResponse {
  userId: string;
  role: 'member' | 'admin' | 'lead';
  joinedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface TeamResponse {
  id: string;
  projectId: string;
  name?: string;
  description?: string;
  members: TeamMemberResponse[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Task Types
// ============================================================================

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  assigneeId?: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskListResponse {
  tasks: TaskResponse[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface ValidationErrorResponse extends ErrorResponse {
  code: 'VALIDATION_ERROR';
  details: Record<string, string[]>;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Extended Express Request Type
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
      };
    }
  }
}
