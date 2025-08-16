# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SugaRate is a diabetes management and nutrition tracking social platform built with React, TypeScript, and Vite. The application helps users track carbohydrate intake, calculate insulin requirements, and share health metrics within a community.

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Type check and build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture Overview

### Service Layer Pattern
All API communication goes through service classes in `/src/services/`:
- Each service handles a specific domain (auth, posts, nutrition, etc.)
- Services use axios for HTTP requests
- Authentication tokens are automatically included via axios interceptors

### Key Data Models
Posts include diabetes-specific health metrics:
- `meal_carbohydrates`: Carbohydrate content in grams
- `insulin_units`: Insulin units taken
- `location`: Location data for context
- ICR (Insulin-to-Carb Ratio) calculations integrated throughout

### AI Integration Points
- `/src/pages/AIChat.tsx`: General health assistant
- `/src/pages/NutritionAI.tsx`: Nutrition lookup with ICR calculations
- `/src/pages/FoodImageAI.tsx`: Food image analysis
- All AI features use dedicated service classes for API communication

### Protected Routes
Authentication is handled via HOC pattern - check for token in localStorage before rendering protected components.

### State Management
- Component-level state with React hooks
- User settings and auth tokens persisted in localStorage
- No global state management library - consider context or state library if complexity grows

## Important Considerations

1. **Diabetes Calculations**: The `/src/utils/insulinCalculator.ts` and `/src/utils/diabetesCalculations.ts` contain critical health calculations. Any changes should be carefully reviewed.

2. **Type Safety**: Maintain strict TypeScript usage. All API responses and data models should have corresponding interfaces.

3. **Health Data Privacy**: Posts contain sensitive health information. Ensure proper authentication checks on all routes handling health metrics.

4. **API Integration**: Backend API base URL is configured in service files. Update accordingly for different environments.