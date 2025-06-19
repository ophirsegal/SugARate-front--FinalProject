import React from 'react';
import { FoodItem } from '../../services/foodDictionaryService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GiKnifeFork } from 'react-icons/gi';
import { FaFire } from 'react-icons/fa';
import './FoodDictionary.css';

interface FoodDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: FoodItem | null;
}

// Simple calculation functions
const calculateSugarTeaspoons = (carbGrams: number): number => {
  const teaspoons = carbGrams / 4;
  return Math.round(teaspoons * 10) / 10; // Round to 1 decimal place
};

const calculateInsulinUnits = (carbGrams: number, icr: number): number => {
  const insulinUnits = carbGrams * icr;
  return Math.round(insulinUnits * 10) / 10; // Round to 1 decimal place
};

// Common ICR (Insulin-to-Carb Ratio) values for examples
const commonICRs = [1/5, 1/10, 1/15, 1/20];

const FoodDetailsModal = ({ isOpen, onClose, food }: FoodDetailsModalProps) => {
  if (!isOpen || !food) return null;

  // Calculate equivalent sugar teaspoons (4g of carbs ≈ 1 teaspoon of sugar)
  const sugarTeaspoons = calculateSugarTeaspoons(food.Carbohydrates_per_100g);
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl border border-[#8B7355]/20 max-w-lg w-full mx-auto p-6 relative pointer-events-auto modal-popup">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-[#8B7355] hover:bg-[#8B7355]/10 rounded-full transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-[#8B7355]">{food.Food}</h2>
          <div className="text-[#8B7355]/70 text-sm">{food.Category}</div>
        </div>
        
        <div className="my-4">
          {/* Nutrition Info */}
          <div className="flex justify-between gap-4 mb-6">
            {/* Carb Visual Representation */}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-[#8B7355]/70 mb-2 flex items-center gap-1">
                <GiKnifeFork className="w-4 h-4" />
                <span>Carbohydrates</span>
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-[#8B7355]">
                  {food.Carbohydrates_per_100g}
                  <span className="text-lg font-normal">g</span>
                </div>
                <div className="flex-grow h-8 bg-[#8B7355]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#8B7355] rounded-full"
                    style={{ width: `${Math.min(100, (food.Carbohydrates_per_100g / 100) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-[#8B7355]/70 text-sm mt-1">
                per 100g serving
              </div>
            </div>
            
            {/* Calories Visual Representation */}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-[#8B7355]/70 mb-2 flex items-center gap-1">
                <FaFire className="w-4 h-4" />
                <span>Calories</span>
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-[#8B7355]">
                  {food.Calories_per_100g}
                  <span className="text-lg font-normal">kcal</span>
                </div>
                <div className="flex-grow h-8 bg-red-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${Math.min(100, (food.Calories_per_100g / (food.Category === 'Legumes and Nuts' ? 650 : 300)) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-[#8B7355]/70 text-sm mt-1">
                per 100g serving
              </div>
            </div>
          </div>

          {/* Equivalent Sugar Teaspoons */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[#8B7355]/70 mb-2">Equivalent Sugar</h3>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-semibold text-[#8B7355]">
                {sugarTeaspoons}
              </div>
              <div className="text-[#8B7355]/70">teaspoons of sugar</div>
            </div>
          </div>

          {/* Insulin Requirements */}
          <div>
            <h3 className="text-sm font-medium text-[#8B7355]/70 mb-2">
              Estimated Insulin Requirements
            </h3>
            <div className="bg-[#8B7355]/5 rounded-xl p-3">
              <p className="text-sm text-[#8B7355]/70 mb-2">
                Based on typical Insulin-to-Carb Ratios (ICR):
              </p>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-[#8B7355]/70">ICR</th>
                    <th className="text-left text-sm font-medium text-[#8B7355]/70">For 100g</th>
                    <th className="text-left text-sm font-medium text-[#8B7355]/70">For 50g</th>
                  </tr>
                </thead>
                <tbody>
                  {commonICRs.map((icr) => (
                    <tr key={String(icr)} className="border-t border-[#8B7355]/10">
                      <td className="py-2 text-[#8B7355] font-medium">1:{1/icr}</td>
                      <td className="py-2 text-[#8B7355]">
                        {calculateInsulinUnits(food.Carbohydrates_per_100g, icr)} units
                      </td>
                      <td className="py-2 text-[#8B7355]">
                        {calculateInsulinUnits(food.Carbohydrates_per_100g / 2, icr)} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-[#8B7355]/70 mt-3">
                * These are estimates only. Always consult with your healthcare provider for your specific insulin needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailsModal;