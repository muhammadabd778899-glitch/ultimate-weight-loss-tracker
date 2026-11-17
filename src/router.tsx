import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { BodyProgress } from './pages/BodyProgress';
import { Nutrition } from './pages/Nutrition';
import { FoodLibrary } from './pages/FoodLibrary';
import { MealsRecipes } from './pages/MealsRecipes';
import { MealPlanner } from './pages/MealPlanner';
import { Grocery } from './pages/Grocery';
import { Workouts } from './pages/Workouts';
import { WorkoutPlanner } from './pages/WorkoutPlanner';
import { Habits } from './pages/Habits';
import { CalendarPage } from './pages/Calendar';
import { Goals } from './pages/Goals';
import { ProgressPhotos } from './pages/ProgressPhotos';
import { Insights } from './pages/Insights';
import { Journal } from './pages/Journal';
import { Settings } from './pages/Settings';

export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'body-progress', element: <BodyProgress /> },
      { path: 'nutrition', element: <Nutrition /> },
      { path: 'food-library', element: <FoodLibrary /> },
      { path: 'meals-recipes', element: <MealsRecipes /> },
      { path: 'meal-planner', element: <MealPlanner /> },
      { path: 'grocery', element: <Grocery /> },
      { path: 'workouts', element: <Workouts /> },
      { path: 'workout-planner', element: <WorkoutPlanner /> },
      { path: 'habits', element: <Habits /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'goals', element: <Goals /> },
      { path: 'progress-photos', element: <ProgressPhotos /> },
      { path: 'insights', element: <Insights /> },
      { path: 'journal', element: <Journal /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    path: '*',
    element: <Dashboard />,
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
