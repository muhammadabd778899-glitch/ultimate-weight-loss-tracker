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
  CheckCircle,
  Plus,
  X,
  Menu,
} from 'lucide-react';
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

const QUICK_ACTIONS = [
  { label: 'Log weight', to: '/body-progress' },
  { label: 'Add a meal', to: '/nutrition' },
  { label: 'Log water', to: '/habits' },
  { label: 'Record a workout', to: '/workouts' },
  { label: 'Add a measurement', to: '/body-progress' },
];

const LOGO = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="30" height="30" x="1" y="1" rx="8" stroke="#2E9D59" strokeWidth="2" />
    <path d="M6 16l3 3 5-5 2 2 7-7" stroke="#2E9D59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="14" r="2.5" fill="#2E9D59" />
  </svg>
);

interface HeaderProps {
  online: boolean;
  mobileOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ online, mobileOpen, onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const [quickOpen, setQuickOpen] = React.useState(false);

  React.useEffect(() => {
    setQuickOpen(false);
  }, [location.pathname]);

  const activeKey =
    NAV_ITEMS.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== '/' && location.pathname.startsWith(item.path))
    )?.key || 'dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-md p-2 text-dark hover:bg-green-soft lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-deep-green">
            {LOGO}
            <span>Ultimate Tracker</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setQuickOpen((open) => !open)}
              className="rounded-md bg-green-soft p-2 text-green-deep hover:bg-green-mint"
              aria-label="Quick add"
              aria-haspopup="menu"
              aria-expanded={quickOpen}
            >
              <Plus size={18} strokeWidth={2} />
            </button>
            {quickOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setQuickOpen(false)} aria-hidden="true" />
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-xl"
                >
                  {QUICK_ACTIONS.map((action) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      role="menuitem"
                      onClick={() => setQuickOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-dark hover:bg-green-soft hover:text-green-deep"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-secondary sm:flex">
            <span className={cn('h-2 w-2 rounded-full', online ? 'bg-success' : 'bg-warning')} />
            <span>{online ? 'Online' : 'Offline'}</span>
          </div>

          <Link
            to="/settings"
            className="rounded-md p-2 text-dark hover:bg-green-soft"
            aria-label="Profile and settings"
          >
            <Settings size={18} strokeWidth={2} />
          </Link>
        </div>
      </div>

      <nav aria-label="Main" className="hidden border-t border-border lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-2 [scrollbar-width:thin]">
          {NAV_ITEMS.map((item) => {
            const active = activeKey === item.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-green-soft text-green-deep'
                    : 'text-secondary hover:bg-green-soft/50 hover:text-green-deep'
                )}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="max-h-[70vh] overflow-y-auto border-t border-border bg-surface lg:hidden"
        >
          <div className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-3">
            {NAV_ITEMS.map((item) => {
              const active = activeKey === item.key;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={onMenuToggle}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-green-soft text-green-deep'
                      : 'text-secondary hover:bg-green-soft/50 hover:text-green-deep'
                  )}
                >
                  <Icon size={18} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;
