import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Apple,
  BookOpen,
  Calendar,
  Dumbbell,
  List,
  Image,
  Settings,
  TrendingUp,
  ClipboardList,
  BarChart3,
  Book,
  Flame,
  Watch,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { useToasts } from '../../hooks/useToasts';
import { cn } from '../ui/utils';

const NAV_ITEMS: Array<{
  key: string;
  label: string;
  path: string;
  icon: React.ElementType;
}> = [
  { key: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { key: 'body-progress', label: 'Body Progress', path: '/body-progress', icon: TrendingUp },
  { key: 'nutrition', label: 'Nutrition', path: '/nutrition', icon: Apple },
  { key: 'food-library', label: 'Food Library', path: '/food-library', icon: List },
  { key: 'meals-recipes', label: 'Meals & Recipes', path: '/meals-recipes', icon: BookOpen },
  { key: 'meal-planner', label: 'Meal Planner', path: '/meal-planner', icon: Calendar },
  { key: 'grocery', label: 'Grocery List', path: '/grocery', icon: ClipboardList },
  { key: 'workouts', label: 'Workouts', path: '/workouts', icon: Dumbbell },
  { key: 'workout-planner', label: 'Workout Planner', path: '/workout-planner', icon: Calendar },
  { key: 'habits', label: 'Habits', path: '/habits', icon: CheckCircle },
  { key: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar },
  { key: 'goals', label: 'Goals & Challenges', path: '/goals', icon: Flame },
  { key: 'progress-photos', label: 'Progress Photos', path: '/progress-photos', icon: Image },
  { key: 'insights', label: 'Insights & Reports', path: '/insights', icon: BarChart3 },
  { key: 'journal', label: 'Journal', path: '/journal', icon: Book },
  { key: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

const LOGO = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="30" x="1" y="1" rx="8" stroke="#2E9D59" strokeWidth="2" />
    <path d="M6 16l3 3 5-5 2 2 7-7" stroke="#2E9D59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="14" r="2.5" fill="#2E9D59" />
  </svg>
);

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const location = useLocation();
  const { show } = useToasts();

  const activeKey = NAV_ITEMS.find((i) => location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path)))?.key || 'dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <button onClick={onMenuToggle} className="md:hidden p-2 rounded-md hover:bg-green-soft text-dark">
            <span className="sr-only">Open menu</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2 text-deep-green font-bold text-lg tracking-tight">
            {LOGO}
            <span>Ultimate Tracker</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = activeKey === item.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-green-soft text-green-deep'
                    : 'text-secondary hover:text-green-deep hover:bg-green-soft/50'
                )}
              >
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => show({ type: 'info', title: 'Quick add', message: 'Coming soon: quick-log actions from the header' })}
            className="p-2 rounded-md bg-green-soft text-green-deep hover:bg-green-mint"
            aria-label="Quick add"
          >
            <Plus size={18} strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span id="offline-status">Online</span>
            </span>
          </div>
          <button className="p-2 rounded-md hover:bg-green-soft text-dark" aria-label="Profile">
            <Watch size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* mobile nav */}
      <div className="md:hidden border-t border-border bg-surface">
        <div className="grid grid-cols-4 gap-0 border-y border-border">
          {NAV_ITEMS.map((item) => {
            const active = activeKey === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onMenuToggle()}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-2 py-3 text-xs transition-colors',
                  active
                    ? 'bg-green-soft text-green-deep'
                    : 'text-secondary hover:text-green-deep hover:bg-green-soft/50'
                )}
              >
                <Icon size={20} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export default Header;
