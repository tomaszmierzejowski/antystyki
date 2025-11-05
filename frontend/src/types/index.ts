export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

import type { AntisticData } from './templates';

export type AntisticChartData = Partial<AntisticData>;

export type StatisticChartData = Record<string, unknown>;

export interface Antistic {
  id: string;
  title: string;
  reversedStatistic: string;
  sourceUrl: string;
  imageUrl: string;
  slug: string;
  canonicalUrl: string;
  backgroundImageKey?: string;
  templateId?: string;
  chartData?: AntisticChartData;
  status: string;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  publishedAt?: string;
  hiddenAt?: string;
  user: User;
  categories: Category[];
}

export interface Category {
  id: string;
  namePl: string;
  nameEn: string;
  slug: string;
}

export interface Statistic {
  id: string;
  title: string;
  summary: string;
  description?: string;
  sourceUrl: string;
  sourceCitation?: string;
  slug: string;
  canonicalUrl: string;
  chartData?: StatisticChartData;
  status: string;
  likeCount: number;
  dislikeCount: number;
  trustPoints: number;
  fakePoints: number;
  viewsCount: number;
  hasLiked: boolean;
  hasDisliked: boolean;
  createdAt: string;
  publishedAt?: string;
  moderatedAt?: string;
  createdByUserId: string;
  convertedAntisticId?: string;
  createdBy: User;
}

export interface StatisticListResponse {
  items: Statistic[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  captchaToken: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface AntisticListResponse {
  items: Antistic[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CreateAntisticRequest {
  title: string;
  reversedStatistic: string;
  sourceUrl: string;
  backgroundImageKey?: string;
  templateId?: string;
  chartData?: AntisticChartData; // Chart data object
  categoryIds: string[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface CommentListResponse {
  items: Comment[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CreateCommentRequest {
  content: string;
}


