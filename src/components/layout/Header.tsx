import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Apple,
  BarChart3,
  Book,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Droplets,
  Dumbbell,
  Flame,
  Image,
  LayoutDashboard,
  Menu,
  Plus,
  Ruler,
  Settings,
  TrendingUp,
  Utensils,
  X,
} from 'lucide-react';
import { cn } from '../ui/utils';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const PRIMARY_NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { key: 'body', label: 'Body', path: '/body-progress', icon: Activity },
  { key: 'nutrition', label: 'Nutrition', path: '/nutrition', icon: Apple },
  { key: 'workouts', label: 'Workouts', path: '/workouts', icon: Dumbbell },
  { key: 'habits', label: 'Habits', path: '/habits', icon: CheckCircle2 },
  { key: 'insights', label: 'Insights', path: '/insights', icon: BarChart3 },
];

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Track',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { key: 'body', label: 'Body Progress', path: '/body-progress', icon: TrendingUp },
      { key: 'nutrition', label: 'Nutrition', path: '/nutrition', icon: Apple },
      { key: 'workouts', label: 'Workouts', path: '/workouts', icon: Dumbbell },
      { key: 'habits', label: 'Habits', path: '/habits', icon: CheckCircle2 },
    ],
  },
  {
    title: 'Plan',
    items: [
      { key: 'meal-planner', label: 'Meal Planner', path: '/meal-planner', icon: Calendar },
      { key: 'workout-planner', label: 'Workout Planner', path: '/workout-planner', icon: Calendar },
      { key: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar },
      { key: 'goals', label: 'Goals & Challenges', path: '/goals', icon: Flame },
    ],
  },
  {
    title: 'Library',
    items: [
      { key: 'food-library', label: 'Food Library', path: '/food-library', icon: ClipboardList },
      { key: 'meals-recipes', label: 'Meals & Recipes', path: '/meals-recipes', icon: BookOpen },
      { key: 'grocery', label: 'Grocery List', path: '/grocery', icon: ClipboardList },
    ],
  },
  {
    title: 'Reflect',
    items: [
      { key: 'insights', label: 'Insights & Reports', path: '/insights', icon: BarChart3 },
      { key: 'progress-photos', label: 'Progress Photos', path: '/progress-photos', icon: Image },
      { key: 'journal', label: 'Journal', path: '/journal', icon: Book },
      { key: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

const MORE_NAV: NavGroup[] = [
  {
    title: 'Plan',
    items: [
      { key: 'meal-planner', label: 'Meal Planner', path: '/meal-planner', icon: Calendar },
      { key: 'workout-planner', label: 'Workout Planner', path: '/workout-planner', icon: Calendar },
      { key: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar },
      { key: 'goals', label: 'Goals & Challenges', path: '/goals', icon: Flame },
    ],
  },
  {
    title: 'Library',
    items: [
      { key: 'food-library', label: 'Food Library', path: '/food-library', icon: ClipboardList },
      { key: 'meals-recipes', label: 'Meals & Recipes', path: '/meals-recipes', icon: BookOpen },
      { key: 'grocery', label: 'Grocery List', path: '/grocery', icon: ClipboardList },
    ],
  },
  {
    title: 'More',
    items: [
      { key: 'progress-photos', label: 'Progress Photos', path: '/progress-photos', icon: Image },
      { key: 'journal', label: 'Journal', path: '/journal', icon: Book },
      { key: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

const QUICK_ACTIONS = [
  { label: 'Log weight', to: '/body-progress', icon: TrendingUp },
  { label: 'Add a meal', to: '/nutrition', icon: Utensils },
  { label: 'Log water', to: '/nutrition', icon: Droplets },
  { label: 'Record a workout', to: '/workouts', icon: Dumbbell },
  { label: 'Add a measurement', to: '/body-progress', icon: Ruler },
];

function isActivePath(pathname: string, path: string) {
  return pathname === path || (path !== '/' && pathname.startsWith(path));
}

interface HeaderProps {
  online: boolean;
  mobileOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ online, mobileOpen, onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  React.useEffect(() => {
    setQuickOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setQuickOpen(false);
      setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const activeKey = PRIMARY_NAV.find((item) => isActivePath(location.pathname, item.path))?.key;
  const moreActive = MORE_NAV.some((group) => group.items.some((item) => isActivePath(location.pathname, item.path)));

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:h-[68px] sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuToggle}
          className="grid h-10 w-10 place-items-center rounded-control text-dark transition-colors hover:bg-black/[0.05] xl:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Ultimate Tracker home">
          <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-gradient-to-br from-[#15A862] to-[#0A5C36] text-white shadow-[0_10px_22px_-10px_rgba(10,92,54,0.9)]">
            <TrendingUp size={20} strokeWidth={2.2} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-dark">Ultimate Tracker</span>
            <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.16em] text-secondary sm:block">
              Weight &amp; wellness
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-0.5 xl:flex">
          {PRIMARY_NAV.map((item) => {
            const active = activeKey === item.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors',
                  active
                    ? 'bg-green-soft text-green-deep'
                    : 'text-secondary hover:bg-black/[0.04] hover:text-dark',
                )}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors',
                moreActive
                  ? 'bg-green-soft text-green-deep'
                  : 'text-secondary hover:bg-black/[0.04] hover:text-dark',
              )}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              More
              <ChevronDown size={14} strokeWidth={2.2} className={cn('transition-transform', moreOpen && 'rotate-180')} />
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} aria-hidden="true" />
                <div
                  role="menu"
                  className="absolute left-1/2 top-full z-20 mt-3 w-[540px] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-[0_30px_60px_-24px_rgba(11,61,38,0.35)] animate-fade-in"
                >
                  <div className="grid grid-cols-3 gap-1">
                    {MORE_NAV.map((group) => (
                      <div key={group.title} className="p-1.5">
                        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
                          {group.title}
                        </p>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActivePath(location.pathname, item.path);
                          return (
                            <Link
                              key={item.key}
                              to={item.path}
                              role="menuitem"
                              className={cn(
                                'flex items-center gap-2 rounded-[10px] px-2 py-2 text-[13px] font-medium transition-colors',
                                active
                                  ? 'bg-green-soft text-green-deep'
                                  : 'text-secondary hover:bg-black/[0.04] hover:text-dark',
                              )}
                            >
                              <Icon size={15} strokeWidth={2} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[11px] font-medium text-secondary md:flex">
            <span className={cn('h-1.5 w-1.5 rounded-full', online ? 'bg-success' : 'bg-warning')} />
            {online ? 'Online' : 'Offline'}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setQuickOpen((open) => !open)}
              className="flex h-10 items-center gap-2 rounded-control bg-gradient-to-b from-[#1EAE68] to-[#128B51] px-3 text-[13px] font-semibold text-white shadow-[0_10px_20px_-12px_rgba(15,120,70,0.9)] transition-all hover:from-[#22BA70] hover:to-[#149A5B] sm:px-4"
              aria-label="Quick add"
              aria-haspopup="menu"
              aria-expanded={quickOpen}
            >
              <Plus size={17} strokeWidth={2.4} />
              <span className="hidden sm:inline">Quick add</span>
            </button>
            {quickOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setQuickOpen(false)} aria-hidden="true" />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-3 w-56 overflow-hidden rounded-2xl border border-border bg-white p-1.5 shadow-[0_30px_60px_-24px_rgba(11,61,38,0.35)] animate-fade-in"
                >
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        to={action.to}
                        role="menuitem"
                        onClick={() => setQuickOpen(false)}
                        className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 text-[13px] font-medium text-secondary transition-colors hover:bg-green-soft hover:text-green-deep"
                      >
                        <Icon size={16} strokeWidth={2} />
                        {action.label}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <Link
            to="/settings"
            className="grid h-10 w-10 place-items-center rounded-control border border-border bg-white text-secondary shadow-[0_1px_2px_rgba(16,40,28,0.04)] transition-colors hover:border-green-mint/60 hover:text-green-deep"
            aria-label="Profile and settings"
          >
            <Settings size={18} strokeWidth={2} />
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto bg-[#F5FAF6]/98 backdrop-blur-xl sm:top-[68px] xl:hidden"
        >
          <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
            {NAV_GROUPS.map((group) => (
              <section key={group.title}>
                <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                  {group.title}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(location.pathname, item.path);
                    return (
                      <Link
                        key={item.key}
                        to={item.path}
                        onClick={onMenuToggle}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border px-3 py-3 text-[13px] font-medium transition-colors',
                          active
                            ? 'border-green-mint/60 bg-green-soft text-green-deep'
                            : 'border-border/80 bg-white text-dark hover:bg-green-soft/60',
                        )}
                      >
                        <Icon size={17} strokeWidth={2} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}

            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-white px-4 py-3 text-[12px] text-secondary">
              <span className="inline-flex items-center gap-2">
                <span className={cn('h-1.5 w-1.5 rounded-full', online ? 'bg-success' : 'bg-warning')} />
                {online ? 'Online' : 'Offline mode'}
              </span>
              <span>Data stays on this device</span>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;
