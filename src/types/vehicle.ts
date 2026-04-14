// Tipi per VehicleManager Pro

export type VehicleType = 'auto' | 'moto';

export type FuelType = 'benzina' | 'diesel' | 'gpl' | 'metano' | 'ibrido' | 'elettrico';

export type LegalStatus = 'ok' | 'in_scadenza' | 'scaduto';

// Extended expense categories including legal expenses
export type ExpenseCategory = 
  | 'carburante' 
  | 'parcheggio' 
  | 'pedaggi' 
  | 'lavaggio' 
  | 'accessori'
  | 'assicurazione'
  | 'bollo'
  | 'revisione'
  | 'tasse'
  | 'pneumatici'
  | 'altro';

export type PaymentMethod = 'contanti' | 'carta' | 'bonifico' | 'altro';

export type MaintenanceType = 
  | 'tagliando' 
  | 'freni' 
  | 'gomme' 
  | 'olio' 
  | 'filtri' 
  | 'batteria' 
  | 'frizione' 
  | 'sospensioni' 
  | 'altro';

export type TireType = 'estivi' | 'invernali' | '4_stagioni';

export type BatteryStatus = 'ok' | 'da_controllare' | 'da_sostituire';

export interface Vehicle {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  version: string;
  year: number;
  color: string;
  fuel: FuelType;
  displacement: number; // cilindrata in cc
  power: number; // potenza in kW
  plate: string;
  vin: string; // obbligatorio
  currentKm: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  // NEW FIELDS per calcoli età, efficienza e bollo
  registrationDate: string; // YYYY-MM-DD formato ISO
  euroClass: string;        // Aggiunto per risolvere errore riga 121
  disabilityExemption?: boolean; // Esenzione Legge 104/Disabilità
  imageUrl?: string; // URL immagine veicolo caricata dall'utente
}

export interface Insurance {
  id: string;
  vehicleId: string;
  company: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  amount: number;
  notes: string;
  // Campi specifici Moto - sospensione/riattivazione
  statoPolizza?: 'attiva' | 'sospesa';
  dataScadenzaAttuale?: string;
  dataInizioSospensione?: string | null;
  giorniSospensioneTotali?: number;
  giorniSospensioneResidui?: number;
  richiedeNuovoDocumento?: boolean;
  // Archiviazione semplice del certificato
  insuranceDocumentName?: string | null;
  insuranceDocumentDataUrl?: string | null;
}

export interface Tax {
  id: string;
  vehicleId: string;
  year: number;
  region: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  notes: string;
}

export interface Inspection {
  id: string;
  vehicleId: string;
  lastDate: string;
  nextDate: string;
  result: 'superata' | 'non_superata' | 'da_effettuare';
  cost?: number;
  notes: string;
}

export interface LegalDocument {
  id: string;
  vehicleId: string;
  insurance: Insurance | null;
  tax: Tax | null;
  inspection: Inspection | null;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  date: string;
  km: number;
  type: MaintenanceType;
  workshop: string;
  isDiy: boolean;
  spareParts: string;
  cost: number;
  notes: string;
  nextMaintenanceKm: number | null;
  nextMaintenanceDate: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  category: ExpenseCategory;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  km: number;
  createdAt: string;
  legalDocumentId?: string;
  validityStart?: string;
  validityEnd?: string;
}

export interface Battery {
  id: string;
  vehicleId: string;
  installDate: string;
  replaceDate: string | null;
  brand: string;
  voltage: number; // V
  amperage: number; // Ah
  notes: string;
  createdAt: string;
}

export interface Tire {
  id: string;
  vehicleId: string;
  mountDate: string;
  mountKm: number;
  brand: string;
  model: string;
  type: TireType;
  frontSize: string;
  frontPressure: number; // bar
  rearSize: string;
  rearPressure: number; // bar
  notes: string;
  createdAt: string;
}

export interface ChainLube {
  id: string;
  vehicleId: string;
  date: string;
  km: number;
  nextKm: number;
  notes: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  vehicleId: string;
  date: string;
  action: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface OBDReading {
  id: string;
  vehicleId: string;
  date: string;
  errorCodes: string[];
  data: Record<string, string | number>;
  notes: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  currency: string;
  dateFormat: string;
  distanceUnit: 'km' | 'mi';
}

export interface VehicleManagerData {
  vehicles: Vehicle[];
  maintenance: Maintenance[];
  expenses: Expense[];
  legal: LegalDocument[];
  logs: LogEntry[];
  obdLogs: OBDReading[];
  batteries: Battery[];
  tires: Tire[];
  chainLubes: ChainLube[];
  settings: Settings;
}

// Default data structure
export const defaultData: VehicleManagerData = {
  vehicles: [],
  maintenance: [],
  expenses: [],
  legal: [],
  logs: [],
  obdLogs: [],
  batteries: [],
  tires: [],
  chainLubes: [],
  settings: {
    theme: 'light',
    currency: '€',
    dateFormat: 'dd/MM/yyyy',
    distanceUnit: 'km',
  },
};
