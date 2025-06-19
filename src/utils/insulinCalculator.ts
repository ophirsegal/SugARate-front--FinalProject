/**
 * Utility functions for diabetes-related calculations
 */

/**
 * Calculate insulin units required based on carbohydrates and ICR ratio
 * 
 * @param carbs - Carbohydrates in grams
 * @param icrRatio - Insulin-to-Carb Ratio (how many grams of carbs covered by 1 unit of insulin)
 * @param roundingDecimal - Number of decimal places to round to (default 1)
 * @returns Insulin units required
 */
export const calculateInsulinForCarbs = (
  carbs: number,
  icrRatio: number,
  roundingDecimal: number = 1
): number => {
  if (!carbs || carbs <= 0 || !icrRatio || icrRatio <= 0) {
    return 0;
  }
  
  // Calculate insulin units needed
  const insulinUnits = carbs / icrRatio;
  
  // Round to specified decimal places
  const multiplier = Math.pow(10, roundingDecimal);
  return Math.round(insulinUnits * multiplier) / multiplier;
};

/**
 * Format insulin dose with appropriate units
 */
export const formatInsulinDose = (units: number): string => {
  if (units === 0) return '0 units';
  
  return units === 1 ? '1 unit' : `${units} units`;
};

/**
 * Generate insulin recommendation text based on carbs and ICR ratio
 */
export const getInsulinRecommendation = (
  carbs: number,
  icrRatio: number,
  includeFormula: boolean = true
): string => {
  const insulinUnits = calculateInsulinForCarbs(carbs, icrRatio);
  let recommendation = `For ${carbs}g of carbs with a 1:${icrRatio} ICR ratio, take ${formatInsulinDose(insulinUnits)}.`;
  
  if (includeFormula) {
    recommendation += ` (${carbs}g ÷ ${icrRatio} = ${insulinUnits})`;
  }
  
  return recommendation;
};

// Export default object with all functions
const insulinCalculator = {
  calculateInsulinForCarbs,
  formatInsulinDose,
  getInsulinRecommendation
};

export default insulinCalculator;