// PostList.tsx
import React from 'react';
import { Post as PostType } from '../services/postService';
import Post from './Post';

interface PostListProps {
  posts: PostType[];
  currentUserId?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onUpdate?: (postId: string, content: string, healthMetrics?: PostType['healthMetrics']) => void;
  onDelete?: (postId: string) => void;
  showEditControls?: boolean;
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  currentUserId,
  onLike,
  onComment,
  onUpdate,
  onDelete,
  showEditControls = false,
  isLoading = false,
  error = '',
  emptyMessage = 'No posts to display.'
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#8B7355] border-t-transparent" />
          <div className="absolute inset-0 rounded-full h-12 w-12 border-3 border-[#8B7355] opacity-20" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto bg-red-50/80 backdrop-blur-sm text-red-700 p-6 rounded-2xl text-center shadow-sm border border-red-200/50">
        <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm p-12 text-center rounded-2xl shadow-sm border border-[#8B7355]/10">
        <div className="w-20 h-20 mx-auto mb-4 bg-[#8B7355]/10 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-[#8B7355]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium text-lg mb-2">{emptyMessage}</p>
        <p className="text-gray-500 text-sm">Start sharing your health journey with the community</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <div 
          key={post._id}
        >
          <Post
            id={post._id}
            userId={post.userId._id}
            username={post.userId.username}
            timestamp={post.createdAt}
            content={post.content}
            image={post.image}
            healthMetrics={post.healthMetrics}
            likes={post.likes.length}
            comments={post.comments}
            onLike={() => onLike(post._id)}
            onComment={(content: string) => onComment(post._id, content)}
            onUpdate={showEditControls ? onUpdate : undefined}
            onDelete={showEditControls ? onDelete : undefined}
            isLiked={post.likes.includes(currentUserId || '')}
            profileImage={post.userId.profileImage}
            canEdit={showEditControls}
          />
        </div>
      ))}
    </div>
  );
};

export default PostList;