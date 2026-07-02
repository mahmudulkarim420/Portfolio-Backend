/**
 * Shared application types and interfaces.
 *
 * These mirror the frontend "legacy" read shapes (README §2.4) so that API
 * responses are drop-in compatible with the existing frontend types.
 */
import type { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Auth / session
// ---------------------------------------------------------------------------

/** Matches the frontend `SessionUser` type (id, email, name). */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** JWT payload shape (README §5: { sub, email, name }). */
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Legacy read shapes (frontend `src/types/index.ts`)
// ---------------------------------------------------------------------------

export interface LegacyProjectTechnology {
  name: string;
  fullWidth: boolean;
}

export interface LegacyProjectLinks {
  live: string;
  clientRepo: string;
  serverRepo: string;
}

export interface LegacyProject {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  briefDescription: string;
  content: string;
  technologies: LegacyProjectTechnology[];
  links: LegacyProjectLinks;
  challengesFaced: string[];
  futurePlans: string[];
  order?: number;
  published?: boolean;
}

export interface LegacySkill {
  id: string;
  name: string;
  category: string;
  level: string;
  proficiency: number;
  icon: string;
  order: number;
}

export interface LegacyExperience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  period: string;
  description: string;
  order: number;
}

export interface LegacyProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  twitter: string;
  website: string;
  avatar: string;
  resumeUrl: string;
}

export interface LegacyMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Input shapes (frontend `*Input` types)
// ---------------------------------------------------------------------------

export interface ProjectInputTechnology {
  name: string;
  fullWidth: boolean;
}

export interface ProjectInputLinks {
  live?: string;
  clientRepo?: string;
  serverRepo?: string;
}

export interface ProjectInput {
  title: string;
  subtitle?: string;
  slug: string;
  image?: string;
  briefDescription?: string;
  content?: string;
  published?: boolean;
  order?: number;
  technologies?: ProjectInputTechnology[];
  links?: ProjectInputLinks;
  challengesFaced?: string[];
  futurePlans?: string[];
}

// ---------------------------------------------------------------------------
// API response envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Express augmentation (req.user)
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

/** Custom application error with an HTTP status code. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: Record<string, string>,
    isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/** Convenience typed handler to avoid repetitive try/catch in controllers. */
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
