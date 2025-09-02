import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { MobileNav } from "./MobileNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <TopNavbar onMobileMenuToggle={toggleMobileMenu} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
