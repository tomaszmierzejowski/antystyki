export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface Antistic {
  id: string;
  title: string;
  reversedStatistic: string;
  sourceUrl: string;
  imageUrl: string;
  backgroundImageKey?: string;
  templateId?: string;
  chartData?: any; // Chart data object from backend
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
  chartData?: any; // Chart data object
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


