import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Bell, Menu, ChevronDown, User, Settings, LogOut } from "lucide-react";

interface TopNavbarProps {
  onMobileMenuToggle?: () => void;
}

export function TopNavbar({ onMobileMenuToggle }: TopNavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(3);

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-card border-b border-border shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="border-r border-border lg:hidden"
        onClick={onMobileMenuToggle}
        data-testid="button-mobile-menu"
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground ml-3" />
              </div>
              <Input
                type="search"
                placeholder="Search units, routes, bookings..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
            <Bell className="h-6 w-6" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {notificationCount}
              </Badge>
            )}
          </Button>
          
          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar" />
                  <AvatarFallback>JM</AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium hidden md:block">James Mwangi</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem data-testid="menu-profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-logout">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
