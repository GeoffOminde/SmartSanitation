import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MapPin, 
  Route, 
  Calendar, 
  BarChart3, 
  Wrench, 
  Users, 
  Settings,
  Building2,
  X
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

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [location] = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex z-40 lg:hidden" data-testid="mobile-nav-overlay">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card">
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-1 h-10 w-10 rounded-full text-white hover:text-gray-300"
            data-testid="button-close-mobile-nav"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <div className="flex-shrink-0 flex items-center px-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="ml-3 text-xl font-semibold text-foreground">SmartSan</span>
          </div>
          
          <nav className="mt-5 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary",
                    "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                  )}
                  data-testid={`mobile-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="mr-4 flex-shrink-0 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
