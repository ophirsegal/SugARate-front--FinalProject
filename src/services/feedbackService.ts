import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api/feedback';

export interface FeedbackData {
  analysisId: string;
  postId?: string;
  isLike: boolean;
  review?: string;
  imageAnalysisData: {
    foodName: string;
    carbs: number;
    calories: number;
    protein?: number;
    fat?: number;
    insulinCalculated: number;
    confidence?: string;
    portion?: string;
    glycemicIndex?: string;
    timestamp: Date;
  };
}

export interface FeedbackStats {
  totalFeedback: number;
  likes: number;
  dislikes: number;
  likePercentage: number;
}

export interface UserFeedbackResponse {
  feedback: any[];
  total: number;
  limit: number;
  offset: number;
}

class FeedbackService {
  private getAuthHeader() {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async submitFeedback(data: FeedbackData): Promise<{ success: boolean; message: string; feedback?: any }> {
    try {
      const response = await axios.post(API_URL, data, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      console.error('[FeedbackService] Error submitting feedback:', error);
      throw this.handleError(error);
    }
  }

  async getFeedbackStats(analysisType?: string): Promise<FeedbackStats> {
    try {
      const params = analysisType ? { analysisType } : {};
      const response = await axios.get(`${API_URL}/stats`, {
        headers: this.getAuthHeader(),
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('[FeedbackService] Error getting feedback stats:', error);
      throw this.handleError(error);
    }
  }

  async getUserFeedback(params?: {
    analysisType?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserFeedbackResponse> {
    try {
      const response = await axios.get(`${API_URL}/user`, {
        headers: this.getAuthHeader(),
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('[FeedbackService] Error getting user feedback:', error);
      throw this.handleError(error);
    }
  }

  async getFeedbackByAnalysisId(analysisId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/analysis/${analysisId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      console.error('[FeedbackService] Error getting feedback by analysis ID:', error);
      throw this.handleError(error);
    }
  }

  async deleteFeedback(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      console.error('[FeedbackService] Error deleting feedback:', error);
      throw this.handleError(error);
    }
  }

  async getRecentFeedback(params?: {
    days?: number;
  }): Promise<{
    feedback: any[];
    stats: {
      total: number;
      likes: number;
      dislikes: number;
      withReviews: number;
      withPosts: number;
    };
    period: string;
  }> {
    try {
      const response = await axios.get(`${API_URL}/recent`, {
        headers: this.getAuthHeader(),
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('[FeedbackService] Error getting recent feedback:', error);
      throw this.handleError(error);
    }
  }

  async getFeedbackByPostId(postId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/post/${postId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('[FeedbackService] Error getting feedback by post ID:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Error processing feedback request. Please try again later.');
  }
}

export default new FeedbackService();