import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartIcon as HeartOutline, ChatBubbleOvalLeftIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, MapPinIcon, BeakerIcon, CakeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

const UserHeader = ({ username, timestamp, profileImage, userId, canEdit, onEdit, onDelete, location, navigationEnabled = true }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user.id;
  
  const handleProfileClick = () => {
    if (navigationEnabled && userId !== currentUserId) {
      navigate(`/user-posts/${userId}`);
    }
  };
  
  // Format timestamp to be more readable
  const formatTimestamp = (timestamp) => {
    // Safely parse the timestamp string
    const date = new Date(timestamp);
    
    // Return placeholder text if date is invalid
    if (isNaN(date.getTime())) {
      return 'Just now';
    }
    
    // Always display full date and time
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return (
    <div className="flex items-center mb-3">
      <div 
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#8B7355] to-[#A68A64] text-white flex items-center justify-center mr-3
          ${(navigationEnabled && userId !== currentUserId) ? 'cursor-pointer hover:opacity-90 transition-all shadow-md hover:shadow-lg' : 'shadow-md'} text-base`}
        onClick={handleProfileClick}
        style={{ border: '2px solid rgba(255, 255, 255, 0.8)' }}
      >
        {profileImage ? 
          <img src={profileImage} alt={username} className="w-full h-full object-cover" /> 
          : <span className="text-xl font-medium">{username[0].toUpperCase()}</span>
        }
      </div>
      <div className="flex-grow">
        <h3 className={`font-semibold text-base ${(navigationEnabled && userId !== currentUserId) ? 'cursor-pointer hover:text-[#8B7355] group relative' : ''}`}
            onClick={(navigationEnabled && userId !== currentUserId) ? handleProfileClick : undefined}>
          {username}
          {(navigationEnabled && userId !== currentUserId) && (
            <span className="h-0.5 bg-[#8B7355] absolute bottom-0 left-0 w-0 group-hover:w-full transition-all duration-300"></span>
          )}
        </h3>
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <span>{formatTimestamp(timestamp)}</span>
          {location && (
            <>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5 text-[#8B7355]" />
                <span className="text-gray-600 text-xs">{location}</span>
              </div>
            </>
          )}
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-2">
          <button 
            onClick={onEdit}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            title="Edit post"
          >
            <PencilIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={onDelete}
            className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
            title="Delete post"
          >
            <TrashIcon className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
};

const HealthMetrics = ({ metrics }) => {
  if (!metrics || Object.keys(metrics).filter(key => metrics[key] !== undefined && key !== 'location').length === 0) return null;

  return (
    <div className="mb-3 bg-gradient-to-r from-[#8B7355]/10 to-[#A68A64]/5 rounded-lg p-3 border border-[#8B7355]/10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {metrics.insulinUnits !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-[#8B7355]/15 flex items-center justify-center">
              <BeakerIcon className="w-4 h-4 text-[#8B7355] flex-shrink-0" />
            </div>
            <span className="text-gray-700 font-medium whitespace-nowrap">{metrics.insulinUnits} units insulin</span>
          </div>
        )}
        {metrics.mealCarbs !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-[#8B7355]/15 flex items-center justify-center">
              <CakeIcon className="w-4 h-4 text-[#8B7355] flex-shrink-0" />
            </div>
            <span className="text-gray-700 font-medium whitespace-nowrap">{metrics.mealCarbs}g carbs</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Post: React.FC<PostProps> = ({ 
  id, userId, username, timestamp, content, likes, comments, image, profileImage, 
  healthMetrics, onLike, onComment, onUpdate, onDelete, isLiked, canEdit = false,
  navigationEnabled = true
}) => {
  const [state, setState] = useState({
    isLiked,
    likesCount: likes,
    showCommentInput: false,
    showComments: false,
    commentText: '',
    isEditing: false,
    editedContent: content,
    editedMetrics: healthMetrics || {}
  });

  const updateState = (updates: Partial<typeof state>) => setState(prev => ({ ...prev, ...updates }));

  const handleLikeClick = () => {
    updateState({ isLiked: !state.isLiked, likesCount: state.likesCount + (state.isLiked ? -1 : 1) });
    onLike();
  };

  const handleSaveEdit = () => {
    if (state.editedContent.trim() && onUpdate && id) {
      onUpdate(id, state.editedContent, state.editedMetrics);
      updateState({ isEditing: false });
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-[#8B7355]/10 relative overflow-hidden group">
      {/* Decorative element */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#8B7355]/5 to-[#A68A64]/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
      
      <UserHeader 
        username={username}
        timestamp={timestamp}
        profileImage={profileImage}
        userId={userId}
        canEdit={canEdit}
        onEdit={() => updateState({ isEditing: true })}
        onDelete={() => onDelete?.(id!)}
        location={healthMetrics?.location}
        navigationEnabled={navigationEnabled}
      />

      {state.isEditing ? (
        <div className="mb-3 space-y-3">
          <textarea
            value={state.editedContent}
            onChange={e => updateState({ editedContent: e.target.value })}
            className="w-full p-3 bg-[#8B7355]/5 border border-[#8B7355]/20 rounded-lg focus:ring-1 focus:ring-[#8B7355] focus:outline-none text-sm"
            rows={4}
          />
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px] relative">
              <MapPinIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
              <input
                type="text"
                placeholder="Location"
                value={state.editedMetrics?.location || ''}
                onChange={e => updateState({ 
                  editedMetrics: { ...state.editedMetrics, location: e.target.value }
                })}
                className="w-full pl-8 p-2 bg-white border border-[#8B7355]/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]"
              />
            </div>
            <div className="flex-1 min-w-[150px] relative">
              <BeakerIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
              <input
                type="number"
                placeholder="Insulin Units"
                value={state.editedMetrics?.insulinUnits || ''}
                onChange={e => updateState({ 
                  editedMetrics: { ...state.editedMetrics, insulinUnits: Number(e.target.value) }
                })}
                className="w-full pl-8 p-2 bg-white border border-[#8B7355]/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]"
                min="0"
                step="0.5"
              />
            </div>
            <div className="flex-1 min-w-[150px] relative">
              <CakeIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
              <input
                type="number"
                placeholder="Carbs (g)"
                value={state.editedMetrics?.mealCarbs || ''}
                onChange={e => updateState({ 
                  editedMetrics: { ...state.editedMetrics, mealCarbs: Number(e.target.value) }
                })}
                className="w-full pl-8 p-2 bg-white border border-[#8B7355]/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]"
                min="0"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSaveEdit} className="flex items-center gap-1.5 bg-gradient-to-r from-[#8B7355] to-[#A68A64] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:shadow-md transition-shadow">
              <CheckIcon className="w-3.5 h-3.5" /> Save
            </button>
            <button 
              onClick={() => updateState({ 
                isEditing: false, 
                editedContent: content,
                editedMetrics: healthMetrics || {}
              })}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <XMarkIcon className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap">{content}</p>
          <HealthMetrics metrics={healthMetrics} />
          {image && (
            <div className="mb-4 overflow-hidden rounded-lg shadow-sm border border-gray-100">
              <img 
                src={image} 
                alt="Post content" 
                className="w-full h-auto max-h-96 object-contain transform hover:scale-[1.01] transition-transform duration-200" 
              />
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-[#8B7355]/10">
        <button 
          onClick={handleLikeClick} 
          className={`group flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all duration-200 ${
            state.isLiked 
              ? 'bg-red-50 text-red-500' 
              : 'hover:bg-[#8B7355]/5 text-gray-600 hover:text-[#8B7355]'
          }`}
        >
          {state.isLiked ? 
            <HeartSolid className="w-5 h-5 text-red-500 animate-pulse" /> 
            : <HeartOutline className="w-5 h-5 group-hover:scale-110 transition-transform" />
          }
          <span className={`text-sm font-semibold ${state.isLiked ? 'text-red-500' : ''}`}>
            {state.likesCount}
          </span>
        </button>

        <button 
          onClick={() => updateState({ showCommentInput: !state.showCommentInput })} 
          className="group flex items-center gap-2 py-2.5 px-4 rounded-xl hover:bg-[#8B7355]/5 text-gray-600 hover:text-[#8B7355] transition-all duration-200"
        >
          <ChatBubbleOvalLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold">{comments.length}</span>
        </button>
      </div>

      {state.showCommentInput && (
        <div className="mt-4 border-t border-[#8B7355]/10 pt-4">
          <div className="relative">
            <input
              value={state.commentText}
              onChange={e => updateState({ commentText: e.target.value })}
              placeholder="Write a comment..."
              className="w-full p-3 pr-24 bg-[#8B7355]/5 border border-[#8B7355]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30 focus:border-transparent placeholder-gray-500 transition-all"
            />
            <button
              onClick={() => {
                if (state.commentText.trim()) {
                  onComment(state.commentText);
                  updateState({ commentText: '', showComments: true });
                }
              }}
              disabled={!state.commentText.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#8B7355] to-[#A68A64] text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all duration-200"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {comments.length > 0 && (
        <div className={`mt-4 ${state.showCommentInput ? '' : 'border-t border-[#8B7355]/10 pt-4'}`}>
          <button
            onClick={() => updateState({ showComments: !state.showComments })}
            className="flex items-center gap-2 text-gray-600 hover:text-[#8B7355] mb-3 group transition-colors duration-200"
          >
            {state.showComments ? 
              <ChevronUpIcon className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
              : <ChevronDownIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            }
            <span className="text-sm font-semibold">
              {state.showComments ? 'Hide Comments' : `Show ${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
            </span>
          </button>
          
          {state.showComments && (
            <div className="mt-3 space-y-3">
              {comments.map((comment, index) => (
                <div 
                  key={comment._id} 
                  className="bg-gradient-to-r from-[#8B7355]/5 to-[#A68A64]/5 p-4 rounded-xl border border-[#8B7355]/10"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B7355] to-[#A68A64] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                      {comment.userId.username[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-gray-800">{comment.userId.username}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(comment.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 pl-11 leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Post;