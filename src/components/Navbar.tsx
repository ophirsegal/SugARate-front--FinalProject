import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  PlusIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  Bars3Icon,
  XMarkIcon,
  CakeIcon,
  CameraIcon,
  BookOpenIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import chatService from '../services/chatService';

// Custom Tooltip component
const Tooltip = ({ children, title }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-sm px-2 py-1 rounded-md -bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800" />
        {title}
      </div>
    </div>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Debug: Log when the component mounts
  console.log("Navbar component mounted");

  // Fetch user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      console.log("No user data found in localStorage");
    }
  }, []);

  // Fetch chats to update unread message count
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (user) {
        try {
          const chats = await chatService.getUserChats(user.id);
          const totalUnread = chats.reduce((acc, chat) => {
            return acc + (chat.unreadCount || 0);
          }, 0);
          
          console.log("Total unread count:", totalUnread);
          setUnreadCount(totalUnread);
        } catch (error) {
          console.error('Error fetching chats:', error);
        }
      }
    };

    fetchUnreadMessages();

    // Optionally, refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadMessages, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const navigationItems = [
    { title: 'Home', icon: HomeIcon, path: '/home' },
    { title: 'Create Post', icon: PlusIcon, path: '/create-post' },
    { title: 'Messages', icon: ChatBubbleLeftIcon, path: '/messages' },
    { title: 'AI Chat', icon: ChatBubbleLeftEllipsisIcon, path: '/ai-chat' },
    { title: 'Nutrition AI', icon: CakeIcon, path: '/nutrition-ai' },
    { title: 'Food Image AI', icon: CameraIcon, path: '/food-image-ai' },
    { title: 'Food Dictionary', icon: BookOpenIcon, path: '/food-dictionary' },
    { title: 'Daily Calendar', icon: CalendarIcon, path: '/daily-calendar' },
   
   // { title: 'Profile', icon: UserIcon, path: '/profile' },
  ];

  const getInitial = (username) => {
    return username ? username[0].toUpperCase() : 'U';
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="flex justify-between items-center px-4 sm:px-8 py-3">
          {/* Logo */}
          <h1
            className="font-playfair font-bold text-[#8B7355] text-2xl sm:text-3xl cursor-pointer hover:text-[#6B5345] transition-colors duration-300"
            onClick={() => {
              console.log("Navigating to home");
              navigate('/home');
            }}
          >
            SugARate
          </h1>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Tooltip title="Profile">
              <button
                onClick={() => {
                  console.log("Toggling profile menu");
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="relative"
              >
                {user?.profileImage ? (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden">
                    <img 
                      src={user.profileImage} 
                      alt={user.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentElement.innerHTML = getInitial(user.username);
                        e.target.parentElement.className += ' bg-[#8B7355] flex items-center justify-center text-white';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#8B7355] hover:bg-[#6B5345] rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110">
                    {user ? getInitial(user.username) : 'U'}
                  </div>
                )}
              </button>
            </Tooltip>

            <button
              onClick={() => {
                console.log("Toggling drawer");
                setDrawerOpen(!drawerOpen);
              }}
              className="p-2 rounded-full hover:bg-[rgba(139,115,85,0.1)] transition-all duration-300 hover:scale-110"
            >
              {drawerOpen ? (
                <XMarkIcon className="w-6 h-6 text-[#8B7355]" />
              ) : (
                <Bars3Icon className="w-6 h-6 text-[#8B7355]" />
              )}
            </button>
          </div>

          {/* Profile Menu */}
          {showProfileMenu && (
            <div className="absolute right-4 top-16 w-48 bg-white rounded-lg shadow-lg py-1">
              <button
                onClick={() => {
                  console.log("Navigating to profile");
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 hover:bg-[rgba(139,115,85,0.1)] transition-all duration-300 hover:pl-6"
              >
                <UserIcon className="w-5 h-5 mr-2 text-[#8B7355]" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  console.log("Logging out and navigating to login");
                  navigate('/login');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 hover:bg-[rgba(139,115,85,0.1)] transition-all duration-300 hover:pl-6"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2 text-[#8B7355]" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16" />

      {/* Backdrop overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 sm:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer/Sidebar */}
      <div
        className={`fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-72 sm:w-80 bg-white shadow-lg transform ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out z-40 rounded-l-2xl`}
      >
        <div className="py-4">
          {navigationItems.map((item) => {
            return (
              <button
                key={item.title}
                onClick={() => {
                  console.log("Navigating to:", item.path);
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[rgba(139,115,85,0.1)] transition-all duration-300 hover:pl-6"
              >
                <div className="flex items-center">
                  <item.icon className="w-5 h-5 mr-4 text-[#8B7355]" />
                  <span className="text-sm sm:text-base">{item.title}</span>
                </div>
                {item.title === 'Messages' && unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ml-2">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;