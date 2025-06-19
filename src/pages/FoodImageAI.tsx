import { useState, useRef, useEffect } from 'react';
import { IoRefresh, IoCamera, IoImage, IoTrash } from 'react-icons/io5';
import { RiRobot2Line } from 'react-icons/ri';
import { MdFoodBank } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import foodImageService from '../services/foodImageService';

const FoodImageAI = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [foodName, setFoodName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to result when it's available
  useEffect(() => {
    if (analysisResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [analysisResult]);

  // Fix for Safari and mobile browsers scrolling issues
  useEffect(() => {
    const mainContainer = document.getElementById('food-image-ai-container');
    if (mainContainer) {
      const handleTouchMove = (e: TouchEvent) => {
        // Allow scrolling within the container
        if (mainContainer.scrollHeight > mainContainer.clientHeight) {
          e.stopPropagation();
        }
      };

      mainContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      return () => {
        mainContainer.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, []);

  // Camera handling
  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      if (showCamera && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          setShowCamera(false);
        }
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      // Reset any previous analysis
      setAnalysisResult(null);
      setFoodName(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL and create a file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "food-photo.jpg", { type: "image/jpeg" });
        setImageFile(file);
        setImagePreview(canvas.toDataURL('image/jpeg'));
        setShowCamera(false);
        // Reset any previous analysis
        setAnalysisResult(null);
        setFoodName(null);
      }
    }, 'image/jpeg', 0.95);
  };

  const resetAnalysis = () => {
    setImagePreview(null);
    setImageFile(null);
    setAnalysisResult(null);
    setInput('');
    setFoodName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!imageFile && !input.trim()) || isLoading) return;

    setIsLoading(true);

    try {
      // Analyze either image or text
      let response;
      if (imageFile) {
        response = await foodImageService.analyzeFoodImage(imageFile, input.trim());
      } else {
        response = await foodImageService.analyzeFoodText(input.trim());
      }

      setAnalysisResult(response.message);
      if (response.foodName) {
        setFoodName(response.foodName);
      }
    } catch (error) {
      console.error('[FoodImageAI] Error:', error);
      setAnalysisResult("Sorry, I couldn't analyze the food. Please try again with a clearer image or more specific description.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4] overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#8B7355_1px,transparent_0)] bg-[length:40px_40px]" />
      <div className="flex-grow flex flex-col max-w-4xl w-full mx-auto p-4 relative overflow-hidden">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-4 text-center border border-[#8B7355]/10">
          <h1 className="text-2xl font-bold text-[#8B7355] mb-1">Food Image Recognition</h1>
          <p className="text-[#8B7355]/80 text-sm">Upload or take a photo of food to get nutrition estimates</p>
        </div>

        {/* Camera view (conditionally rendered) */}
        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4 bg-black/50">
              <button 
                onClick={() => setShowCamera(false)}
                className="p-3 bg-red-500 rounded-full text-white"
              >
                <IoRefresh className="w-6 h-6" />
              </button>
              <button
                onClick={handleCameraCapture}
                className="p-3 bg-white rounded-full text-black"
              >
                <IoCamera className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}

        {/* Main content container */}
        <div id="food-image-ai-container" className="flex-grow bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-4 border border-[#8B7355]/10 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex flex-col gap-5">
            {/* Top section: Image selection/preview */}
            <div className="flex flex-col md:flex-row gap-6 pb-5 border-b border-[#8B7355]/10">
              {/* Left side: Image upload area */}
              <div className={`flex-1 ${imagePreview ? 'md:max-w-xs' : ''}`}>
                {!imagePreview ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#8B7355]/30 rounded-xl">
                    <MdFoodBank className="w-16 h-16 mb-4 text-[#8B7355]/50" />
                    <h3 className="text-lg font-medium text-[#8B7355] mb-2 text-center">Upload Food Photo</h3>
                    <p className="text-sm text-center text-[#8B7355]/70 mb-5">
                      Upload or take a photo of your food to analyze nutrition
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#8B7355] hover:bg-[#A68A64] text-white rounded-lg transition-colors"
                      >
                        <IoImage className="w-5 h-5" />
                        <span>Upload Photo</span>
                      </button>
                      <button
                        onClick={() => setShowCamera(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#8B7355]/20 hover:bg-[#8B7355]/30 text-[#8B7355] rounded-lg transition-colors"
                      >
                        <IoCamera className="w-5 h-5" />
                        <span>Take Photo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="relative mb-3">
                      <img 
                        src={imagePreview} 
                        alt="Food preview" 
                        className="w-full h-auto max-h-80 object-contain rounded-lg border border-[#8B7355]/20"
                      />
                      <button 
                        onClick={resetAnalysis}
                        className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md text-red-500 hover:text-red-600 transition-colors"
                        title="Remove image"
                      >
                        <IoTrash className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Add food details (optional)..."
                        className="px-4 py-2 border border-[#8B7355]/20 rounded-lg focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355]"
                        disabled={isLoading}
                      />
                      <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="py-2 px-4 bg-[#8B7355] hover:bg-[#A68A64] text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <IoRefresh className="w-5 h-5 animate-spin" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <span>Analyze Nutrition</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right side: Text input (shown when no image) */}
              {!imagePreview && (
                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-medium text-[#8B7355] mb-3">Or Describe Your Food</h3>
                  <p className="text-sm text-[#8B7355]/70 mb-4">
                    Don't have a photo? Just describe the food items and portions.
                  </p>
                  <form onSubmit={handleAnalyze} className="flex flex-col gap-3 flex-grow">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Example: Large cheese pizza slice with thin crust"
                      className="flex-grow px-4 py-3 border border-[#8B7355]/20 rounded-lg focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] min-h-[120px]"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="py-3 bg-[#8B7355] hover:bg-[#A68A64] text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <IoRefresh className="w-5 h-5 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <span>Analyze Nutrition</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
            
            {/* Bottom section: Analysis results */}
            {analysisResult && (
              <div className="mt-2" ref={resultRef}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#8B7355] shadow-md">
                    <RiRobot2Line className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#8B7355]">Nutrition Analysis</h3>
                    {foodName && (
                      <p className="text-sm text-[#8B7355]/80">{foodName}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#8B7355]/5 rounded-xl p-5 mb-4 overflow-auto max-h-[50vh]">
                  <div className="prose prose-sm md:prose prose-headings:text-[#8B7355] prose-strong:text-[#8B7355] prose-p:text-[#8B7355]/90 max-w-none">
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                  </div>
                </div>
                
                <div className="flex justify-center mt-2">
                  <button
                    onClick={resetAnalysis}
                    className="px-5 py-3 bg-[#8B7355] hover:bg-[#A68A64] text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <IoRefresh className="w-5 h-5" />
                    <span>Analyze Another Food</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        ref={fileInputRef}
        className="hidden"
      />
    </div>
  );
};

export default FoodImageAI;