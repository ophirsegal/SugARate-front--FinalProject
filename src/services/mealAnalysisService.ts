import axios from 'axios';
import authService from './authService';
import userSettings from '../utils/userSettings';
import { calculateInsulinForCarbs } from '../utils/insulinCalculator';

const API_URL = 'http://localhost:5000/api/ai';

export interface NutritionInfo {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface MealAnalysisResponse {
  message: string;
  foodName?: string;
  nutritionInfo?: NutritionInfo;
  insulinRequired?: number;
  timestamp: Date;
}

class MealAnalysisService {
  private getAuthHeader() {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Analyze meal from an image and calculate insulin requirements
   * @param imageBase64 Base64 encoded image data
   * @param description Optional description of the meal
   * @returns Analysis results including carbs and insulin calculation
   */
  async analyzeMealImage(imageBase64: string, description?: string): Promise<MealAnalysisResponse> {
    try {
      // Extract the base64 data part (remove the prefix if it exists)
      const base64Data = imageBase64.includes('base64,') 
        ? imageBase64.split('base64,')[1] 
        : imageBase64;
      
      // Get file type from base64 string
      const mimeType = this.getMimeTypeFromBase64(imageBase64);
      
      // Create FormData with the image
      const formData = new FormData();
      const blob = this.base64ToBlob(base64Data, mimeType);
      formData.append('image', blob, 'meal.jpg');
      
      // Add description if provided
      if (description) {
        formData.append('description', description);
      }

      // Send request to backend
      const response = await axios.post<MealAnalysisResponse>(
        `${API_URL}/analyze-food-image`,
        formData,
        {
          headers: {
            ...this.getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Calculate insulin required based on carbs and user's ICR ratio
      const result = response.data;
      if (result.nutritionInfo && result.nutritionInfo.carbs > 0) {
        const icrRatio = userSettings.getUserIcrRatio();
        result.insulinRequired = calculateInsulinForCarbs(result.nutritionInfo.carbs, icrRatio);
      }

      return result;
    } catch (error: any) {
      console.error('[MealAnalysisService] Error analyzing meal image:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get MIME type from base64 string
   */
  private getMimeTypeFromBase64(base64String: string): string {
    if (base64String.includes('data:image/jpeg') || base64String.includes('data:image/jpg')) {
      return 'image/jpeg';
    } else if (base64String.includes('data:image/png')) {
      return 'image/png';
    } else if (base64String.includes('data:image/gif')) {
      return 'image/gif';
    }
    // Default to JPEG if can't determine
    return 'image/jpeg';
  }

  /**
   * Convert base64 to Blob for uploading
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  /**
   * Submit feedback for food analysis results
   * @param analysisId ID of the analysis
   * @param isLike Whether the user liked or disliked the analysis
   * @param review Optional review text
   */
  async submitAnalysisFeedback(analysisId: string, isLike: boolean, review?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${API_URL}/analysis-feedback`,
        {
          analysisId,
          isLike,
          review
        },
        {
          headers: this.getAuthHeader()
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('[MealAnalysisService] Error submitting feedback:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    likes: number;
    dislikes: number;
    likePercentage: number;
  }> {
    try {
      const response = await axios.get(
        `${API_URL}/analysis-feedback/stats`,
        {
          headers: this.getAuthHeader()
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('[MealAnalysisService] Error getting feedback stats:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Error analyzing meal image. Please try again later.');
  }
}

export default new MealAnalysisService();