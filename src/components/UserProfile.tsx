import React from 'react';

interface UserInfo {
  userId: string;
  username: string;
  postsCount: number;
  profileImage?: string;
}

interface UserProfileProps {
  userInfo: UserInfo;
  currentUser: {
    id: string;
  } | null;
  handleMessage: () => void;
}

const UserProfile = ({ userInfo, currentUser, handleMessage }: UserProfileProps) => {
  console.log(userInfo);
  
  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar with image or fallback */}
        <div className="relative group">
          {userInfo.profileImage ? (
            <img 
              src={userInfo.profileImage}
              alt={`${userInfo.username}'s profile`}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover ring-4 ring-[#8B7355]/10"
            />
          ) : (
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[#8B7355] to-[#735c44] text-white text-4xl 
              flex items-center justify-center shadow-inner">
              {userInfo.username[0].toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            {/* Username */}
            <h2 className="text-2xl font-bold text-gray-800">
              {userInfo.username}
            </h2>

            {/* Message Button */}
            {currentUser && currentUser.id !== userInfo.userId && (
              <button
                onClick={handleMessage}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#8B7355] hover:bg-[#735c44] 
                  text-white rounded-full transition-all duration-300 hover:shadow-md
                  transform hover:-translate-y-0.5"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                <span className="font-medium">Message</span>
              </button>
            )}
          </div>

          <div className="flex justify-center md:justify-start gap-8">
            <div className="bg-gray-50 px-6 py-3 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Posts</p>
              <h3 className="text-2xl font-bold text-[#8B7355]">{userInfo.postsCount}</h3>
            </div>
            {/* Add more stats here if needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;