import carbohydratesData from '../../../carbohydrates_data_en.json';

export interface FoodItem {
  Category: string;
  Food: string;
  Carbohydrates_per_100g: number;
}

class FoodDictionaryService {
  private foodData: FoodItem[];

  constructor() {
    this.foodData = carbohydratesData as FoodItem[];
  }

  /**
   * Get all food items
   */
  getAllFoods(): FoodItem[] {
    return this.foodData;
  }

  /**
   * Get unique categories from the food data
   */
  getCategories(): string[] {
    const uniqueCategories = new Set(this.foodData.map(item => item.Category));
    return Array.from(uniqueCategories).sort();
  }

  /**
   * Search food items by category and query
   */
  searchFoodsByCategory(query: string, category: string): FoodItem[] {
    let filteredFoods = this.foodData;
    
    if (category) {
      filteredFoods = filteredFoods.filter(item => item.Category === category);
    }
    
    if (query) {
      const normalizedQuery = query.toLowerCase();
      filteredFoods = filteredFoods.filter(item => 
        item.Food.toLowerCase().includes(normalizedQuery)
      );
    }
    
    return filteredFoods;
  }
}

// Export a singleton instance
const foodDictionaryService = new FoodDictionaryService();
export default foodDictionaryService;