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
  status: string;
  likesCount: number;
  viewsCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  publishedAt?: string;
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
  categoryIds: string[];
}


