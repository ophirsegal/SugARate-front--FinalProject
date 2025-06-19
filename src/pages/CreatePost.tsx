import { useState } from 'react';
import { PhotoIcon, XMarkIcon, MapPinIcon, BeakerIcon, CakeIcon, SparklesIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import postService from '../services/postService';
import mealAnalysisService from '../services/mealAnalysisService';
import feedbackService from '../services/feedbackService';
import { compressImage } from '../utils/utils';

interface HealthMetrics {
  location?: string;
  insulinUnits?: number;
  mealCarbs?: number;
}

interface AnalysisReview {
  liked: boolean | null;
  comment: string;
}

const CreatePost = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<HealthMetrics>({});
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisReview, setAnalysisReview] = useState<AnalysisReview>({
    liked: null,
    comment: ''
  });
  const [showReviewField, setShowReviewField] = useState(false);
  const [showAnalyzePrompt, setShowAnalyzePrompt] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should not exceed 10MB');
        return;
      }

      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        setError('Only JPEG, PNG and GIF images are allowed');
        return;
      }

      try {
        setLoading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = reader.result as string;
            const compressedImage = await compressImage(base64);
            setImagePreview(compressedImage);
            setPendingImage(compressedImage);
            setError('');
            
            // Show the analyze prompt modal
            setShowAnalyzePrompt(true);
          } catch (err) {
            setError('Error compressing image');
          } finally {
            setLoading(false);
          }
        };
        reader.onerror = () => {
          setError('Error reading file');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError('Error processing image');
        setLoading(false);
      }
    }
  };

  /**
   * Analyze meal image to get carbohydrate content and calculate insulin
   */
  const analyzeMealImage = async (imageBase64: string) => {
    try {
      setIsAnalyzingImage(true);
      setAnalysisResult(null);
      
      const result = await mealAnalysisService.analyzeMealImage(imageBase64);
      
      // Update the metrics with the analysis results
      if (result.nutritionInfo) {
        setMetrics(prev => ({
          ...prev,
          mealCarbs: Math.round(result.nutritionInfo?.carbs || 0),
          insulinUnits: parseFloat(result.insulinRequired?.toFixed(1) || '0')
        }));
        
        // Set the food name and nutrition info in the post content if it's empty
        if (!content && result.foodName) {
          setContent(`Meal: ${result.foodName}${result.portion ? ` (${result.portion})` : ''}`);
        }
        
        // Store the full analysis result for display
        setAnalysisResult(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze meal image');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await postService.createPost(content, imagePreview || undefined, metrics);
      
      // If there's analysis result, automatically send feedback with the post ID
      if (analysisResult && response.post?._id) {
        // Only send if user has provided feedback (liked or disliked)
        if (analysisReview.liked !== null) {
          await sendAnalysisFeedback(response.post._id);
        } else {
          // If no feedback provided yet, still save the analysis data with neutral feedback
          try {
            const analysisId = `${new Date(analysisResult.timestamp).getTime()}_${analysisResult.foodName?.replace(/\s+/g, '_') || 'unknown'}`;
            
            await feedbackService.submitFeedback({
              analysisId,
              postId: response.post._id,
              isLike: false, // Default to false if no feedback provided
              review: 'Auto-saved without user feedback',
              imageAnalysisData: {
                foodName: analysisResult.foodName || '',
                carbs: analysisResult.nutritionInfo?.carbs || 0,
                calories: analysisResult.nutritionInfo?.calories || 0,
                protein: analysisResult.nutritionInfo?.protein,
                fat: analysisResult.nutritionInfo?.fat,
                insulinCalculated: analysisResult.insulinRequired || 0,
                confidence: analysisResult.confidence,
                portion: analysisResult.portion,
                glycemicIndex: analysisResult.glycemicIndex,
                timestamp: analysisResult.timestamp
              }
            });
          } catch (feedbackError) {
            console.error('Error auto-saving feedback:', feedbackError);
            // Don't block post creation if feedback fails
          }
        }
      }
      
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
      setLoading(false);
    }
  };

  const handleMetricsChange = (field: keyof HealthMetrics, value: string) => {
    setMetrics(prev => ({
      ...prev,
      [field]: value === '' ? undefined : field === 'location' ? value : Number(value)
    }));
  };

  const handleAnalysisReview = (liked: boolean) => {
    setAnalysisReview(prev => ({
      ...prev,
      liked: prev.liked === liked ? null : liked
    }));
    setShowReviewField(true);
  };

  const sendAnalysisFeedback = async (postId?: string) => {
    if (analysisResult && analysisReview.liked !== null) {
      try {
        // Generate a unique analysis ID from timestamp and food name
        const analysisId = `${new Date(analysisResult.timestamp).getTime()}_${analysisResult.foodName?.replace(/\s+/g, '_') || 'unknown'}`;
        
        await feedbackService.submitFeedback({
          analysisId,
          postId,
          isLike: analysisReview.liked,
          review: analysisReview.comment || undefined,
          imageAnalysisData: {
            foodName: analysisResult.foodName || '',
            carbs: analysisResult.nutritionInfo?.carbs || 0,
            calories: analysisResult.nutritionInfo?.calories || 0,
            protein: analysisResult.nutritionInfo?.protein,
            fat: analysisResult.nutritionInfo?.fat,
            insulinCalculated: analysisResult.insulinRequired || 0,
            confidence: analysisResult.confidence,
            portion: analysisResult.portion,
            glycemicIndex: analysisResult.glycemicIndex,
            timestamp: analysisResult.timestamp
          }
        });
        
        // Show success notification instead of alert
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        notification.textContent = 'Thank you for your feedback!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.classList.add('animate-slide-out');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Reset the review state
        setShowReviewField(false);
        setAnalysisReview({ liked: null, comment: '' });
      } catch (error) {
        console.error('Error sending feedback:', error);
        
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        notification.textContent = 'Failed to send feedback. Please try again.';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.classList.add('animate-slide-out');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }
    }
  };

  const handleAnalyzeConfirm = () => {
    setShowAnalyzePrompt(false);
    if (pendingImage) {
      analyzeMealImage(pendingImage);
      setPendingImage(null);
    }
  };

  const handleAnalyzeCancel = () => {
    setShowAnalyzePrompt(false);
    setPendingImage(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4] py-12">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#8B7355_1px,transparent_0)] bg-[length:40px_40px]" />
      <div className="max-w-2xl mx-auto px-4 relative">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-[#8B7355]/10">
          <h2 className="text-2xl font-semibold mb-6 text-[#8B7355]">Create Post</h2>

          {error && (
            <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#8B7355] font-medium mb-2">Your Post</label>
              <textarea
                className="w-full p-4 bg-[#8B7355]/5 border border-[#8B7355]/20 rounded-xl resize-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent disabled:bg-gray-100 placeholder-[#8B7355]/50"
                rows={4}
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#8B7355] font-medium mb-2">Location</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355]" />
                  <input
                    type="text"
                    placeholder="Add location"
                    value={metrics.location || ''}
                    onChange={(e) => handleMetricsChange('location', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#8B7355]/5 border border-[#8B7355]/20 rounded-xl focus:ring-2 focus:ring-[#8B7355] focus:border-transparent placeholder-[#8B7355]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8B7355] font-medium mb-2">Insulin Units</label>
                <div className="relative">
                  <BeakerIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355]" />
                  <input
                    type="number"
                    placeholder="Units"
                    value={metrics.insulinUnits || ''}
                    onChange={(e) => handleMetricsChange('insulinUnits', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#8B7355]/5 border border-[#8B7355]/20 rounded-xl focus:ring-2 focus:ring-[#8B7355] focus:border-transparent placeholder-[#8B7355]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8B7355] font-medium mb-2">Carbohydrates</label>
                <div className="relative">
                  <CakeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355]" />
                  <input
                    type="number"
                    placeholder="Grams"
                    value={metrics.mealCarbs || ''}
                    onChange={(e) => handleMetricsChange('mealCarbs', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#8B7355]/5 border border-[#8B7355]/20 rounded-xl focus:ring-2 focus:ring-[#8B7355] focus:border-transparent placeholder-[#8B7355]/50"
                  />
                </div>
              </div>
            </div>

            {imagePreview ? (
              <div className="relative bg-[#8B7355]/5 p-2 rounded-xl border border-[#8B7355]/20">
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute right-4 top-4 bg-black/50 hover:bg-black/70 p-1.5 rounded-full text-white z-10 disabled:opacity-50 transition-all duration-200"
                  disabled={loading || isAnalyzingImage}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                {isAnalyzingImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-lg z-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-2"></div>
                    <span className="text-white text-sm font-medium">Analyzing meal...</span>
                  </div>
                )}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-lg max-h-[300px] object-cover"
                />
                
                {/* Analysis Result Banner */}
                {analysisResult && (
                  <div className="mt-3 bg-gradient-to-r from-[#8B7355]/10 to-[#A68A64]/10 rounded-xl p-4 border border-[#8B7355]/20">
                    <div className="flex items-start gap-3 mb-3">
                      <SparklesIcon className="h-6 w-6 text-[#8B7355] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#8B7355] text-lg mb-1">
                          {analysisResult.foodName}
                        </h4>
                        <p className="text-sm text-gray-600">{analysisResult.portion}</p>
                      </div>
                      {analysisResult.confidence && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          analysisResult.confidence === 'high' ? 'bg-green-100 text-green-700' :
                          analysisResult.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {analysisResult.confidence} confidence
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      <div className="bg-white/70 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">Calories</p>
                        <p className="text-lg font-bold text-[#8B7355]">{analysisResult.nutritionInfo?.calories}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">Carbs</p>
                        <p className="text-lg font-bold text-[#8B7355]">{analysisResult.nutritionInfo?.carbs}g</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">Protein</p>
                        <p className="text-lg font-bold text-[#8B7355]">{analysisResult.nutritionInfo?.protein}g</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#8B7355]/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-[#8B7355]">Insulin Required</p>
                        <p className="text-xs text-gray-600">Based on ICR 1:{analysisResult.insulinCalculation?.icrRatio || 10}</p>
                      </div>
                      <p className="text-2xl font-bold text-[#8B7355]">
                        {analysisResult.insulinRequired?.toFixed(1)} units
                      </p>
                    </div>
                    
                    {analysisResult.glycemicIndex && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-gray-600">Glycemic Index:</span>
                        <span className={`font-medium ${
                          analysisResult.glycemicIndex === 'low' ? 'text-green-600' :
                          analysisResult.glycemicIndex === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {analysisResult.glycemicIndex.toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Like/Dislike Feedback */}
                    <div className="mt-4 border-t border-[#8B7355]/20 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">Was this analysis helpful?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAnalysisReview(true)}
                            className={`p-2 rounded-lg transition-all ${
                              analysisReview.liked === true
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                            }`}
                            title="Good analysis"
                          >
                            {analysisReview.liked === true ? (
                              <HandThumbUpSolid className="w-5 h-5" />
                            ) : (
                              <HandThumbUpIcon className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAnalysisReview(false)}
                            className={`p-2 rounded-lg transition-all ${
                              analysisReview.liked === false
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title="Needs improvement"
                          >
                            {analysisReview.liked === false ? (
                              <HandThumbDownSolid className="w-5 h-5" />
                            ) : (
                              <HandThumbDownIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Review Comment Field */}
                      {showReviewField && (
                        <div className="space-y-2">
                          <textarea
                            placeholder={
                              analysisReview.liked === true
                                ? "What was accurate about this analysis? (optional)"
                                : analysisReview.liked === false
                                ? "What could be improved? (optional)"
                                : "Share your feedback... (optional)"
                            }
                            value={analysisReview.comment}
                            onChange={(e) => setAnalysisReview(prev => ({ ...prev, comment: e.target.value }))}
                            className="w-full p-2 text-sm bg-white/70 border border-[#8B7355]/20 rounded-lg resize-none focus:ring-1 focus:ring-[#8B7355] focus:border-transparent placeholder-gray-500"
                            rows={2}
                          />
                          <p className="text-xs text-gray-500 text-right">
                            Your feedback will be saved when you create the post
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Analyze button (if not already analyzed) */}
                {!isAnalyzingImage && !analysisResult && (
                  <button
                    type="button"
                    onClick={() => analyzeMealImage(imagePreview)}
                    className="mt-2 w-full p-2 flex items-center justify-center gap-2 bg-[#8B7355]/20 hover:bg-[#8B7355]/30 text-[#8B7355] rounded-lg transition-colors"
                    disabled={loading}
                  >
                    <SparklesIcon className="h-5 w-5" />
                    <span>Analyze Meal Image</span>
                  </button>
                )}
              </div>
            ) : (
              <label className="block">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B7355]/5 text-[#8B7355] hover:bg-[#8B7355]/10 cursor-pointer disabled:opacity-50 transition-all duration-200 border border-[#8B7355]/20">
                  <PhotoIcon className="h-5 w-5" />
                  <span>Add Image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                </div>
              </label>
            )}

            <div className="flex gap-4 justify-end border-t border-[#8B7355]/10 pt-6">
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="px-4 py-2 text-[#8B7355] hover:bg-[#8B7355]/5 rounded-xl transition-all duration-200 disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-6 py-2 bg-gradient-to-r from-[#8B7355] to-[#A68A64] hover:shadow-lg text-white rounded-xl disabled:opacity-50 min-w-[100px] flex items-center justify-center transition-all duration-200"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Analyze Prompt Modal */}
      {showAnalyzePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-center w-16 h-16 bg-[#8B7355]/10 rounded-full mx-auto mb-4">
              <SparklesIcon className="h-8 w-8 text-[#8B7355]" />
            </div>
            
            <h3 className="text-xl font-semibold text-[#8B7355] text-center mb-2">
              AI Meal Analysis Available
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              Would you like to analyze this meal image for nutritional information? 
              Our AI will identify the food, estimate carbohydrates, and calculate insulin requirements.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleAnalyzeCancel}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleAnalyzeConfirm}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#8B7355] to-[#A68A64] hover:shadow-lg text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2"
              >
                <SparklesIcon className="h-5 w-5" />
                Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;