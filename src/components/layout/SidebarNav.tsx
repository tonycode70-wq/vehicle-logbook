import React from 'react';
import { tabs, TabId } from '@/config/tabs';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function SidebarNav({ currentTab, onTabChange }: SidebarNavProps) {
  return (
    <aside className="hidden md:flex md:w-56 lg:w-64 flex-col glass-sidebar">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* Footer sidebar */}
      <div className="border-t p-3">
        <p className="text-xs text-muted-foreground text-center">
          VehicleManager Pro v1.0
        </p>
      </div>
    </aside>
  );
}
