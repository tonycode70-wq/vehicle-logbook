import { Vehicle, FuelType, Maintenance } from '@/types/vehicle';

/**
 * Categoria di età del veicolo
 */
export type AgeCategory = 'New' | 'Recent' | 'Mature' | 'Classic';

/**
 * Stato del bollo auto secondo normativa italiana
 */
export type RoadTaxStatus = 
  | 'Exempt (Law 104/Disability)'
  | 'Exempt (Historic Vehicle)'
  | 'Exempt (Electric < 5y)'
  | 'Exempt/Check Region (Hybrid)'
  | 'Payable';

/**
 * Categoria indice di efficienza
 */
export type EfficiencyStatus = 'Excellent' | 'Good' | 'Monitor' | 'Critical';

/**
 * Risultato calcolo età veicolo
 */
export interface VehicleAgeResult {
  ageYears: number;
  category: AgeCategory;
}

/**
 * Risultato calcolo indice di efficienza
 */
export interface EfficiencyIndexResult {
  score: number;
  status: EfficiencyStatus;
  agePenalty: number;
  kmPenalty: number;
  bonus: number;
}

/**
 * Calcola l'età del veicolo e la sua categoria
 */
export function calculateVehicleAge(registrationDate: string): VehicleAgeResult {
  const regDate = new Date(registrationDate);
  const today = new Date();
  
  // Calcolo età in anni con precisione decimale
  const diffMs = today.getTime() - regDate.getTime();
  const ageYears = parseFloat((diffMs / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1));
  
  // Determina categoria
  let category: AgeCategory;
  if (ageYears <= 2) {
    category = 'New';
  } else if (ageYears <= 7) {
    category = 'Recent';
  } else if (ageYears <= 15) {
    category = 'Mature';
  } else {
    category = 'Classic';
  }
  
  return { ageYears, category };
}

/**
 * Calcola lo stato del bollo auto secondo normativa italiana
 * Priority Order:
 * 1. Esenzione per disabilità (Legge 104)
 * 2. Esenzione auto storiche (≥30 anni)
 * 3. Esenzione elettriche (<5 anni)
 * 4. Verifica ibridi (dipende da regione, <3 anni)
 * 5. Da pagare
 */
export function calculateRoadTaxStatus(
  vehicle: Vehicle,
  providedAgeYears?: number
): RoadTaxStatus {
  // Calcolo interno dell'età se non fornita per garantire il funzionamento delle esenzioni
  let ageYears = providedAgeYears;
  
  if (ageYears === undefined && vehicle.registrationDate) {
    const regDate = new Date(vehicle.registrationDate);
    const diffMs = new Date().getTime() - regDate.getTime();
    ageYears = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  } else if (ageYears === undefined) {
    ageYears = new Date().getFullYear() - (vehicle.year || new Date().getFullYear());
  }

  // 1. Controllo esenzione disabilità (Legge 104)
  // Supporta sia booleano che stringa "true" (comune nei form/database)
  const disabField = (vehicle as Record<string, unknown>).disabilityExemption;
  const isDisabExempt = disabField === true || (typeof disabField === 'string' && disabField.toLowerCase() === 'true');
  if (isDisabExempt || vehicle.notes?.toLowerCase().includes('legge 104')) {
    return 'Exempt (Law 104/Disability)';
  }
  
  // 2. Controllo veicolo storico (≥30 anni)
  if (ageYears >= 30) {
    return 'Exempt (Historic Vehicle)';
  }
  
  // 3. Controllo elettrico recente (normalizzato in minuscolo)
  if (vehicle.fuel?.toLowerCase() === 'elettrico' && ageYears <= 5) {
    return 'Exempt (Electric < 5y)';
  }
  
  // 4. Controllo ibrido (normalizzato in minuscolo)
  if (vehicle.fuel?.toLowerCase() === 'ibrido' && ageYears <= 3) {
    return 'Exempt/Check Region (Hybrid)';
  }
  
  // 5. Default: da pagare
  return 'Payable';
}

/**
 * Calcola l'indice di efficienza del veicolo
 * Basato su: età, km percorsi, manutenzione regolare e certificata
 * * Formula:
 * - Age Penalty: più vecchio = più penalità
 * - Km Penalty: km/anno elevati = più penalità  
 * - Bonus: manutenzione regolare e certificata
 * - Score finale: 100 - agePenalty - kmPenalty + bonus (0-100)
 */
export function calculateEfficiencyIndex(
  vehicle: Vehicle,
  maintenanceRecords: Maintenance[]
): EfficiencyIndexResult {
  // Se manca la data di registrazione, usa l'anno del veicolo
  let ageYears: number;
  
  if (vehicle.registrationDate) {
    const regDate = new Date(vehicle.registrationDate);
    const today = new Date();
    const diffMs = today.getTime() - regDate.getTime();
    ageYears = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  } else {
    // Fallback: usa l'anno del veicolo
    const currentYear = new Date().getFullYear();
    ageYears = currentYear - (vehicle.year || currentYear);
  }
  
  // 1. CALCOLO AGE PENALTY
  let agePenalty: number;
  if (ageYears <= 3) {
    agePenalty = ageYears * 2;
  } else if (ageYears <= 8) {
    agePenalty = 6 + ((ageYears - 3) * 4);
  } else {
    agePenalty = 26 + ((ageYears - 8) * 6);
  }
  
  // 2. CALCOLO KM PENALTY
  const kmPerYear = (vehicle.currentKm || 0) / Math.max(ageYears, 0.1);
  let kmPenalty: number;
  
  if (kmPerYear < 12000) {
    kmPenalty = 0;
  } else if (kmPerYear < 20000) {
    kmPenalty = 5;
  } else if (kmPerYear < 30000) {
    kmPenalty = 10;
  } else {
    kmPenalty = 20;
  }
  
  // 3. CALCOLO BONUS MANUTENZIONE
  let bonus = 0;
  
  // Verifica se c'è manutenzione regolare (almeno 1 record negli ultimi 12 mesi)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const recentMaintenance = maintenanceRecords.filter(m => 
    m.vehicleId === vehicle.id && new Date(m.date) >= oneYearAgo
  );
  
  const hasRegularMaintenance = recentMaintenance.length > 0;
  if (hasRegularMaintenance) {
    bonus += 5;
  }
  
  // Verifica se c'è manutenzione certificata (non DIY)
  const hasCertifiedMaintenance = recentMaintenance.some(m => !m.isDiy);
  if (hasCertifiedMaintenance) {
    bonus += 5;
  }
  
  // 4. CALCOLO SCORE FINALE (clamped 0-100)
  const rawScore = 100 - agePenalty - kmPenalty + bonus;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  
  // 5. DETERMINA STATUS
  let status: EfficiencyStatus;
  if (score >= 90) {
    status = 'Excellent';
  } else if (score >= 70) {
    status = 'Good';
  } else if (score >= 50) {
    status = 'Monitor';
  } else {
    status = 'Critical';
  }
  
  return {
    score,
    status,
    agePenalty: Math.round(agePenalty * 10) / 10,
    kmPenalty,
    bonus
  };
}

/**
 * Ottiene il colore associato allo stato di efficienza
 */
export function getEfficiencyStatusColor(status: EfficiencyStatus): string {
  switch (status) {
    case 'Excellent':
      return 'text-emerald-400';
    case 'Good':
      return 'text-blue-400';
    case 'Monitor':
      return 'text-amber-400';
    case 'Critical':
      return 'text-red-400';
  }
}

/**
 * Ottiene il colore associato allo stato del bollo
 */
export function getRoadTaxStatusColor(status: RoadTaxStatus): string {
  if (status === 'Payable') {
    return 'text-amber-400';
  }
  return 'text-emerald-400';
}

/**
 * Ottiene il colore associato alla categoria di età
 */
export function getAgeCategoryColor(category: AgeCategory): string {
  switch (category) {
    case 'New':
      return 'text-emerald-400';
    case 'Recent':
      return 'text-blue-400';
    case 'Mature':
      return 'text-amber-400';
    case 'Classic':
      return 'text-purple-400';
  }
}

/**
 * Calcola la data della prossima revisione secondo normativa italiana
 */
export function calculateNextInspectionDate(registrationDate: string, lastInspectionDate?: string | null): Date {
  const regDate = new Date(registrationDate);
  let nextDate: Date;

  if (lastInspectionDate) {
    const lastDate = new Date(lastInspectionDate);
    nextDate = new Date(lastDate.getFullYear() + 2, lastDate.getMonth(), 1);
  } else {
    nextDate = new Date(regDate.getFullYear() + 4, regDate.getMonth(), 1);
  }

  return new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
}

/**
 * Stima il costo del bollo auto
 */
export function estimateRoadTaxCost(powerKw: number, euroClass: number = 6): number {
  const rateUnder100 = 2.58; 
  const rateOver100 = 3.87;
  
  if (powerKw <= 100) {
    return powerKw * rateUnder100;
  } else {
    return (100 * rateUnder100) + ((powerKw - 100) * rateOver100);
  }
}

/**
 * Stima la classe ambientale (Euro) in base all'anno di prima immatricolazione.
 * Mappa indicativa per coprire i casi in cui il dato non sia stato salvato.
 */
export function estimateEuroClass(vehicle: Vehicle): string {
  if (vehicle.euroClass && vehicle.euroClass.trim().length > 0 && vehicle.euroClass !== 'N/D') {
    return vehicle.euroClass;
  }
  const year = vehicle.registrationDate
    ? new Date(vehicle.registrationDate).getFullYear()
    : vehicle.year;

  if (!year || isNaN(year)) return 'N/D';

  if (year < 1993) return '0';
  if (year < 1997) return '1';
  if (year < 2001) return '2';
  if (year < 2006) return '3';
  if (year < 2011) return '4';
  if (year < 2015) return '5';
  return '6';
}
