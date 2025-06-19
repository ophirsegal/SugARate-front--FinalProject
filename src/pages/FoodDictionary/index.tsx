import { useState, useEffect, useMemo } from 'react';
import { MdFoodBank, MdSearch, MdFilterList, MdOutlineSortByAlpha, MdInfo } from 'react-icons/md';
import { TbSortAscendingNumbers, TbSortDescendingNumbers } from 'react-icons/tb';
import { GiKnifeFork } from 'react-icons/gi';
import { FaFire } from 'react-icons/fa';
import foodDictionaryService, { FoodItem } from '../../services/foodDictionaryService';
import FoodDetailsModal from './FoodDetailsModal';
import './FoodDictionary.css';

const FoodDictionary = () => {
  // State for search, filter, and sort functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [foodData, setFoodData] = useState<FoodItem[]>([]);
  const [sortType, setSortType] = useState<'alphabetical' | 'carbs-asc' | 'carbs-desc' | 'calories-asc' | 'calories-desc'>('alphabetical');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Load data from service
  useEffect(() => {
    setFoodData(foodDictionaryService.getAllFoods());
  }, []);

  // Get unique categories from service
  const categories = useMemo(() => {
    return foodDictionaryService.getCategories();
  }, []);

  // Filter and sort food items based on search query, selected category, and sort type
  const filteredFoodItems = useMemo(() => {
    // First filter the items
    const filtered = foodDictionaryService.searchFoodsByCategory(searchQuery, selectedCategory);
    
    // Then sort based on the selected sort type
    switch (sortType) {
      case 'alphabetical':
        return [...filtered].sort((a, b) => a.Food.localeCompare(b.Food));
      case 'carbs-asc':
        return [...filtered].sort((a, b) => a.Carbohydrates_per_100g - b.Carbohydrates_per_100g);
      case 'carbs-desc':
        return [...filtered].sort((a, b) => b.Carbohydrates_per_100g - a.Carbohydrates_per_100g);
      case 'calories-asc':
        return [...filtered].sort((a, b) => a.Calories_per_100g - b.Calories_per_100g);
      case 'calories-desc':
        return [...filtered].sort((a, b) => b.Calories_per_100g - a.Calories_per_100g);
      default:
        return filtered;
    }
  }, [foodData, searchQuery, selectedCategory, sortType]);

  // Group food items by category for display
  const groupedFoodItems = useMemo(() => {
    const grouped: Record<string, FoodItem[]> = {};
    
    filteredFoodItems.forEach((item) => {
      if (!grouped[item.Category]) {
        grouped[item.Category] = [];
      }
      grouped[item.Category].push(item);
    });
    
    // Sort categories alphabetically
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFoodItems]);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4]">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#8B7355_1px,transparent_0)] bg-[length:40px_40px]" />
      
      <div className="flex-grow flex flex-col max-w-4xl w-full mx-auto p-4 relative">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-4 text-center border border-[#8B7355]/10">
          <h1 className="text-2xl font-bold text-[#8B7355] mb-1">Food Nutrition Dictionary</h1>
          <p className="text-[#8B7355]/80 text-sm">Browse foods with carbohydrate and calorie values</p>
        </div>

        {/* Search, filter, and sort controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-4 mb-4 border border-[#8B7355]/10">
          <div className="flex flex-col gap-3">
            {/* Search input */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdSearch className="h-5 w-5 text-[#8B7355]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search foods..."
                className="w-full pl-10 pr-4 py-2 bg-[#8B7355]/5 border border-[#8B7355]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355] placeholder-[#8B7355]/50"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              {/* Category filter */}
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdFilterList className="h-5 w-5 text-[#8B7355]" />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-[#8B7355]/5 border border-[#8B7355]/10 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#8B7355] text-[#8B7355]"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-[#8B7355]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Sort controls */}
              <div className="flex">
                <button
                  onClick={() => setSortType('alphabetical')}
                  className={`px-3 py-2 rounded-l-xl border border-r-0 ${sortType === 'alphabetical' 
                    ? 'bg-[#8B7355] text-white border-[#8B7355]' 
                    : 'bg-[#8B7355]/5 text-[#8B7355] border-[#8B7355]/10 hover:bg-[#8B7355]/10'}`}
                  title="Sort alphabetically"
                >
                  <MdOutlineSortByAlpha className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSortType('carbs-asc')}
                  className={`px-3 py-2 border border-r-0 ${sortType === 'carbs-asc' 
                    ? 'bg-[#8B7355] text-white border-[#8B7355]' 
                    : 'bg-[#8B7355]/5 text-[#8B7355] border-[#8B7355]/10 hover:bg-[#8B7355]/10'}`}
                  title="Sort by carbs (low to high)"
                >
                  <TbSortAscendingNumbers className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSortType('carbs-desc')}
                  className={`px-3 py-2 rounded-r-xl border ${sortType === 'carbs-desc' 
                    ? 'bg-[#8B7355] text-white border-[#8B7355]' 
                    : 'bg-[#8B7355]/5 text-[#8B7355] border-[#8B7355]/10 hover:bg-[#8B7355]/10'}`}
                  title="Sort by carbs (high to low)"
                >
                  <TbSortDescendingNumbers className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Food items listing */}
        <div className="flex-grow bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-4 border border-[#8B7355]/10 overflow-hidden">
          <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#8B7355]/20 scrollbar-track-transparent">
            {filteredFoodItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[#8B7355]/70">
                <MdFoodBank className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center">No foods match your search criteria</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedFoodItems.map(([category, foods]) => (
                  <div key={category} className="space-y-2">
                    <h2 className="text-lg font-semibold text-[#8B7355] border-b border-[#8B7355]/20 pb-1">
                      {category}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {foods.map((food) => (
                        <div
                          key={`${food.Category}-${food.Food}`}
                          className="bg-[#8B7355]/5 hover:bg-[#8B7355]/10 rounded-xl p-3 transition-colors flex justify-between items-center cursor-pointer"
                          onClick={() => {
                            setSelectedFood(food);
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="flex items-center">
                            <span className="text-[#8B7355]">{food.Food}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="flex flex-col items-end mr-4">
                              <div className="text-[#8B7355] font-semibold flex items-center">
                                <GiKnifeFork className="w-3 h-3 mr-1" />
                                {food.Carbohydrates_per_100g}g
                              </div>
                              <div className="text-[#8B7355] font-semibold flex items-center">
                                <FaFire className="w-3 h-3 mr-1" />
                                {food.Calories_per_100g} kcal
                              </div>
                            </div>
                            <div className="flex">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFood(food);
                                  setIsModalOpen(true);
                                }}
                                className="ml-2 p-2 bg-[#8B7355]/10 hover:bg-[#8B7355]/20 text-[#8B7355] rounded-full transition-colors"
                                title="View details"
                              >
                                <MdInfo className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with count information */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-3 text-center border border-[#8B7355]/10 text-[#8B7355]/80 text-sm">
          Showing {filteredFoodItems.length} of {foodData.length} foods
        </div>

        {/* Food Details Modal */}
        <FoodDetailsModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          food={selectedFood} 
        />
      </div>
    </div>
  );
};

export default FoodDictionary;