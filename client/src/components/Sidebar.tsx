import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  MapPin, 
  Route, 
  Calendar, 
  BarChart3, 
  Wrench, 
  Users, 
  Settings,
  Building2
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fleet Map', href: '/fleet-map', icon: MapPin },
  { name: 'Routes', href: '/routes', icon: Route },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-card border-r border-border pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="ml-3 text-xl font-semibold text-foreground">SmartSan</span>
          </div>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary",
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                )}
              >
                <item.icon className="mr-3 flex-shrink-0 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
