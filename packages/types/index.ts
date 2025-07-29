export interface CreateUrlRequest {
  originalUrl: string;
  customSlug?: string;
}

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
  clickCount: number;
  createdAt: Date;
  lastAccessedAt?: Date;
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