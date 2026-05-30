import api from './api';
import type { Quiz, ForumPost } from '../types';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar?: string;

  totalQuizzes: number;
  totalPosts: number;
  quizzes: Quiz[];
  posts?: ForumPost[];
}

export const userService = {
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/users/me');
    return response.data;
  },
  getUserProfile: async (userId: number): Promise<UserProfile> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
  updateProfile: async (data: { name?: string; avatar?: string; password?: string }): Promise<UserProfile> => {
    const response = await api.put('/users/me', data);
    return response.data;
  }
};
