import { BarChart3, HeartHandshake, LayoutDashboard, Leaf, LogOut, ScrollText, ShieldCheck, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/api';
import { useAdminUser } from '@/lib/use-auth';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/wellness', label: 'Wellness content', icon: Leaf },
  { to: '/support', label: 'Support resources', icon: HeartHandshake },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/audit', label: 'Audit log', icon: ScrollText },
];

export function Layout() {
  const user = useAdminUser();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <div className="mb-6 px-2">
          <div className="text-lg font-semibold">MindBridge AI</div>
          <div className="text-xs text-muted-foreground">Administration</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent', isActive && 'bg-secondary font-medium text-secondary-foreground')
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mb-1 size-4" />
          Student conversations and journals are never available here. All figures are aggregated.
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 px-2 text-sm">
          <span className="truncate" title={user?.email}>
            {user?.email}
          </span>
          <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-2 overflow-x-auto border-b bg-card p-2 md:hidden">
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('rounded-md px-3 py-1.5 text-sm whitespace-nowrap', isActive && 'bg-secondary')}>
              {label}
            </NavLink>
          ))}
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
