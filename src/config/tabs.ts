import React from 'react';
import { 
  Gauge, 
  Car, 
  FileText, 
  Wrench, 
  Wallet, 
  BarChart3, 
  History,
  Database,
  Settings,
  HelpCircle,
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
  | 'settings'
  | 'help';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  shortLabel?: string;
  badge?: number;
}

export const tabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge, shortLabel: 'Home' },
  { id: 'vehicles', label: 'Veicoli', icon: Car },
  { id: 'legal', label: 'Stato Legale', icon: FileText, shortLabel: 'Legale' },
  { id: 'maintenance', label: 'Manutenzioni', icon: Wrench, shortLabel: 'Manut.' },
  { id: 'expenses', label: 'Spese', icon: Wallet },
  { id: 'analytics', label: 'Analisi', icon: BarChart3 },
  { id: 'history', label: 'Storico', icon: History, shortLabel: 'Storia' },
  { id: 'obd', label: 'Diagnostica', icon: Database, shortLabel: 'OBD' },
];

export const footerTabs: TabConfig[] = [
  { id: 'settings', label: 'Impostazioni', icon: Settings },
  { id: 'help', label: 'Aiuto', icon: HelpCircle },
];

// Tab principali per mobile (bottom nav)
export const mobileMainTabs: TabId[] = ['dashboard', 'vehicles', 'legal', 'analytics'];
