import React, { useState, useEffect } from 'react';
import Post from '../components/Post';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../services/authService';
import postService from '../services/postService';
import UserProfile from '../components/UserProfile';
import { MdGridView, MdOutlineErrorOutline } from 'react-icons/md';

interface PostType {
  _id: string;
  userId: {
    _id: string;
    username: string;
    profileImage: string;
  };
  createdAt: string;
  content: string;
  image?: string;
  likes: string[];
  comments: any[]; // Update with proper comment type if available
}

interface Params {
  userId: string;
}

const UserPosts: React.FC = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [userInfo, setUserInfo] = useState<{
    userId: string;
    username: string;
    postsCount: number;
    profileImage?: string;
  } | null>(null);

  const navigate = useNavigate();
  const { userId } = useParams<Params>();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchUserPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserPosts = async () => {
    try {
      const fetchedPosts: PostType[] = await postService.getUserPosts(userId as string);
      setPosts(fetchedPosts);
      console.log(fetchedPosts);
      if (fetchedPosts.length > 0) {
        setUserInfo({
          userId: fetchedPosts[0].userId._id,
          username: fetchedPosts[0].userId.username,
          postsCount: fetchedPosts.length,
          profileImage: fetchedPosts[0].userId.profileImage,
        });
      } else {
        setUserInfo({
          userId: userId as string,
          username: 'User',
          postsCount: 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (userInfo?.userId === currentUser.id) {
      console.log('Cannot message yourself');
      return;
    }
    navigate('/messages', {
      state: {
        activeChat: userInfo?.userId,
        chatUser: {
          userId: userInfo?.userId,
          username: userInfo?.username,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4] flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#8B7355] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4] py-12">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#8B7355_1px,transparent_0)] bg-[length:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#8B7355_1px,transparent_0)] bg-[length:40px_40px] rotate-45 opacity-50" />
      </div>

      <div className="max-w-2xl mx-auto px-4 relative z-10">
        {userInfo && (
          <UserProfile 
            userInfo={userInfo} 
            currentUser={currentUser} 
            handleMessage={handleMessage} 
          />
        )}
      
        {error ? (
          <div className="mb-8 p-6 bg-red-50 rounded-2xl text-red-700 flex items-center gap-3">
            <MdOutlineErrorOutline className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <>
            {posts.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-[#8B7355]">
                    <MdGridView className="w-5 h-5" />
                    <h2 className="text-lg font-semibold">Posts</h2>
                  </div>
                  <span className="text-sm text-gray-500">
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                  </span>
                </div>

                {posts.map((post) => (
                  <Post
                    key={post._id}
                    id={post._id}
                    username={post.userId.username}
                    timestamp={new Date(post.createdAt).toLocaleString()}
                    content={post.content}
                    image={post.image}
                    profileImage={post.userId.profileImage}
                    likes={post.likes.length}
                    comments={post.comments.length}
                    onLike={() => {
                      /* handle like action */
                    }}
                    onComment={(content: string) => {
                      /* handle comment action */
                    }}
                    isLiked={post.likes.includes(currentUser?.id || '')}
                    navigationEnabled={false}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center">
                <MdGridView className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No posts yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserPosts;