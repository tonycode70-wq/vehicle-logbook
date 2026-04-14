import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Bike, 
  Calendar, 
  Settings, 
  FileText, 
  Shield, 
  Wrench,
  ChevronLeft,
  Plus,
  Info,
  Droplets,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { formatKm, formatDate } from '@/lib/utils/dates';
import { calculateVehicleAge, calculateRoadTaxStatus, estimateEuroClass } from '@/lib/utils/vehicleCalculations';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types/vehicle';
import { InsuranceForm } from '@/components/legal/InsuranceForm';
import { TaxForm } from '@/components/legal/TaxForm';
import { InspectionForm } from '@/components/legal/InspectionForm';

interface VehicleDetailProps {
  vehicleId: string;
  onBack: () => void;
  onEdit?: (vehicle: Vehicle) => void; // Aggiunto per gestire la modifica
}

export function VehicleDetail({ vehicleId, onBack, onEdit }: VehicleDetailProps) {
  const { data } = useVehicleContext();
  const [showDocForm, setShowDocForm] = useState<null | 'insurance' | 'tax' | 'inspection'>(null);
  
  const vehicle = useMemo(() => 
    data.vehicles.find(v => v.id === vehicleId), 
    [data.vehicles, vehicleId]
  );

  const legalInfo = useMemo(() => 
    data.legal.find(l => l.vehicleId === vehicleId), 
    [data.legal, vehicleId]
  );

  const ageData = useMemo(() => 
    vehicle?.registrationDate ? calculateVehicleAge(vehicle.registrationDate) : { ageYears: 0 },
    [vehicle?.registrationDate]
  );

  const taxStatus = useMemo(() => 
    vehicle ? calculateRoadTaxStatus(vehicle, ageData.ageYears) : 'N/D',
    [vehicle, ageData.ageYears]
  );

  if (!vehicle) return null;

  const horsepower = vehicle.power ? Math.round(Number(vehicle.power) * 1.35962) : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-primary transition-all w-fit group">
          <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-bold uppercase tracking-widest text-xs">Torna alla flotta</span>
        </Button>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl px-6 font-bold border-primary/20 text-primary hover:bg-primary/10 transition-all"
            onClick={() => onEdit?.(vehicle)}
          >
            Modifica
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl px-6 font-bold border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"
          >
            Elimina
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="luxury-card p-8 text-center space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="mx-auto h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.1)] group-hover:scale-105 transition-transform duration-500">
              {vehicle.type === 'auto' ? <Car className="h-12 w-12 text-primary" /> : <Bike className="h-12 w-12 text-primary" />}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white gold-text-gradient uppercase tracking-tight">{vehicle.brand} {vehicle.model}</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-bold mt-2 opacity-50">
                {vehicle.plate}
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                {vehicle.fuel}
              </Badge>
              <Badge className="bg-white/5 text-white border-white/10 px-4 py-1.5 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                {ageData.ageYears} anni
              </Badge>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 grid gap-6 sm:grid-cols-2">
          <div className="luxury-card p-8 flex flex-col justify-center space-y-2 group">
            <div className="flex items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Chilometraggio</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{formatKm(vehicle.currentKm)}</div>
          </div>
          <div className="luxury-card p-8 flex flex-col justify-center space-y-2 group">
            <div className="flex items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
              <Droplets className="h-5 w-5 text-primary" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Alimentazione</span>
            </div>
            <div className="text-3xl font-extrabold text-white capitalize">{vehicle.fuel}</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 luxury-card p-1.5 h-16 border-white/5 shadow-2xl">
          <TabsTrigger value="info" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all">Specifiche</TabsTrigger>
          <TabsTrigger value="docs" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all">Documenti</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all">Cronologia</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-8 space-y-6">
          <div className="luxury-card p-8 space-y-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 border-b border-white/5 pb-4">Anagrafica Tecnica</h3>
            <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
              <div className="flex justify-between items-center py-4 border-b border-white/5 group">
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">Immatricolazione</span>
                <span className="font-extrabold text-sm text-white group-hover:text-primary transition-colors">
                  {vehicle.registrationDate ? formatDate(vehicle.registrationDate) : 'N/D'}
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/5 group">
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">Classe Ambientale</span>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1 rounded-lg font-bold">
                  Euro {estimateEuroClass(vehicle)}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/5 group">
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">Stato Bollo</span>
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg font-bold uppercase text-[9px] tracking-tighter">
                  {taxStatus || 'N/D'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/5 group">
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">Potenza</span>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-white group-hover:text-primary transition-colors block">
                    {vehicle.power ? `${vehicle.power} kW` : 'N/D'}
                  </span>
                  {horsepower && (
                    <span className="text-[10px] text-muted-foreground font-bold uppercase opacity-30 tracking-widest">({horsepower} CV)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-8">
          <div className="luxury-card p-8 space-y-6">
            <div className="flex items-center justify-between p-5 luxury-card border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/10 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white group-hover:text-primary transition-colors uppercase tracking-widest">Assicurazione</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    Scade il {legalInfo?.insurance ? formatDate((legalInfo.insurance as any).dataScadenzaAttuale || legalInfo.insurance.endDate) : 'N/D'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-xl">Vedi</Button>
            </div>
            
            <div className="flex items-center justify-between p-5 luxury-card border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/10 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white group-hover:text-primary transition-colors uppercase tracking-widest">Libretto di Circolazione</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Documento caricato</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-xl">Vedi</Button>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-16 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold rounded-2xl gap-3 transition-all" 
              onClick={() => setShowDocForm('insurance')}
            >
              <Plus className="h-5 w-5" />
              Aggiungi Documento Premium
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-8">
          <div className="luxury-card p-16 text-center space-y-6">
            <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto border border-primary/10">
              <Info className="h-10 w-10 text-primary/40" />
            </div>
            <div className="max-w-md mx-auto">
              <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                Il report storico completo per <span className="text-white font-bold">{vehicle.brand} {vehicle.model}</span> è pronto. 
                Puoi consultare l'analisi dettagliata nella sezione <span className="text-primary font-bold">Analytics</span> o scaricare il PDF ufficiale.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={!!showDocForm} onOpenChange={(open) => !open && setShowDocForm(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border-primary/20 rounded-[32px] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-extrabold text-white gold-text-gradient uppercase tracking-tight">
              {showDocForm === 'insurance' && 'Assicurazione'}
              {showDocForm === 'tax' && 'Bollo'}
              {showDocForm === 'inspection' && 'Revisione'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Gestisci documenti per questo veicolo
            </DialogDescription>
          </DialogHeader>
          {showDocForm === 'insurance' && (
            <InsuranceForm vehicleId={vehicleId} onComplete={() => setShowDocForm(null)} />
          )}
          {showDocForm === 'tax' && (
            <TaxForm vehicleId={vehicleId} onComplete={() => setShowDocForm(null)} />
          )}
          {showDocForm === 'inspection' && (
            <InspectionForm vehicleId={vehicleId} onComplete={() => setShowDocForm(null)} />
          )}
          {!['insurance','tax','inspection'].includes(String(showDocForm)) && (
            <div className="grid gap-2">
              <Button variant="secondary" onClick={() => setShowDocForm('insurance')}>Aggiungi Assicurazione</Button>
              <Button variant="secondary" onClick={() => setShowDocForm('tax')}>Aggiungi Bollo</Button>
              <Button variant="secondary" onClick={() => setShowDocForm('inspection')}>Aggiungi Revisione</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
