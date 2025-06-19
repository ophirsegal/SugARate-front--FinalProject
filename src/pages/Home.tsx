// src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import postService, { Post as PostType } from '../services/postService';
import authService from '../services/authService';
import PostList from '../components/PostList';
import { ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { userService } from '../services/userService';

const Alert = ({
  severity,
  children,
  onClose,
}: {
  severity: string;
  children: React.ReactNode;
  onClose: () => void;
}) => {
  const bgColor = severity === 'error' ? 'bg-red-100' : 'bg-blue-100';
  const textColor = severity === 'error' ? 'text-red-700' : 'text-blue-700';

  return (
    <div className={`${bgColor} ${textColor} p-4 rounded-lg flex justify-between items-center mb-4`}>
      <span>{children}</span>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
    </div>
  );
};

const Home = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [todayInsulin, setTodayInsulin] = useState(0);
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchPosts();
    if (currentUser) {
      fetchTodayMetrics();
    }
  }, []);

  const fetchTodayMetrics = async () => {
    try {
      // Get the current user's posts
      const user = userService.getUserFromStorage();
      if (!user) return;
      
      const userPosts = await postService.getUserPosts(user.id);
      
      // Filter posts to only include those from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysPosts = userPosts.filter(post => {
        const postDate = new Date(post.createdAt);
        return postDate >= today;
      });

      // Calculate totals
      const totalCarbs = todaysPosts.reduce((sum, post) => 
        sum + (post.healthMetrics?.mealCarbs || 0), 0
      );
      const totalInsulin = todaysPosts.reduce((sum, post) => 
        sum + (post.healthMetrics?.insulinUnits || 0), 0
      );

      setTodayCarbs(totalCarbs);
      setTodayInsulin(totalInsulin);
    } catch (err) {
      console.error('Failed to fetch today metrics:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const fetchedPosts = await postService.getAllPosts();
      setPosts(fetchedPosts);
      console.log(fetchedPosts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      await postService.likePost(postId);
      fetchPosts();
    } catch (err: any) {
      setError(err.message || 'Failed to like post');
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      await postService.addComment(postId, content);
      fetchPosts();
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4]">
      <div className="bg-white/40 backdrop-blur-sm min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Circular Health Progress Visualization */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-xl">
            <div className="flex flex-col items-center">
              {/* Circular Progress Container */}
              <div className="relative w-80 h-80 mb-8">
                {/* Background decorative circle */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B7355]/5 to-[#A68A64]/5"></div>
                
                {/* Outer ring - Daily Carbs */}
                <svg className="w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id="carbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B7355" />
                      <stop offset="100%" stopColor="#6B5D54" />
                    </linearGradient>
                  </defs>
                  {/* Background circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r="140"
                    stroke="#E8DCC4"
                    strokeWidth="20"
                    fill="none"
                    opacity="0.3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r="140"
                    stroke="url(#carbGradient)"
                    strokeWidth="20"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 140}`}
                    strokeDashoffset={`${2 * Math.PI * 140 * (1 - Math.min(todayCarbs / 300, 1))}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out filter drop-shadow-lg"
                  />
                  {/* Progress end dot */}
                  <circle
                    cx="160"
                    cy="20"
                    r="12"
                    fill="#8B7355"
                    className="filter drop-shadow-md"
                    transform={`rotate(${360 * Math.min(todayCarbs / 300, 1)} 160 160)`}
                  />
                </svg>
                
                {/* Inner ring - Insulin Units */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id="insulinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D4A574" />
                      <stop offset="100%" stopColor="#C19A6B" />
                    </linearGradient>
                  </defs>
                  {/* Background circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r="110"
                    stroke="#F5E6D3"
                    strokeWidth="20"
                    fill="none"
                    opacity="0.3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r="110"
                    stroke="url(#insulinGradient)"
                    strokeWidth="20"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 110}`}
                    strokeDashoffset={`${2 * Math.PI * 110 * (1 - Math.min(todayInsulin / 50, 1))}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out filter drop-shadow-lg"
                  />
                  {/* Progress end dot */}
                  <circle
                    cx="160"
                    cy="50"
                    r="12"
                    fill="#D4A574"
                    className="filter drop-shadow-md"
                    transform={`rotate(${360 * Math.min(todayInsulin / 50, 1)} 160 160)`}
                  />
                </svg>
                
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="bg-white/90 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-3xl font-bold text-[#8B7355] mb-1">Today</h2>
                    <p className="text-sm text-gray-600 mb-2">Health Score</p>
                    <p className="text-5xl font-bold bg-gradient-to-r from-[#8B7355] to-[#A68A64] bg-clip-text text-transparent">{Math.round((Math.min(todayCarbs / 300, 1) * 0.5 + Math.min(todayInsulin / 50, 1) * 0.5) * 100)}%</p>
                  </div>
                </div>
                
                {/* Progress percentage labels */}
                <div className="absolute top-4 right-4 bg-white/90 rounded-lg px-3 py-1 shadow-md">
                  <span className="text-sm font-bold text-[#8B7355]">{Math.round(Math.min(todayCarbs / 300, 1) * 100)}%</span>
                </div>
                <div className="absolute top-16 right-16 bg-white/90 rounded-lg px-3 py-1 shadow-md">
                  <span className="text-sm font-bold text-[#D4A574]">{Math.round(Math.min(todayInsulin / 50, 1) * 100)}%</span>
                </div>
              </div>
              
              {/* Enhanced Legend */}
              <div className="flex flex-col sm:flex-row gap-8 justify-center">
                <div className="flex items-center gap-3 bg-white/60 rounded-xl px-6 py-3 shadow-md">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5D54] shadow-sm"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5D54] animate-ping opacity-20"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Carbohydrates</p>
                    <p className="text-lg font-bold text-[#8B7355]">{todayCarbs}g / 300g</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/60 rounded-xl px-6 py-3 shadow-md">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A574] to-[#C19A6B] shadow-sm"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4A574] to-[#C19A6B] animate-ping opacity-20"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Insulin Units</p>
                    <p className="text-lg font-bold text-[#D4A574]">{todayInsulin.toFixed(1)}u / 50u</p>
                  </div>
                </div>
              </div>
              
              {/* Login prompt for non-authenticated users */}
              {!currentUser && (
                <div className="mt-6 text-center">
                  <p className="text-gray-600 mb-3">Track your health progress</p>
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={() => navigate('/login')} 
                      className="px-5 py-2 bg-[#8B7355] text-white rounded-lg font-medium hover:bg-[#A68A64] transition-all shadow-sm"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => navigate('/register')} 
                      className="px-5 py-2 bg-white text-[#8B7355] border border-[#8B7355] rounded-lg font-medium hover:bg-[#8B7355] hover:text-white transition-all"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Posts Section */}
          <div id="posts-section" className="pt-8 pb-12">
            <div className="max-w-4xl mx-auto">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-sm border border-[#8B7355]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#8B7355] mb-1">Community Posts</h2>
                    <p className="text-sm text-gray-600">Share your journey, inspire others</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => fetchPosts()} 
                      className="group p-3 bg-white hover:bg-[#8B7355]/5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Refresh posts"
                    >
                      <svg className="w-5 h-5 text-[#8B7355] group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    {currentUser && (
                      <button 
                        onClick={() => navigate('/create-post')} 
                        className="group px-5 py-3 bg-gradient-to-r from-[#8B7355] to-[#A68A64] hover:shadow-lg text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
                        title="Create new post"
                      >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Create Post</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6">
                  <Alert severity="error" onClose={() => setError('')}>
                    {error}
                  </Alert>
                </div>
              )}

              {/* Posts Container */}
              <div className="space-y-6">
                <PostList
                  posts={posts}
                  currentUserId={currentUser?.id}
                  onLike={handleLike}
                  onComment={handleComment}
                  isLoading={loading}
                  error={error}
                  emptyMessage="No posts yet. Be the first to share!"
                  showEditControls={false}
                />
              </div>
            </div>
          </div>

          {/* Floating Action Button */}
          {currentUser && (
            <button
              onClick={() => navigate('/create-post')}
              className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#8B7355] to-[#BCA17F] hover:opacity-90 text-white flex items-center justify-center shadow-lg transition-opacity"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;