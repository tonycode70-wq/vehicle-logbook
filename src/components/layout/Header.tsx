import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { tabs, TabId } from '@/config/tabs';
import { cn } from '@/lib/utils';

interface HeaderProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Header({ currentTab, onTabChange }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  const currentTabConfig = tabs.find(t => t.id === currentTab);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo e menu mobile */}
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <span className="text-lg">🚗</span>
                  </div>
                  VehicleManager Pro
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        currentTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg">🚗</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">VehicleManager</h1>
            </div>
          </div>
        </div>

        {/* Titolo pagina corrente (mobile) */}
        <div className="flex-1 text-center md:hidden">
          <span className="text-sm font-medium text-foreground">
            {currentTabConfig?.label}
          </span>
        </div>

        {/* Azioni header */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Cambia tema</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
