import { useState, useEffect } from 'react';
import { MdOutlineCalendarToday, MdOutlineBarChart, MdLocationOn } from 'react-icons/md';
import { FaSyringe } from 'react-icons/fa';
import { GiSlicedBread } from 'react-icons/gi';
import { IoMdAdd } from 'react-icons/io';
import { CgSpinner } from 'react-icons/cg';
import postService, { Post } from '../../services/postService';
import authService from '../../services/authService';
import './DailyCalendar.css';
import { userService } from '../../services/userService';

// Helper type for carb tracking by hour
interface HourlyCarb {
  hour: number;
  carbAmount: number;
}

const DailyCalendar = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hourlyLog, setHourlyLog] = useState<HourlyCarb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get the current user's posts
        const fetchedPosts = await postService.getUserPosts(userService.getUserFromStorage().id);
        
        // Filter posts to only include those from today with meal carbs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysPosts = fetchedPosts.filter(post => {
          const postDate = new Date(post.createdAt);
          return postDate >= today && post.healthMetrics?.mealCarbs;
        });

        // Sort posts by time (oldest first)
        todaysPosts.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });

        setPosts(todaysPosts);

        // Generate hourly carb log
        const hourlyData = generateHourlyLog(todaysPosts);
        setHourlyLog(hourlyData);
      } catch (err) {
        console.error('[DailyCalendar] Error fetching posts:', err);
        setError('Failed to load your meal data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Generate hourly carb data from posts
  const generateHourlyLog = (posts: Post[]): HourlyCarb[] => {
    // Initialize array for all 24 hours
    const hourlyData: HourlyCarb[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      carbAmount: 0
    }));

    // Sum up carbs for each hour
    posts.forEach(post => {
      if (post.healthMetrics?.mealCarbs) {
        const postDate = new Date(post.createdAt);
        const hour = postDate.getHours();
        hourlyData[hour].carbAmount += post.healthMetrics.mealCarbs;
      }
    });

    return hourlyData;
  };

  // Find the maximum carb amount for scaling the chart
  const maxCarbAmount = Math.max(...hourlyLog.map(entry => entry.carbAmount), 1);
  
  // Format date as "Monday, April 29"
  const formattedDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  // Calculate total carbs for the day
  const totalDailyCarbs = hourlyLog.reduce((sum, entry) => sum + entry.carbAmount, 0);
  
  // Calculate total insulin for the day
  const totalDailyInsulin = posts.reduce((sum, post) => sum + (post.healthMetrics?.insulinUnits || 0), 0);

  // Format time helper function for meal cards
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Helper function to calculate time period label
  const getTimePeriod = (dateString: string): string => {
    const date = new Date(dateString);
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 14) return 'Noon';
    if (hour >= 14 && hour < 18) return 'Afternoon';
    if (hour >= 18 && hour < 22) return 'Evening';
    return 'Night';
  };

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4] overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#8B7355_1px,transparent_0)] bg-[length:40px_40px]" />
      
      <div className="flex-grow flex flex-col max-w-4xl w-full mx-auto p-4 relative overflow-hidden">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-md p-6 mb-4 text-center border border-gray-100">
          <h1 className="text-2xl font-bold text-[#8B7355] mb-2">Daily Nutrition Tracker</h1>
          <div className="flex items-center justify-center gap-2 text-[#8B7355]/80">
            <MdOutlineCalendarToday className="text-lg" />
            <p className="text-base font-medium">{formattedDate}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-grow bg-white/90 backdrop-blur-sm rounded-3xl shadow-md flex items-center justify-center border border-gray-100">
            <div className="flex items-center gap-3 text-[#8B7355]">
              <CgSpinner className="w-6 h-6 animate-spin" />
              <span className="font-medium">Loading your data...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-grow bg-white/90 backdrop-blur-sm rounded-3xl shadow-md p-6 flex items-center justify-center border border-gray-100">
            <div className="text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-5 py-2 bg-gradient-to-r from-[#8B7355] to-[#A68A64] text-white rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Daily Summary - Top Cards */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-md p-5 border border-gray-100 transition-all hover:shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B7355]/20 to-[#A68A64]/20 flex items-center justify-center">
                    <GiSlicedBread className="w-5 h-5 text-[#8B7355]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#8B7355]/70">Total Carbs Today</h3>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-[#8B7355]">{totalDailyCarbs}</span>
                      <span className="text-sm font-medium text-[#8B7355]/80 mb-0.5">grams</span>
                    </div>
                  </div>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#8B7355] to-[#A68A64] rounded-full" 
                    style={{ width: `${Math.min(100, (totalDailyCarbs / 200) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-md p-5 border border-gray-100 transition-all hover:shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B7355]/20 to-[#A68A64]/20 flex items-center justify-center">
                    <FaSyringe className="w-4 h-4 text-[#8B7355]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#8B7355]/70">Total Insulin Today</h3>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-[#8B7355]">{totalDailyInsulin.toFixed(1)}</span>
                      <span className="text-sm font-medium text-[#8B7355]/80 mb-0.5">units</span>
                    </div>
                  </div>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#8B7355] to-[#A68A64] rounded-full" 
                    style={{ width: `${Math.min(100, (totalDailyInsulin / 30) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Carb Intake Graph */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-md p-6 mb-4 border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-[#8B7355] flex items-center gap-2">
                  <MdOutlineBarChart className="text-xl" />
                  <span>Carbohydrate Intake</span>
                </h2>
                <div className="bg-[#8B7355]/10 text-[#8B7355] text-xs font-medium px-3 py-1 rounded-full">
                  Today
                </div>
              </div>
              
              {/* Graph visualization */}
              <div className="mt-8 relative pl-12 pr-4 pb-10">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-10 w-10 h-[220px]">
                  {[maxCarbAmount, Math.round(maxCarbAmount * 0.75), Math.round(maxCarbAmount * 0.5), 
                    Math.round(maxCarbAmount * 0.25), 0].map((value, i) => (
                    <div key={i} className="text-xs text-[#8B7355]/80 font-medium absolute right-2"
                         style={{ top: `${i * (220 / 4)}px`, transform: 'translateY(-50%)' }}>
                      {value}g
                    </div>
                  ))}
                </div>
                
                {/* Y-axis grid lines */}
                <div className="absolute left-12 top-0 bottom-10 right-4 h-[220px]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-b border-gray-100 absolute w-full" 
                         style={{ top: `${i * (220 / 4)}px` }} />
                  ))}
                </div>

                {/* Bars container */}
                <div className="flex h-[220px] items-end mb-2 relative border-b border-gray-200">
                  {hourlyLog.map((entry) => (
                    <div 
                      key={entry.hour} 
                      className="flex-1 flex flex-col items-center px-0.5"
                      title={`${entry.hour}:00 - ${entry.carbAmount}g`}
                    >
                      <div 
                        className={`w-full relative group cursor-pointer ${
                          entry.carbAmount > 0 
                            ? 'bg-gradient-to-b from-[#8B7355] to-[#A68A64]'
                            : 'bg-gray-200'
                        } rounded-t transition-all duration-300 hover:opacity-90`}
                        style={{ 
                          height: entry.carbAmount === 0 
                            ? '2px' 
                            : `${Math.max(4, (entry.carbAmount / maxCarbAmount) * 220)}px`
                        }}
                      >
                        {entry.carbAmount > 0 && (
                          <>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#8B7355] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {entry.carbAmount}g
                            </div>
                            <div className="absolute w-2 h-2 rounded-full bg-white left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-xs font-medium pt-2 text-[#8B7355]/80">
                  <div>12am</div>
                  <div>6am</div>
                  <div>12pm</div>
                  <div>6pm</div>
                  <div>11pm</div>
                </div>
                
                {/* X-axis title */}
                <div className="text-center text-xs font-medium text-[#8B7355]/60 mt-2">
                  Time of Day
                </div>
              </div>
            </div>

            {/* Today's Meals List - Horizontal */}
            <div className="flex-grow bg-white/90 backdrop-blur-sm rounded-3xl shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-[#8B7355]">Today's Meals</h2>
                <button 
                  onClick={() => window.location.href = '/create-post'}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-[#8B7355] to-[#A68A64] text-white rounded-full hover:shadow-md transition-all"
                >
                  <IoMdAdd className="text-lg" />
                  <span>Add Meal</span>
                </button>
              </div>
              
              {posts.length === 0 ? (
                <div className="bg-[#8B7355]/5 rounded-xl py-10 px-6 text-center">
                  <GiSlicedBread className="w-10 h-10 mx-auto text-[#8B7355]/40 mb-3" />
                  <p className="text-[#8B7355]/80 font-medium">No meals logged today</p>
                  <p className="text-sm mt-2 text-[#8B7355]/60 max-w-xs mx-auto">
                    Create a post with meal details to track your carbohydrate intake
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2 relative">
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                  <div className="flex gap-4" style={{ minWidth: 'max-content', paddingRight: '8px' }}>
                    {posts.map((post) => (
                      <div 
                        key={post._id} 
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all meal-card flex flex-col" 
                        style={{ width: '280px', minWidth: '280px' }}
                      >
                        
                        {/* Time and Metrics */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="bg-[#8B7355]/10 px-3 py-1 rounded-full text-xs text-[#8B7355] font-medium">
                            {formatTime(post.createdAt)}
                          </div>
                          <div className="flex gap-1.5">
                            {post.healthMetrics?.insulinUnits && (
                              <div className="bg-gradient-to-r from-[#8B7355]/10 to-[#A68A64]/10 px-2 py-1 rounded-full text-xs font-semibold text-[#8B7355] flex items-center">
                                <FaSyringe className="mr-1 text-[9px]" />
                                {post.healthMetrics.insulinUnits}
                              </div>
                            )}
                            {post.healthMetrics?.mealCarbs && (
                              <div className="bg-gradient-to-r from-[#8B7355]/10 to-[#A68A64]/10 px-2 py-1 rounded-full text-xs font-semibold text-[#8B7355] flex items-center">
                                <GiSlicedBread className="mr-1" />
                                {post.healthMetrics.mealCarbs}g
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Location */}
                        {post.healthMetrics?.location && (
                          <div className="flex items-center gap-1 text-xs text-[#8B7355]/70 mb-2">
                            <MdLocationOn className="text-[#8B7355]" />
                            <span>{post.healthMetrics.location}</span>
                          </div>
                        )}
                        
                        {/* Image */}
                        {post.image && (
                          <div className="mb-3 flex-shrink-0">
                            <img 
                              src={post.image} 
                              alt="Meal" 
                              className="rounded-lg w-full h-40 object-cover shadow-sm border border-gray-100" 
                            />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="text-sm text-gray-700 flex-grow overflow-hidden overflow-ellipsis" style={{ maxHeight: post.image ? '80px' : '120px' }}>
                          <p>{post.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyCalendar;