import React, { useState, useRef } from 'react';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
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
import { formatDate } from '@/lib/utils/dates';
import { useToast } from '@/hooks/use-toast';
import { Database, Upload, Plus, Trash2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export function OBDDiagnostics() {
  const { data, addOBDReading, deleteOBDReading } = useVehicleContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedVehicle, setSelectedVehicle] = useState<string>(data.vehicles[0]?.id || '');
  const [manualCodes, setManualCodes] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filtra letture per veicolo selezionato
  const vehicleReadings = data.obdLogs
    .filter(r => r.vehicleId === selectedVehicle)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedVehicle) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Parsing semplice CSV: prima riga header, resto dati
        const errorCodes: string[] = [];
        const obdData: Record<string, string | number> = {};
        
        lines.forEach((line, index) => {
          if (index === 0) return; // Skip header
          
          const parts = line.split(',').map(p => p.trim());
          if (parts[0]?.startsWith('P') || parts[0]?.startsWith('C') || 
              parts[0]?.startsWith('B') || parts[0]?.startsWith('U')) {
            errorCodes.push(parts[0]);
          }
          
          // Se ci sono coppie chiave-valore
          if (parts.length >= 2) {
            const key = parts[0];
            const value = parts[1];
            if (key && value && !key.match(/^[PCBU]\d/)) {
              obdData[key] = isNaN(Number(value)) ? value : Number(value);
            }
          }
        });

        addOBDReading({
          vehicleId: selectedVehicle,
          date: new Date().toISOString(),
          errorCodes,
          data: obdData,
          notes: `Importato da: ${file.name}`,
        });

        toast({
          title: 'File importato',
          description: `Trovati ${errorCodes.length} codici errore`,
        });
      } catch (error) {
        toast({
          title: 'Errore importazione',
          description: 'Formato file non valido',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualAdd = () => {
    if (!selectedVehicle) return;

    const codes = manualCodes
      .split(/[,\n\s]+/)
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length > 0);

    addOBDReading({
      vehicleId: selectedVehicle,
      date: new Date().toISOString(),
      errorCodes: codes,
      data: {},
      notes: manualNotes,
    });

    setManualCodes('');
    setManualNotes('');
    setIsDialogOpen(false);

    toast({
      title: 'Lettura aggiunta',
      description: `Registrati ${codes.length} codici`,
    });
  };

  const handleDelete = (id: string) => {
    deleteOBDReading(id);
    toast({
      title: 'Lettura eliminata',
      description: 'La lettura OBD è stata rimossa',
    });
  };

  const getCodeSeverity = (code: string): 'error' | 'warning' | 'info' => {
    if (code.startsWith('P0') || code.startsWith('P1')) return 'error';
    if (code.startsWith('P2') || code.startsWith('P3')) return 'warning';
    return 'info';
  };

  if (data.vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Diagnostica OBD</h1>
        <p className="text-muted-foreground mt-2">Aggiungi almeno un veicolo per registrare letture OBD</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Diagnostica OBD</h1>
          <p className="text-muted-foreground">Gestione codici errore e letture diagnostiche</p>
        </div>

        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Seleziona veicolo" />
          </SelectTrigger>
          <SelectContent>
            {data.vehicles.map(v => (
              <SelectItem key={v.id} value={v.id}>
                {v.brand} {v.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Azioni */}
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedVehicle}
        >
          <Upload className="h-4 w-4 mr-2" />
          Importa CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedVehicle}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Manuale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Lettura OBD</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Codici Errore</label>
                <Textarea
                  placeholder="Es: P0300, P0171, C0035&#10;(uno per riga o separati da virgola)"
                  value={manualCodes}
                  onChange={(e) => setManualCodes(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Inserisci i codici OBD-II (P, C, B, U)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Note</label>
                <Textarea
                  placeholder="Note opzionali..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button onClick={handleManualAdd} disabled={!manualCodes.trim()}>
                Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info formato */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Formato CSV supportato</p>
              <p className="text-muted-foreground">
                Il file deve contenere una colonna con i codici OBD-II (es: P0300, C0035, B1234, U0100).
                La prima riga viene considerata come header.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storico letture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Storico Letture</span>
            <Badge variant="secondary">{vehicleReadings.length} letture</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicleReadings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessuna lettura OBD per questo veicolo</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {vehicleReadings.map((reading) => (
                  <div
                    key={reading.id}
                    className="p-4 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {reading.errorCodes.length > 0 ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <span className="font-medium">
                          {formatDate(reading.date, 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Elimina lettura</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sei sicuro di voler eliminare questa lettura OBD?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(reading.id)}>
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {reading.errorCodes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {reading.errorCodes.map((code, index) => {
                          const severity = getCodeSeverity(code);
                          return (
                            <Badge 
                              key={index}
                              variant={severity === 'error' ? 'destructive' : severity === 'warning' ? 'secondary' : 'outline'}
                            >
                              {code}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                        ✓ Nessun codice errore
                      </p>
                    )}

                    {Object.keys(reading.data).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                        {Object.entries(reading.data).slice(0, 6).map(([key, value]) => (
                          <div key={key} className="text-xs bg-background/50 p-2 rounded">
                            <span className="text-muted-foreground">{key}:</span>{' '}
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {reading.notes && (
                      <p className="text-sm text-muted-foreground">{reading.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Legenda codici */}
      <Card>
        <CardHeader>
          <CardTitle>Legenda Codici OBD-II</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Pxxxx</Badge>
              <span>Powertrain (motore/trasmissione)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Cxxxx</Badge>
              <span>Chassis (telaio)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Bxxxx</Badge>
              <span>Body (carrozzeria)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Uxxxx</Badge>
              <span>Network (comunicazione)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
