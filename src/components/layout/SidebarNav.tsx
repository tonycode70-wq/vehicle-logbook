import React, { useMemo } from 'react';
import { tabs, footerTabs, TabId } from '@/config/tabs';
import { BrandLogo } from './BrandLogo';
import { cn } from '@/lib/utils';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { getDaysUntilExpiry } from '@/lib/utils/dates';

interface SidebarNavProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function SidebarNav({ currentTab, onTabChange }: SidebarNavProps) {
  const { data } = useVehicleContext();

  // Calcola il numero di scadenze imminenti (es. entro 30 giorni)
  const deadlineCount = useMemo(() => {
    let count = 0;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    data.vehicles.forEach(vehicle => {
      const legal = data.legal.find(l => l.vehicleId === vehicle.id);
      if (legal) {
        // Assicurazione
        if (legal.insurance?.endDate) {
          const date = new Date(legal.insurance.endDate);
          if (date <= thirtyDaysFromNow && date >= now) count++;
        }
        // Bollo
        if (legal.tax?.dueDate) {
          const date = new Date(legal.tax.dueDate);
          if (date <= thirtyDaysFromNow && date >= now) count++;
        }
      }
      // Revisione (logica automatica se non presente)
      const inspection = data.maintenance.find(m => m.vehicleId === vehicle.id && m.type === 'revisione');
      if (inspection?.nextMaintenanceKm) {
        // Se c'è una data prossima revisione (opzionale nel modello attuale, usiamo la logica di Dashboard se serve)
      }
    });
    return count;
  }, [data.legal, data.maintenance, data.vehicles]);

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-black border-r border-primary/20">
      <div className="p-6 flex flex-col h-full">
        {/* Logo Section */}
        <div className="mb-12 px-2 flex justify-center">
          <BrandLogo />
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            const badgeValue = tab.id === 'legal' ? deadlineCount : tab.badge;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 group",
                  isActive
                    ? "bg-primary/20 text-primary shadow-[0_0_20px_rgba(212,175,55,0.1)] border border-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-300",
                    isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                  )} />
                  <span className={cn(
                    "truncate transition-colors duration-300",
                    isActive ? "text-primary" : "group-hover:text-primary"
                  )}>{tab.label}</span>
                </div>
                {badgeValue > 0 && (
                  <span className={cn(
                    "text-black text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg transition-transform group-hover:scale-110",
                    isActive ? "bg-primary" : "bg-primary/80 group-hover:bg-primary"
                  )}>
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Navigation */}
        <div className="mt-auto pt-6 border-t border-primary/10">
          <nav className="flex flex-col gap-2">
            {footerTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 group",
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-primary"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-300",
                    isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                  )} />
                  <span className={cn(
                    "truncate transition-colors duration-300",
                    isActive ? "text-primary" : "group-hover:text-primary"
                  )}>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
