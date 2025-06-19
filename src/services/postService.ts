import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api/posts';

export interface HealthMetrics {
  location?: string;
  insulinUnits?: number;
  mealCarbs?: number;
}

export interface Post {
  _id: string;
  userId: {
    _id: string;
    username: string;
    profileImage: string;
  };
  content: string;
  image?: string;
  healthMetrics?: HealthMetrics;
  likes: string[];
  comments: Array<{
    _id: string;
    userId: {
      _id: string;
      username: string;
    };
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
}

interface CreatePostResponse {
  message: string;
  post: Post;
}

class PostService {
  private getAuthHeader() {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async createPost(
    content: string, 
    imageBase64?: string, 
    healthMetrics?: HealthMetrics
  ): Promise<CreatePostResponse> {
    try {
      const response = await axios.post<CreatePostResponse>(
        API_URL, 
        { 
          content, 
          image: imageBase64,
          healthMetrics: healthMetrics && Object.keys(healthMetrics).length > 0 ? healthMetrics : undefined
        },
        {
          headers: this.getAuthHeader()
        }
      );

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updatePost(
    postId: string, 
    content: string,
    healthMetrics?: HealthMetrics
  ): Promise<{ message: string; post: Post }> {
    try {
      const response = await axios.put<{ message: string; post: Post }>(
        `${API_URL}/${postId}`,
        { 
          content,
          healthMetrics: healthMetrics && Object.keys(healthMetrics).length > 0 ? healthMetrics : undefined
        },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getAllPosts(): Promise<Post[]> {
    try {
      const response = await axios.get<Post[]>(API_URL, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    try {
      const response = await axios.get<Post[]>(`${API_URL}/user/${userId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async likePost(postId: string): Promise<{ message: string; likes: number }> {
    try {
      const response = await axios.post<{ message: string; likes: number }>(
        `${API_URL}/${postId}/like`,
        {},
        {
          headers: this.getAuthHeader()
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async addComment(postId: string, content: string): Promise<{
    message: string;
    comments: Post['comments'];
  }> {
    try {
      const response = await axios.post(
        `${API_URL}/${postId}/comment`,
        { content },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async deletePost(postId: string): Promise<{ message: string }> {
    try {
      const response = await axios.delete<{ message: string }>(
        `${API_URL}/${postId}`,
        {
          headers: this.getAuthHeader()
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response) {
      throw new Error('Server error occurred');
    }
    throw new Error('Network error occurred');
  }
}

export default new PostService();