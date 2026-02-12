import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  VehicleManagerData, 
  defaultData, 
  Vehicle, 
  Maintenance, 
  Expense, 
  LegalDocument, 
  LogEntry, 
  OBDReading,
  Battery,
  Tire,
  ChainLube,
  Settings 
} from '@/types/vehicle';

const STORAGE_KEY = 'vehicleManagerData';

function loadFromStorage(): VehicleManagerData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultData,
        ...parsed,
        settings: { ...defaultData.settings, ...(parsed.settings || {}) },
        batteries: parsed.batteries || [],
        tires: parsed.tires || [],
        chainLubes: parsed.chainLubes || [],
      };
    }
  } catch (error) {
    console.error('Errore caricamento dati:', error);
  }
  return defaultData;
}

function saveToStorage(data: VehicleManagerData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Errore salvataggio dati:', error);
  }
}

export function useVehicleData() {
  const [data, setData] = useState<VehicleManagerData>(() => loadFromStorage());
  const [isLoaded, setIsLoaded] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const update = useCallback((updater: (prev: VehicleManagerData) => VehicleManagerData) => {
    setData(prev => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  const addLog = useCallback((vehicleId: string, action: string, details: string, previousValue?: string, newValue?: string) => {
    const log: LogEntry = {
      id: crypto.randomUUID(),
      vehicleId,
      date: new Date().toISOString(),
      action,
      details,
      previousValue,
      newValue,
    };
    update(prev => ({ ...prev, logs: [...prev.logs, log] }));
  }, [update]);

  // --- ANALYTICS ENGINE (PUNTO 2 REPORT) ---
  const getVehicleAnalytics = useCallback((vehicleId: string) => {
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return null;

    const vehicleExpenses = data.expenses.filter(e => e.vehicleId === vehicleId);
    const vehicleMaintenance = data.maintenance.filter(m => m.vehicleId === vehicleId);

    const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalMaintenance = vehicleMaintenance.reduce((sum, m) => sum + m.cost, 0);
    const totalCost = totalExpenses + totalMaintenance;

    const costPerKm = vehicle.currentKm > 0 ? (totalCost / vehicle.currentKm).toFixed(2) : "0.00";

    return {
      totalCost,
      totalExpenses,
      totalMaintenance,
      costPerKm,
      expenseCount: vehicleExpenses.length,
      maintenanceCount: vehicleMaintenance.length
    };
  }, [data.vehicles, data.expenses, data.maintenance]);

  // --- LEGAL DEADLINES (NUOVO - PUNTO 3 REPORT) ---
  const getLegalDeadlines = useCallback((vehicleId: string) => {
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    if (!vehicle || !vehicle.registrationDate) return null;

    const regDate = new Date(vehicle.registrationDate);
    const today = new Date();

    // Calcolo Revisione (4 anni prima volta, poi ogni 2)
    const yearsSinceReg = today.getFullYear() - regDate.getFullYear();
    let nextInspectionYear = regDate.getFullYear() + (yearsSinceReg < 4 ? 4 : Math.ceil(yearsSinceReg / 2) * 2);
    if (nextInspectionYear === today.getFullYear() && today.getMonth() > regDate.getMonth()) {
        nextInspectionYear += 2;
    }
    const nextInspection = new Date(regDate);
    nextInspection.setFullYear(nextInspectionYear);

    // Calcolo Bollo (Esempio semplificato: scadenza annuale basata su mese immatricolazione)
    const nextTax = new Date(today.getFullYear(), regDate.getMonth(), regDate.getDate());
    if (nextTax < today) nextTax.setFullYear(today.getFullYear() + 1);

    return {
      nextInspection: nextInspection.toISOString().split('T')[0],
      nextTax: nextTax.toISOString().split('T')[0],
      isUrgent: (nextInspection.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) < 30
    };
  }, [data.vehicles]);

  // CRUD Veicoli - AGGIORNATO CON NUOVI CAMPI REPORT
  const addVehicle = useCallback((vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: crypto.randomUUID(),
      euroClass: vehicle.euroClass || 'N/D',
      registrationDate: vehicle.registrationDate || new Date().toISOString().split('T')[0],
      power: vehicle.power || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    update(prev => ({ ...prev, vehicles: [...prev.vehicles, newVehicle] }));
    addLog(newVehicle.id, 'VEICOLO_AGGIUNTO', `Aggiunto ${vehicle.brand} ${vehicle.model}`);
    return newVehicle;
  }, [update, addLog]);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    update(prev => {
      const vehicle = prev.vehicles.find(v => v.id === id);
      if (!vehicle) return prev;
      const updatedVehicle = { ...vehicle, ...updates, updatedAt: new Date().toISOString() };
      return { ...prev, vehicles: prev.vehicles.map(v => v.id === id ? updatedVehicle : v) };
    });
    
    const vehicle = dataRef.current.vehicles.find(v => v.id === id);
    if (vehicle) {
      if (updates.currentKm && updates.currentKm !== vehicle.currentKm) {
        addLog(id, 'KM_AGGIORNATI', 'Chilometraggio aggiornato', String(vehicle.currentKm), String(updates.currentKm));
      }
      if (updates.fuel && updates.fuel !== vehicle.fuel) {
        addLog(id, 'FUEL_CAMBIATO', 'Tipo alimentazione aggiornato', vehicle.fuel, updates.fuel);
      }
    }
  }, [update, addLog]);

  const deleteVehicle = useCallback((id: string) => {
    const vehicle = dataRef.current.vehicles.find(v => v.id === id);
    update(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id),
      maintenance: prev.maintenance.filter(m => m.vehicleId !== id),
      expenses: prev.expenses.filter(e => e.vehicleId !== id),
      legal: prev.legal.filter(l => l.vehicleId !== id),
      logs: prev.logs.filter(l => l.vehicleId !== id),
      obdLogs: prev.obdLogs.filter(o => o.vehicleId !== id),
      batteries: prev.batteries.filter(b => b.vehicleId !== id),
      tires: prev.tires.filter(t => t.vehicleId !== id),
      chainLubes: prev.chainLubes.filter(c => c.vehicleId !== id),
    }));
    if (vehicle) {
      addLog('system', 'VEICOLO_ELIMINATO', `Eliminato ${vehicle.brand} ${vehicle.model}`);
    }
  }, [update, addLog]);

  // CRUD Manutenzioni
  const addMaintenance = useCallback((maintenance: Omit<Maintenance, 'id' | 'createdAt'>) => {
    const newMaintenance: Maintenance = {
      ...maintenance,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    update(prev => ({ ...prev, maintenance: [...prev.maintenance, newMaintenance] }));
    addLog(maintenance.vehicleId, 'MANUTENZIONE_AGGIUNTA', `${maintenance.type} - €${maintenance.cost}`);
    return newMaintenance;
  }, [update, addLog]);

  const updateMaintenance = useCallback((id: string, updates: Partial<Maintenance>) => {
    update(prev => ({
      ...prev,
      maintenance: prev.maintenance.map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  }, [update]);

  const deleteMaintenance = useCallback((id: string) => {
    const maintenance = dataRef.current.maintenance.find(m => m.id === id);
    update(prev => ({ ...prev, maintenance: prev.maintenance.filter(m => m.id !== id) }));
    if (maintenance) {
      addLog(maintenance.vehicleId, 'MANUTENZIONE_ELIMINATA', `${maintenance.type} eliminata`);
    }
  }, [update, addLog]);

  // CRUD Spese
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    update(prev => ({ ...prev, expenses: [...prev.expenses, newExpense] }));
    addLog(expense.vehicleId, 'SPESA_AGGIUNTA', `${expense.category} - €${expense.amount}`);
    return newExpense;
  }, [update, addLog]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    update(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, [update]);

  const deleteExpense = useCallback((id: string) => {
    const expense = dataRef.current.expenses.find(e => e.id === id);
    update(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
    if (expense) {
      addLog(expense.vehicleId, 'SPESA_ELIMINATA', `${expense.category} eliminata`);
    }
  }, [update, addLog]);

  // CRUD Documenti Legali
  const updateLegalDocument = useCallback((vehicleId: string, updates: Partial<LegalDocument>) => {
    update(prev => {
      const existing = prev.legal.find(l => l.vehicleId === vehicleId);
      if (existing) {
        return { ...prev, legal: prev.legal.map(l => l.vehicleId === vehicleId ? { ...l, ...updates } : l) };
      } else {
        const newLegal: LegalDocument = {
          id: crypto.randomUUID(),
          vehicleId,
          insurance: null,
          tax: null,
          inspection: null,
          ...updates,
        };
        return { ...prev, legal: [...prev.legal, newLegal] };
      }
    });
    addLog(vehicleId, 'DOCUMENTO_AGGIORNATO', 'Documento legale aggiornato');
  }, [update, addLog]);

  // CRUD OBD
  const addOBDReading = useCallback((reading: Omit<OBDReading, 'id'>) => {
    const newReading: OBDReading = { ...reading, id: crypto.randomUUID() };
    update(prev => ({ ...prev, obdLogs: [...prev.obdLogs, newReading] }));
    addLog(reading.vehicleId, 'OBD_LETTURA', `Lettura OBD: ${reading.errorCodes.length} codici`);
    return newReading;
  }, [update, addLog]);

  const deleteOBDReading = useCallback((id: string) => {
    update(prev => ({ ...prev, obdLogs: prev.obdLogs.filter(o => o.id !== id) }));
  }, [update]);

  // CRUD Batterie
  const addBattery = useCallback((battery: Omit<Battery, 'id' | 'createdAt'>) => {
    const newBattery: Battery = { ...battery, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    update(prev => ({ ...prev, batteries: [...prev.batteries, newBattery] }));
    addLog(battery.vehicleId, 'BATTERIA_AGGIUNTA', `${battery.brand} ${battery.voltage}V ${battery.amperage}Ah`);
    return newBattery;
  }, [update, addLog]);

  const updateBattery = useCallback((id: string, updates: Partial<Battery>) => {
    update(prev => ({
      ...prev,
      batteries: prev.batteries.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  }, [update]);

  const deleteBattery = useCallback((id: string) => {
    update(prev => ({ ...prev, batteries: prev.batteries.filter(b => b.id !== id) }));
  }, [update]);

  // CRUD Pneumatici
  const addTire = useCallback((tire: Omit<Tire, 'id' | 'createdAt'>) => {
    const newTire: Tire = { ...tire, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    update(prev => ({ ...prev, tires: [...prev.tires, newTire] }));
    addLog(tire.vehicleId, 'PNEUMATICI_AGGIUNTI', `${tire.brand} ${tire.model} - ${tire.type}`);
    return newTire;
  }, [update, addLog]);

  const updateTire = useCallback((id: string, updates: Partial<Tire>) => {
    update(prev => ({
      ...prev,
      tires: prev.tires.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, [update]);

  const deleteTire = useCallback((id: string) => {
    update(prev => ({ ...prev, tires: prev.tires.filter(t => t.id !== id) }));
  }, [update]);

  // CRUD Ingrassaggio Catena
  const addChainLube = useCallback((chainLube: Omit<ChainLube, 'id' | 'createdAt'>) => {
    const newChainLube: ChainLube = { ...chainLube, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    update(prev => ({ ...prev, chainLubes: [...prev.chainLubes, newChainLube] }));
    addLog(chainLube.vehicleId, 'CATENA_INGRASSATA', `Ingrassaggio a ${chainLube.km} km`);
    return newChainLube;
  }, [update, addLog]);

  const deleteChainLube = useCallback((id: string) => {
    update(prev => ({ ...prev, chainLubes: prev.chainLubes.filter(c => c.id !== id) }));
  }, [update]);

  // Settings & Storage
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    update(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }, [update]);

  const exportData = useCallback(() => {
    return JSON.stringify(dataRef.current, null, 2);
  }, []);

  const importData = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as VehicleManagerData;
      const validated: VehicleManagerData = {
        ...defaultData,
        ...imported,
        batteries: imported.batteries || [],
        tires: imported.tires || [],
        chainLubes: imported.chainLubes || [],
        settings: { ...defaultData.settings, ...(imported.settings || {}) },
      };
      saveToStorage(validated);
      setData(validated);
      return true;
    } catch (error) {
      console.error('Errore import:', error);
      return false;
    }
  }, []);

  const clearAllData = useCallback(() => {
    saveToStorage(defaultData);
    setData(defaultData);
  }, []);

  return {
    data,
    isLoaded,
    getVehicleAnalytics,
    getLegalDeadlines, // Esponiamo la nuova funzione per le scadenze
    addVehicle, updateVehicle, deleteVehicle,
    addMaintenance, updateMaintenance, deleteMaintenance,
    addExpense, updateExpense, deleteExpense,
    updateLegalDocument,
    addOBDReading, deleteOBDReading,
    addBattery, updateBattery, deleteBattery,
    addTire, updateTire, deleteTire,
    addChainLube, deleteChainLube,
    updateSettings,
    addLog,
    exportData, importData, clearAllData,
  };
}