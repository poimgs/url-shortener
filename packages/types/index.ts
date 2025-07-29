// Re-export schemas for runtime validation
export * from './schemas'

// Response types (not validated with Zod, just TypeScript interfaces)
export interface CreateUrlResponse {
  id: string;
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface UrlStatsResponse {
  id: string;
  shortCode: string;
  originalUrl: string;
  title: string;
  createdAt: Date;
  isActive: boolean;
}

export interface UserUrlsResponse {
  urls: UrlStatsResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface RedirectResponse {
  originalUrl: string;
  found: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}