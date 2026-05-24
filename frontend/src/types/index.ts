export interface Quiz {
  id: number;
  title: string;
  category: string;
  description?: string;
  questionCount: number;
  playCount: number;
  status?: string;
  rejectReason?: string;
  appealMessage?: string;
  author: {
    id?: number;
    name: string;
    avatar?: string;
  };
  questions?: Question[];
}

export interface Question {
  id: number;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  likeCount: number;
  commentCount: number;
  createdAt: string;
  status?: string;
  rejectReason?: string;
  appealMessage?: string;
  liked?: boolean;
  tags?: string[];
}


export interface ForumComment {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  likeCount: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateQuizRequest {
  title: string;
  category: string;
  description?: string;
  questionCount: number;
}
