import React, { useRef, useState } from 'react';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { downloadJSON } from '@/lib/utils/export';
import { downloadVehiclePDF } from '@/lib/utils/pdfGenerator';
import { calculateVehicleAge, calculateRoadTaxStatus, calculateEfficiencyIndex } from '@/lib/utils/vehicleCalculations';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  FileText,
  Trash2,
  Moon,
  Sun,
  Car,
  Database,
  Shield,
  HardDrive,
  Wrench,
  Receipt
} from 'lucide-react';

export function Settings() {
  const { data, importData, clearAllData } = useVehicleContext();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Calcola statistiche
  const stats = {
    vehicles: data.vehicles.length,
    maintenance: data.maintenance.length,
    expenses: data.expenses.length,
    logs: data.logs.length,
    obdReadings: data.obdLogs.length,
  };

  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMaintenance = data.maintenance.reduce((sum, m) => sum + m.cost, 0);

  // Export JSON
  const handleExportJSON = () => {
    downloadJSON(data, 'vehiclemanager-backup');
    toast({
      title: 'Backup esportato',
      description: 'Il file JSON è stato scaricato',
    });
  };

  // Import JSON
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = importData(content);
        
        if (success) {
          toast({ 
            title: 'Importazione completata',
            description: 'I dati sono stati ripristinati con successo',
          });
        } else {
          throw new Error('Formato non valido');
        }
      } catch (error) {
        toast({
          title: 'Errore importazione',
          description: 'Il file non è un backup valido',
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      toast({
        title: 'Errore lettura file',
        description: 'Impossibile leggere il file selezionato',
        variant: 'destructive',
      });
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  // Export PDF per veicolo
  const handleExportPDF = (vehicleId: string) => {
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const vehicleMaintenance = data.maintenance.filter(m => m.vehicleId === vehicleId);
    const vehicleExpenses = data.expenses.filter(e => e.vehicleId === vehicleId);

    const legal = data.legal.find(l => l.vehicleId === vehicleId) || { insurance: null, tax: null, inspection: null };
    const battery = data.batteries.find(b => b.vehicleId === vehicleId);
    const tire = data.tires.find(t => t.vehicleId === vehicleId);

    const ageData = vehicle.registrationDate ? calculateVehicleAge(vehicle.registrationDate) : { ageYears: 0, category: 'New' as any };
    const roadTaxStatus = calculateRoadTaxStatus(vehicle, ageData.ageYears);
    const efficiencyIndex = calculateEfficiencyIndex(vehicle, vehicleMaintenance);
    const totalCostOfOwnership = vehicleExpenses.reduce((s, e) => s + e.amount, 0) + vehicleMaintenance.reduce((s, m) => s + m.cost, 0);

    downloadVehiclePDF({
      vehicle,
      ageData,
      roadTaxStatus,
      efficiencyIndex,
      legal: {
        insurance: legal.insurance || undefined,
        tax: legal.tax || undefined,
        inspection: legal.inspection || undefined,
      },
      technical: {
        battery: battery || undefined,
        tire: tire || undefined,
      },
      maintenance: vehicleMaintenance,
      expenses: vehicleExpenses,
      totalCostOfOwnership
    });
    
    toast({
      title: 'Report PDF generato',
      description: `Report storico generato correttamente per: ${vehicle.brand} ${vehicle.model}`,
    });
  };

  // Reset dati
  const handleClearData = () => {
    clearAllData();
    toast({
      title: 'Dati eliminati',
      description: 'Tutti i dati sono stati cancellati',
    });
  };

  // Stima dimensione dati
  const getDataSize = () => {
    const json = JSON.stringify(data);
    const bytes = new Blob([json]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 bg-[#0D0D0D] min-h-screen px-4">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(to_right,#D4AF37,#FBE795,#8A6621)] uppercase playfair-display mb-2">Impostazioni</h1>
        <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Gestisci preferenze e dati dell'app</p>
      </div>

      {/* Tema */}
      <div className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-8 border border-[#D4AF37]/10 rounded-[32px] shadow-2xl transition-all duration-500 hover:border-[#D4AF37]/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20">
            {theme === 'dark' ? <Moon className="h-6 w-6 text-[#D4AF37]" /> : <Sun className="h-6 w-6 text-[#D4AF37]" />}
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Aspetto Premium</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="theme-toggle" className="text-base font-bold text-white">Modalità Dark Gold</Label>
            <p className="text-sm text-muted-foreground opacity-70">
              Ottimizza l'interfaccia per un'esperienza visiva esclusiva
            </p>
          </div>
          <Switch
            id="theme-toggle"
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
            className="data-[state=checked]:bg-[#D4AF37]"
          />
        </div>
      </div>

      {/* Statistiche */}
      <div className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-8 border border-[#D4AF37]/10 rounded-[32px] shadow-2xl transition-all duration-500 hover:border-[#D4AF37]/30">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20">
            <Database className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Statistiche Flotta</h2>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Veicoli', value: stats.vehicles, icon: <Car className="h-5 w-5" /> },
            { label: 'Manutenzioni', value: stats.maintenance, icon: <Wrench className="h-5 w-5" /> },
            { label: 'Spese', value: stats.expenses, icon: <Receipt className="h-5 w-5" /> },
            { label: 'Log Attività', value: stats.logs, icon: <FileText className="h-5 w-5" /> },
            { label: 'Letture OBD', value: stats.obdReadings, icon: <Database className="h-5 w-5" /> },
            { label: 'Spazio Usato', value: getDataSize(), icon: <HardDrive className="h-5 w-5" /> },
          ].map((item, i) => (
            <div key={i} className="text-center p-6 bg-black/40 rounded-3xl border border-white/5 group hover:border-[#D4AF37]/20 transition-all duration-500">
              <div className="h-10 w-10 mx-auto mb-4 bg-white/5 rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-[#D4AF37] group-hover:bg-[#D4AF37]/10 transition-all">
                {item.icon}
              </div>
              <p className="text-2xl font-extrabold text-white group-hover:text-[#D4AF37] transition-colors">{item.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4 border-t border-white/5 pt-8">
          <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Volume Spese Totali:</span>
            <span className="text-lg font-extrabold text-[#FBE795] drop-shadow-[0_0_5px_rgba(251,231,149,0.3)]">€{totalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Investimento Manutenzione:</span>
            <span className="text-lg font-extrabold text-[#FBE795] drop-shadow-[0_0_5px_rgba(251,231,149,0.3)]">€{totalMaintenance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Backup & Export */}
      <div className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-8 border border-[#D4AF37]/10 rounded-[32px] shadow-2xl transition-all duration-500 hover:border-[#D4AF37]/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20">
            <Shield className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Caveau Dati</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-8 opacity-70 uppercase tracking-widest text-[9px]">Esporta i tuoi dati per sicurezza o per trasferirli su un nuovo dispositivo</p>
        
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={handleExportJSON} variant="outline" className="h-12 rounded-2xl border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold uppercase tracking-widest text-[10px] px-6">
            <Download className="h-4 w-4 mr-2" />
            Esporta Backup
          </Button>

          <Button 
            onClick={() => fileInputRef.current?.click()} 
            variant="outline"
            disabled={isImporting}
            className="h-12 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] px-6"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Ripristino in corso...' : 'Importa Backup'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="border-t border-white/5 pt-8">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">Certificati e Report Storici</h4>
          {data.vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground opacity-50 italic">
              Nessun veicolo registrato nella flotta
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.vehicles.map(vehicle => (
                <Button
                  key={vehicle.id}
                  variant="secondary"
                  className="h-14 rounded-2xl bg-white/5 border border-white/5 text-white hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 font-bold flex items-center justify-between px-6 transition-all group"
                  onClick={() => handleExportPDF(vehicle.id)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-[#D4AF37]" />
                    <span className="uppercase tracking-widest text-[10px]">{vehicle.brand} {vehicle.model}</span>
                  </div>
                  <Download className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 backdrop-blur-[10px] p-8 border border-red-500/20 rounded-[32px] shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-500 uppercase tracking-tight">Zona Pericolosa</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-8 opacity-70">Azioni irreversibili. Tutti i dati verranno eliminati permanentemente.</p>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-[10px] px-8 shadow-lg shadow-red-500/20">
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Totale Flotta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-black/95 backdrop-blur-2xl border-red-500/20 rounded-[32px] p-8">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-extrabold text-white uppercase tracking-tight">Conferma Reset Totale</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground font-medium">
                Questa azione cancellerà permanentemente tutti i tuoi dati:
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-white font-bold"><div className="h-1.5 w-1.5 rounded-full bg-red-500" /> {stats.vehicles} veicoli</li>
                  <li className="flex items-center gap-2 text-white font-bold"><div className="h-1.5 w-1.5 rounded-full bg-red-500" /> {stats.maintenance} manutenzioni</li>
                  <li className="flex items-center gap-2 text-white font-bold"><div className="h-1.5 w-1.5 rounded-full bg-red-500" /> {stats.expenses} spese</li>
                </ul>
                <p className="mt-6 text-red-500/80 font-bold uppercase tracking-widest text-[10px]">
                  Ti consigliamo vivamente di esportare un backup prima di procedere.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="rounded-xl font-bold bg-white/5 border-white/10 text-white hover:bg-white/10">Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearData}
                className="rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 border-0 shadow-lg shadow-red-500/20"
              >
                Elimina Tutto
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Info App */}
      <div className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-8 border border-white/5 rounded-[32px] text-center">
        <p className="font-extrabold text-white uppercase tracking-[0.4em] text-xs gold-text-gradient mb-2">Barons Veicoli</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 mb-6">Automotive Management System v2.0</p>
        
        <div className="flex justify-center gap-3">
          {['PWA', 'Offline Ready', 'AES Encryption'].map((badge, i) => (
            <Badge key={i} variant="outline" className="bg-white/5 border-white/10 text-muted-foreground font-bold text-[8px] uppercase tracking-widest px-3 py-1">
              {badge}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
