import React, { useState, useEffect, useRef } from 'react';
import { MdEdit, MdEmail, MdPerson, MdImageNotSupported } from 'react-icons/md';
import { GiKnifeFork } from 'react-icons/gi';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { userService } from '../services/userService';
import postService, { Post as PostType } from '../services/postService';
import userSettings from '../utils/userSettings';
import Post from '../components/Post';

interface UserData {
  username: string;
  email: string;
  profileImage: string;
  id: string;
  icrRatio?: number;
}

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    username: '',
    email: '',
    profileImage: '',
    id: '',
    icrRatio: 10 // Default value
  });

  const [{ error, isUpdating, imageError }, setStatus] = useState({
    error: '',
    isUpdating: false,
    imageError: false
  });

  const [posts, setPosts] = useState<PostType[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [icrUpdating, setIcrUpdating] = useState(false);
  const [icrSuccess, setIcrSuccess] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const postsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = userService.getUserFromStorage();
    
    // Make sure we have the ICR ratio from userSettings
    const icrRatio = userSettings.getUserIcrRatio();
    setUserData({
      ...user,
      icrRatio
    });
  }, []);

  useEffect(() => {
    if (userData.id) {
      fetchUserPosts();
    }
  }, [userData.id]);

  // Check if scroll is possible
  const checkScrollability = () => {
    const container = postsContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 5
      );
    }
  };

  // Handler for scrolling left/right
  const scroll = (direction: 'left' | 'right') => {
    const container = postsContainerRef.current;
    if (container) {
      const scrollAmount = 350; // Width of post card
      const newPosition =
        direction === 'left'
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      
      // Update scroll position after animation
      setTimeout(() => {
        setScrollPosition(container.scrollLeft);
        checkScrollability();
      }, 300);
    }
  };
  
  useEffect(() => {
    // Initialize scroll check
    checkScrollability();
    
    // Add scroll event listener
    const container = postsContainerRef.current;
    if (container) {
      const handleScroll = () => {
        setScrollPosition(container.scrollLeft);
        checkScrollability();
      };
      
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [posts]);

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const userPosts = await postService.getUserPosts(userData.id);
      setPosts(userPosts);
      console.log(userPosts);
    } catch (error: any) {
      setPostsError(error.message || 'Failed to fetch posts.');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await postService.likePost(postId);
      fetchUserPosts();
    } catch (err: any) {
      setPostsError(err.message || 'Failed to like post');
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      await postService.addComment(postId, content);
      fetchUserPosts();
    } catch (err: any) {
      setPostsError(err.message || 'Failed to add comment');
    }
  };

  const updateIcrRatio = async (newRatio: number) => {
    try {
      setIcrUpdating(true);
      setIcrSuccess(false);
      
      // Update in localStorage first
      const updated = userSettings.updateUserIcrRatio(newRatio);
      
      if (!updated) {
        throw new Error('Failed to update ICR ratio');
      }
      
      // Update in database via API
      await fetch(`http://localhost:5000/api/users/${userData.id}/icr-ratio`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ icrRatio: newRatio })
      });
      
      setIcrSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setIcrSuccess(false);
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update ICR ratio');
    } finally {
      setIcrUpdating(false);
    }
  };

  const handleIcrSave = () => {
    if (userData.icrRatio) {
      updateIcrRatio(userData.icrRatio);
    }
  };

  const handleUpdate = async (postId: string, newContent: string, healthMetrics?: PostType['healthMetrics']) => {
    try {
      await postService.updatePost(postId, newContent, healthMetrics);
      fetchUserPosts();
    } catch (err: any) {
      setPostsError(err.message || 'Failed to update post');
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      fetchUserPosts();
    } catch (err: any) {
      setPostsError(err.message || 'Failed to delete post');
    }
  };

  const updateProfileImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setStatus(s => ({ ...s, error: 'Image size must be less than 5MB' }));
      return;
    }

    setStatus(s => ({ ...s, error: '', isUpdating: true }));
    
    try {
      const base64String = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const data = await userService.updateProfileImage(userData.id, base64String);
      const updatedUserData = { ...userData, profileImage: data.profileImage };
      
      setUserData(updatedUserData);
      userService.updateUserStorage(updatedUserData);
      setStatus(s => ({ ...s, imageError: false }));
    } catch (err) {
      setStatus(s => ({ 
        ...s, 
        error: err instanceof Error ? err.message : 'Failed to update profile image' 
      }));
    } finally {
      setStatus(s => ({ ...s, isUpdating: false }));
    }
  };

  if (!userData.username && !userData.email) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4]">
        <div className="bg-white/90 p-6 rounded-xl shadow-lg text-center">
          <MdPerson className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No user data found. Please log in again.</p>
        </div>
      </div>
    );
  }

  const ProfileCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ComponentType }) => (
    <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-white/20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#8B7355]/10 rounded-lg">
          <Icon className="w-5 h-5 text-[#8B7355]" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="font-medium text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4] p-6">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[length:40px_40px]" />
      
      <div className="w-full flex flex-col items-center">
        {/* Profile Card Section */}
        <div className="w-full max-w-xl relative">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2">
                <div className="flex-shrink-0 w-1 h-full bg-red-500 rounded-full" />
                {error}
              </div>
            )}
            
            <div className="relative w-32 h-32 mx-auto mb-8">
              {imageError ? (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <MdImageNotSupported className="w-12 h-12 text-gray-400" />
                </div>
              ) : (
                <img
                  src={userData.profileImage || '/api/placeholder/150/150'}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-[#8B7355]/20"
                  onError={() => setStatus(s => ({ ...s, imageError: true }))}
                />
              )}
              <label
                htmlFor="image-upload"
                className={`absolute bottom-2 right-2 p-2.5 bg-white rounded-full shadow-lg cursor-pointer 
                  hover:bg-gray-50 transition-all duration-200 border border-gray-100 group
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <MdEdit className="w-5 h-5 text-[#8B7355] group-hover:scale-110 transition-transform" />
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && updateProfileImage(e.target.files[0])}
                  disabled={isUpdating}
                />
              </label>
              {isUpdating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#8B7355] mb-1">{userData.username}</h2>
              <p className="text-gray-500 text-sm">Member since 2024</p>
            </div>

            <div className="space-y-4">
              <ProfileCard title="Username" value={userData.username} icon={MdPerson} />
              <ProfileCard title="Email" value={userData.email} icon={MdEmail} />
              
              {/* ICR Ratio Setting */}
              <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#8B7355]/10 rounded-lg">
                    <GiKnifeFork className="w-5 h-5 text-[#8B7355]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Insulin-to-Carb Ratio (ICR)</p>
                    <p className="font-medium text-gray-800">1:{userData.icrRatio}</p>
                  </div>
                  <button
                    onClick={handleIcrSave}
                    disabled={icrUpdating}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#8B7355] to-[#A68A64] text-white rounded-lg text-sm font-medium hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {icrUpdating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : 'Save'}
                  </button>
                </div>
                
                {icrSuccess && (
                  <div className="mb-3 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ICR ratio updated successfully
                  </div>
                )}
                
                <div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={userData.icrRatio}
                    onChange={(e) => {
                      const newRatio = parseInt(e.target.value);
                      setUserData({...userData, icrRatio: newRatio});
                    }}
                    className="w-full h-2 bg-[#D4C5B9] rounded-lg appearance-none cursor-pointer accent-[#8B7355]"
                  />
                  <div className="flex justify-between text-xs text-[#8B7355]/70 mt-1">
                    <span>1:1</span>
                    <span>1:15</span>
                    <span>1:30</span>
                  </div>
                  <p className="text-xs text-[#8B7355]/70 mt-2">
                    This determines how many grams of carbohydrates one unit of insulin covers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section - Full Width */}
        <div className="mt-8 w-full">
          <h2 className="text-2xl font-bold text-[#8B7355] mb-4 text-center">My Posts</h2>
          {postsLoading ? (
            <div className="text-center p-4 bg-white/90 rounded-xl">
              <div className="animate-spin w-8 h-8 border-4 border-[#8B7355] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : postsError ? (
            <div className="text-center text-red-500 p-4 bg-white/90 rounded-xl">{postsError}</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-500 p-4 bg-white/90 rounded-xl">No posts to display.</div>
          ) : (
            <div className="relative w-full max-w-6xl mx-auto px-4">
              {/* Left scroll button */}
              {canScrollLeft && (
                <button 
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-[#8B7355]" />
                </button>
              )}
              
              {/* Right scroll button */}
              {canScrollRight && (
                <button 
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5 text-[#8B7355]" />
                </button>
              )}
              
              {/* Posts container */}
              <div 
                ref={postsContainerRef}
                className="pb-4 overflow-x-auto scrollbar-hide"
                style={{
                  msOverflowStyle: 'none',  /* IE/Edge */
                  scrollbarWidth: 'none'    /* Firefox */
                }}
              >
                {/* Scroll shadow effects */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#F5F5DC] to-transparent pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F5F5DC] to-transparent pointer-events-none"></div>
                
                <div className="flex gap-6 min-w-max pb-2 px-2">
                  {posts.map((post) => (
                    <div key={post._id} className="w-[350px] flex-shrink-0">
                      <Post
                        id={post._id}
                        userId={post.userId._id}
                        username={post.userId.username}
                        timestamp={new Date(post.createdAt).toLocaleString()}
                        content={post.content}
                        image={post.image}
                        healthMetrics={post.healthMetrics}
                        likes={post.likes.length}
                        comments={post.comments}
                        onLike={() => handleLike(post._id)}
                        onComment={(content: string) => handleComment(post._id, content)}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        isLiked={post.likes.includes(userData.id)}
                        profileImage={post.userId.profileImage}
                        canEdit={true}
                        navigationEnabled={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Scroll position indicator */}
              {posts.length > 1 && (
                <div className="flex justify-center mt-2 gap-1.5">
                  {Array.from({ length: Math.ceil(posts.length / 1.5) }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full transition-colors ${scrollPosition / 350 > i - 0.5 && scrollPosition / 350 < i + 0.5 ? 'bg-[#8B7355]' : 'bg-[#8B7355]/30'}`} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;