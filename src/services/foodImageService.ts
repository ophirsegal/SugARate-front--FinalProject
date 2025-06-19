import axios from 'axios';

export interface FoodImageResponse {
  message: string;
  foodName?: string;
  nutritionInfo?: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  timestamp: Date;
}

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  hasImage?: boolean;
}

class FoodImageService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = 'http://localhost:5000/api/ai';
    this.token = localStorage.getItem('token');
  }

  private getHeaders(isMultipart = false) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`
    };

    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  async analyzeFoodImage(imageFile: File, description?: string): Promise<FoodImageResponse> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      if (description) {
        formData.append('description', description);
      }

      const response = await axios.post(
        `${this.baseURL}/food-image-recognition`,
        formData,
        { 
          headers: this.getHeaders(true)
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('[FoodImageService] Error analyzing food image:', error);
      throw error;
    }
  }

  async analyzeFoodText(description: string): Promise<FoodImageResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/food-text-recognition`,
        { description },
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('[FoodImageService] Error analyzing food description:', error);
      throw error;
    }
  }
}

export default new FoodImageService();