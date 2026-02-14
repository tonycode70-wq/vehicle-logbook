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
  HardDrive
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground">Gestisci preferenze e dati dell'app</p>
      </div>

      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Aspetto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="theme-toggle" className="text-base">Tema scuro</Label>
              <p className="text-sm text-muted-foreground">
                Attiva la modalità scura per ridurre l'affaticamento visivo
              </p>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistiche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Statistiche Dati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Car className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.vehicles}</p>
              <p className="text-sm text-muted-foreground">Veicoli</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{stats.maintenance}</p>
              <p className="text-sm text-muted-foreground">Manutenzioni</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{stats.expenses}</p>
              <p className="text-sm text-muted-foreground">Spese</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{stats.logs}</p>
              <p className="text-sm text-muted-foreground">Log Attività</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{stats.obdReadings}</p>
              <p className="text-sm text-muted-foreground">Letture OBD</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <HardDrive className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{getDataSize()}</p>
              <p className="text-sm text-muted-foreground">Spazio usato</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Totale spese registrate:</span>
            <span className="font-medium">€{totalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted-foreground">Totale manutenzioni:</span>
            <span className="font-medium">€{totalMaintenance.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Backup & Export
          </CardTitle>
          <CardDescription>
            Esporta i tuoi dati per sicurezza o per trasferirli su un altro dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportJSON} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Esporta JSON
            </Button>

            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline"
              disabled={isImporting}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importando...' : 'Importa JSON'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Report PDF per veicolo</h4>
            {data.vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nessun veicolo registrato
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.vehicles.map(vehicle => (
                  <Button
                    key={vehicle.id}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExportPDF(vehicle.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {vehicle.brand} {vehicle.model}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Zona Pericolosa
          </CardTitle>
          <CardDescription>
            Azioni irreversibili. Procedi con cautela.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina tutti i dati
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione cancellerà permanentemente tutti i tuoi dati:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{stats.vehicles} veicoli</li>
                    <li>{stats.maintenance} manutenzioni</li>
                    <li>{stats.expenses} spese</li>
                    <li>{stats.logs} log attività</li>
                    <li>{stats.obdReadings} letture OBD</li>
                  </ul>
                  <p className="mt-3 font-medium">
                    Ti consigliamo di esportare un backup prima di procedere.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Elimina tutto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Info App */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">VehicleManager Pro</p>
            <p>Versione 2.0.0</p>
            <p className="mt-2">
              Gestione completa per auto e moto
            </p>
            <p className="mt-2 text-foreground" style={{ fontFamily: "cursive, 'Apple Chancery', 'Segoe Script', sans-serif" }}>
              App creata da Tony
            </p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="outline">PWA</Badge>
              <Badge variant="outline">Offline Ready</Badge>
              <Badge variant="outline">LocalStorage</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
