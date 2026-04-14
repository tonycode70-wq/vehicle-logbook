import React, { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { VehicleProvider } from '@/contexts/VehicleContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { VehicleList } from '@/components/vehicles/VehicleList';
import { VehicleDetail } from '@/components/vehicles/VehicleDetail';
import { LegalStatus } from '@/components/legal/LegalStatus';
import { MaintenanceList } from '@/components/maintenance/MaintenanceList';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { Analytics } from '@/components/analytics/Analytics';
import { History } from '@/components/history/History';
import { OBDDiagnostics } from '@/components/obd/OBDDiagnostics';
import { Settings } from '@/components/settings/Settings';
import { TabId } from '@/config/tabs';
import { Toaster } from '@/components/ui/toaster';
import { FleetAlerts } from "@/components/dashboard/FleetAlerts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VehicleForm } from '@/components/vehicles/VehicleForm';
import { Vehicle } from '@/types/vehicle';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return (
        <Dashboard 
          onAddVehicle={() => setIsAddingVehicle(true)} 
          onSelectVehicle={setSelectedVehicleId}
          onEditVehicle={(vehicle) => setVehicleToEdit(vehicle)}
          onTabChange={handleTabChange}
        />
      );
      
      case 'vehicles': 
        if (selectedVehicleId) {
          return (
            <VehicleDetail 
              vehicleId={selectedVehicleId} 
              onBack={() => setSelectedVehicleId(null)}
              onEdit={(vehicle) => setVehicleToEdit(vehicle)} // Permette la modifica dal dettaglio
            />
          );
        }
        return (
          <VehicleList 
            onSelectVehicle={setSelectedVehicleId} 
            onEditVehicle={setVehicleToEdit} // Permette la modifica dalla lista
            onAddVehicle={() => setIsAddingVehicle(true)}
          />
        );
        
      case 'legal': return <LegalStatus />;
      case 'maintenance': return <MaintenanceList />;
      case 'expenses': return <ExpenseList />;
      case 'analytics': return <Analytics />;
      case 'history': return <History />;
      case 'obd': return <OBDDiagnostics />;
      case 'settings': return <Settings />;
      default: return <Dashboard onAddVehicle={() => setIsAddingVehicle(true)} />;
    }
  };

  const handleTabChange = (tab: TabId) => {
    setCurrentTab(tab);
    setSelectedVehicleId(null);
  };

  return (
    <AppLayout 
      currentTab={currentTab} 
      onTabChange={handleTabChange}
      onAddVehicle={() => setIsAddingVehicle(true)}
    >
      <FleetAlerts /> 
      
      {renderContent()}

      {/* Dialog Unificato per la Modifica (accessibile da ovunque) */}
      <Dialog open={!!vehicleToEdit} onOpenChange={(open) => !open && setVehicleToEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Veicolo</DialogTitle>
            <DialogDescription>Aggiorna i dati tecnici o anagrafici del veicolo.</DialogDescription>
          </DialogHeader>
          {vehicleToEdit && (
            <VehicleForm 
              vehicle={vehicleToEdit} 
              onComplete={() => setVehicleToEdit(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Unificato per l'Aggiunta */}
      <Dialog open={isAddingVehicle} onOpenChange={setIsAddingVehicle}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aggiungi Veicolo</DialogTitle>
            <DialogDescription>Inserisci i dati del nuovo veicolo da gestire.</DialogDescription>
          </DialogHeader>
          <VehicleForm 
            onComplete={() => setIsAddingVehicle(false)}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export default function Index() {
  return (
    <ThemeProvider>
      <VehicleProvider>
        <AppContent />
        <Toaster />
      </VehicleProvider>
    </ThemeProvider>
  );
}