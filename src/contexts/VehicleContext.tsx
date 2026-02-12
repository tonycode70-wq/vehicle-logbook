import React, { createContext, useContext, ReactNode } from 'react';
import { useVehicleData } from '@/hooks/useVehicleData';

type VehicleContextType = ReturnType<typeof useVehicleData>;

const VehicleContext = createContext<VehicleContextType | null>(null);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const vehicleData = useVehicleData();

  return (
    <VehicleContext.Provider value={vehicleData}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicleContext() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicleContext deve essere usato dentro VehicleProvider');
  }
  return context;
}
