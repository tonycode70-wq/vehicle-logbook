import React from 'react';
import { Moon, Sun, Menu, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { tabs, footerTabs, TabId } from '@/config/tabs';
import { cn } from '@/lib/utils';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { getDaysUntilExpiry, formatDate } from '@/lib/utils/dates';
import { useMemo, useState } from 'react';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAddVehicle?: () => void;
}

export function Header({ currentTab, onTabChange }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { data } = useVehicleContext();

  // Calcola le notifiche in tempo reale basate sulla data odierna
  const notifications = useMemo(() => {
    const list: { title: string; desc: string; date: string; days: number }[] = [];
    
    data.vehicles.forEach(vehicle => {
      const legal = data.legal.find(l => l.vehicleId === vehicle.id);
      if (legal) {
        // Assicurazione
        if (legal.insurance?.endDate) {
          const days = getDaysUntilExpiry(legal.insurance.endDate);
          if (days <= 30) {
            list.push({
              title: `Assicurazione ${vehicle.brand}`,
              desc: days < 0 ? 'Scaduta!' : `Scade tra ${days} giorni`,
              date: legal.insurance.endDate,
              days
            });
          }
        }
        // Bollo
        if (legal.tax?.dueDate) {
          const days = getDaysUntilExpiry(legal.tax.dueDate);
          if (days <= 30) {
            list.push({
              title: `Bollo ${vehicle.brand}`,
              desc: days < 0 ? 'Scaduto!' : `Scade tra ${days} giorni`,
              date: legal.tax.dueDate,
              days
            });
          }
        }
      }
    });
    return list.sort((a, b) => a.days - b.days);
  }, [data.legal, data.vehicles]);

  return (
    <header className="bg-black/60 backdrop-blur-2xl border-b border-primary/20 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-primary transition-all hover:bg-white/5">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-black border-r border-primary/20">
              <SheetHeader className="border-b border-primary/20 p-8 flex justify-center">
                <BrandLogo />
              </SheetHeader>
              <nav className="flex flex-col p-4 gap-2">
                {[...tabs, ...footerTabs].map(tab => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl px-4 py-4 text-sm font-bold transition-all duration-300",
                        isActive
                          ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                          : "text-muted-foreground hover:bg-white/5 hover:text-primary"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="md:hidden">
            <BrandLogo iconOnly className="h-8" />
          </div>
        </div>

        {/* Desktop Title Placeholder (Title is now in Dashboard) */}
        <div className="hidden md:block" />

        {/* Right Actions: Notifications, Theme, User */}
        <div className="flex items-center gap-2 md:gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-white/10 relative transition-all"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-black shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
                )}
                <span className="sr-only">Notifiche</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-3xl shadow-2xl bg-black/95 backdrop-blur-2xl border border-primary/20 mt-2" align="end">
              <div className="p-5 border-b border-primary/10">
                <h3 className="font-bold text-xs text-white uppercase tracking-[0.2em] gold-text-gradient">Notifiche</h3>
              </div>
              <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-xs text-muted-foreground font-medium opacity-60">Nessuna nuova notifica</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="p-5 border-b border-primary/5 last:border-0 hover:bg-white/5 transition-all cursor-pointer group" onClick={() => onTabChange('legal')}>
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-[13px] font-bold text-white group-hover:text-primary transition-colors leading-tight">{n.title}</p>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap",
                          n.days < 0 ? "bg-red-500/20 text-red-500 border border-red-500/20" : "bg-primary/20 text-primary border border-primary/20"
                        )}>
                          {n.days < 0 ? 'Scaduta' : `${n.days} gg`}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-1.5 font-medium group-hover:text-muted-foreground/80 transition-colors">{n.desc}</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-2 font-bold uppercase tracking-wider">{formatDate(n.date)}</p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-white/10 transition-all"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Cambia tema</span>
          </Button>
          
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 cursor-pointer hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:scale-105 active:scale-95">
            B
          </div>
        </div>
      </div>
    </header>
  );
}
