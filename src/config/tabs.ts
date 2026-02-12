import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  FileText, 
  Wrench, 
  Wallet, 
  BarChart3, 
  History, 
  Database, 
  Settings,
  LucideIcon
} from 'lucide-react';

export type TabId = 
  | 'dashboard' 
  | 'vehicles' 
  | 'legal' 
  | 'maintenance' 
  | 'expenses' 
  | 'analytics' 
  | 'history' 
  | 'obd' 
  | 'settings';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  shortLabel?: string;
}

export const tabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortLabel: 'Home' },
  { id: 'vehicles', label: 'Veicoli', icon: Car },
  { id: 'legal', label: 'Stato Legale', icon: FileText, shortLabel: 'Legale' },
  { id: 'maintenance', label: 'Manutenzioni', icon: Wrench, shortLabel: 'Manut.' },
  { id: 'expenses', label: 'Spese', icon: Wallet },
  { id: 'analytics', label: 'Analisi', icon: BarChart3 },
  { id: 'history', label: 'Storico', icon: History },
  { id: 'obd', label: 'Diagnostica', icon: Database, shortLabel: 'OBD' },
  { id: 'settings', label: 'Impostazioni', icon: Settings, shortLabel: 'Opzioni' },
];

// Tab principali per mobile (bottom nav)
export const mobileMainTabs: TabId[] = ['dashboard', 'vehicles', 'expenses', 'maintenance', 'settings'];
