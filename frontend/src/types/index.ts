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
  liked?: boolean;
  tags?: string[];
  appealMessage?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  linkUrl?: string;
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
  parentId?: number;
  replyToAuthorName?: string;
  replies?: ForumComment[];
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
  questions?: {
    content: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[];
}

export interface QuizComment {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  parentId?: number;
  replyToAuthorName?: string;
  replies?: QuizComment[];
}

export interface Notification {
  id: number;
  type: 'LIKE' | 'COMMENT' | 'REPLY' | 'QUIZ_COMMENT' | 'QUIZ_REPLY';
  postId?: number;
  quizId?: number;
  message: string;
  isRead: boolean; // Map to the backend name (mapped from Boolean isRead / @Column name="is_read")
  createdAt: string;
  actor: {
    id: number;
    name: string;
    avatar?: string;
  };
}
