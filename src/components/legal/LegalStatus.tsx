import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Shield, FileCheck, Calendar, AlertTriangle, CheckCircle2, Clock, Car, Bike } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { InsuranceForm } from './InsuranceForm';
import { TaxForm } from './TaxForm';
import { InspectionForm } from './InspectionForm';

// --- MODIFICA INTEGRATA: Import dal file delle utility per le esenzioni ---
import { formatDate, formatCurrency, calculateLegalStatus, getDaysUntilExpiry } from '@/lib/utils/dates';
import { 
  calculateRoadTaxStatus, 
  calculateNextInspectionDate 
} from '@/lib/utils/vehicleCalculations'; 
// -------------------------------------------------------------------------

import { cn } from '@/lib/utils';

type LegalTab = 'insurance' | 'tax' | 'inspection';

export function LegalStatus() {
  const { data, updateLegalDocument, sospendiPolizza, riattivaPolizza } = useVehicleContext();
  const [selectedVehicle, setSelectedVehicle] = useState<string>(() => {
    const saved = localStorage.getItem('selectedVehicleId');
    return saved || 'all';
  });
  useEffect(() => {
    localStorage.setItem('selectedVehicleId', selectedVehicle);
  }, [selectedVehicle]);
  const [activeTab, setActiveTab] = useState<LegalTab>('insurance');
  const [showForm, setShowForm] = useState<{ type: LegalTab; vehicleId: string } | null>(null);

  const getStatusBadge = (status: string | null, daysLeft?: number | null) => {
    if (!status || status === 'missing') {
      return <Badge variant="outline" className="border-white/10 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Non configurato</Badge>;
    }
    
    switch (status) {
      case 'ok': 
        return (
          <Badge variant="success" className="gap-1 bg-green-500/10 text-green-500 border-green-500/20 uppercase text-[10px] font-bold tracking-widest px-3 py-1">
            <CheckCircle2 className="h-3 w-3" />
            In regola
          </Badge>
        );
      case 'in_scadenza': 
        return (
          <Badge variant="warning" className="gap-1 bg-primary/10 text-primary border-primary/20 uppercase text-[10px] font-bold tracking-widest px-3 py-1 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            <Clock className="h-3 w-3" />
            {daysLeft !== undefined && daysLeft !== null ? `${daysLeft} GIORNI` : 'IN SCADENZA'}
          </Badge>
        );
      case 'scaduto': 
        return (
          <Badge variant="destructive" className="gap-1 bg-red-500/10 text-red-500 border-red-500/20 uppercase text-[10px] font-bold tracking-widest px-3 py-1">
            <AlertTriangle className="h-3 w-3" />
            Scaduto
          </Badge>
        );
      default: 
        return null;
    }
  };

  const filteredVehicles = useMemo(() => {
    return selectedVehicle === 'all' 
      ? data.vehicles 
      : data.vehicles.filter(v => v.id === selectedVehicle);
  }, [selectedVehicle, data.vehicles]);

  const getLegalData = (vehicleId: string) => {
    return data.legal.find(l => l.vehicleId === vehicleId);
  };

  // --- LOGICA REVISIONE AUTOMATICA INTEGRATA ---
  const getInspectionInfo = (vehicleId: string) => {
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    const legal = getLegalData(vehicleId);
    const inspection = legal?.inspection;

    if (inspection?.nextDate) {
      return { ...inspection, isAuto: false };
    }

    if (vehicle?.registrationDate) {
      const nextDate = calculateNextInspectionDate(vehicle.registrationDate);
      return {
        nextDate: nextDate.toISOString(),
        lastDate: null,
        result: 'da_effettuare',
        isAuto: true
      };
    }
    return null;
  };

  // Calculate overall stats
  const stats = useMemo(() => {
    let okCount = 0;
    let warningCount = 0;
    let expiredCount = 0;
    let missingCount = 0;

    data.vehicles.forEach(vehicle => {
      const legal = getLegalData(vehicle.id);
      
      // Check insurance
      if (legal?.insurance?.endDate) {
        const status = calculateLegalStatus(legal.insurance.endDate);
        if (status === 'ok') okCount++;
        else if (status === 'in_scadenza') warningCount++;
        else expiredCount++;
      } else {
        missingCount++;
      }

      // Check tax (Modificato per considerare esenzioni Legge 104)
      const taxStatus = calculateRoadTaxStatus(vehicle);
      if (taxStatus !== 'Payable') {
        okCount++;
      } else if (legal?.tax?.dueDate) {
        const status = calculateLegalStatus(legal.tax.dueDate);
        if (status === 'ok') okCount++;
        else if (status === 'in_scadenza') warningCount++;
        else expiredCount++;
      } else {
        missingCount++;
      }

      // Check inspection (Aggiornato con logica automatica)
      const inspInfo = getInspectionInfo(vehicle.id);
      if (inspInfo?.nextDate) {
        const status = calculateLegalStatus(inspInfo.nextDate);
        if (status === 'ok') okCount++;
        else if (status === 'in_scadenza') warningCount++;
        else expiredCount++;
      } else {
        missingCount++;
      }
    });

    return { okCount, warningCount, expiredCount, missingCount };
  }, [data.vehicles, data.legal]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 bg-[#0D0D0D] min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(to_right,#D4AF37,#FBE795,#8A6621)] uppercase playfair-display mb-2">Stato Legale</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Gestisci assicurazione, bollo e revisione dei tuoi veicoli di lusso</p>
        </div>
      </div>

      {/* Stats Cards */}
      {data.vehicles.length > 0 && (
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 px-4">
          <div className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-6 border border-[#D4AF37]/20 rounded-3xl group hover:border-[#D4AF37]/40 transition-all duration-500 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                <CheckCircle2 className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{stats.okCount}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">In regola</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-6 border border-[#D4AF37]/20 rounded-3xl group hover:border-[#D4AF37]/40 transition-all duration-500 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-primary drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{stats.warningCount}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">In scadenza</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-6 border border-red-500/20 rounded-3xl group hover:border-red-500/40 transition-all duration-500 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">{stats.expiredCount}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Scaduti</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-6 border border-white/5 rounded-3xl group transition-all duration-500 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">{stats.missingCount}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Da impostare</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtro veicolo */}
      <div className="px-4">
        <div className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-6 border border-[#D4AF37]/10 rounded-3xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
                <Car className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-[0.2em]">Veicolo:</span>
            </div>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-full sm:w-[300px] h-12 bg-black/40 border-white/10 focus:ring-[#D4AF37]/20 rounded-xl font-bold text-white">
                <SelectValue placeholder="Seleziona veicolo" />
              </SelectTrigger>
              <SelectContent className="bg-black/95 backdrop-blur-2xl border-[#D4AF37]/20 rounded-xl">
                <SelectItem value="all" className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37] font-bold uppercase tracking-widest text-[10px]">Tutti i veicoli</SelectItem>
                {data.vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37] font-bold uppercase tracking-widest text-[10px]">
                    {v.brand} {v.model} ({v.plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs per tipo documento */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LegalTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1E1E1E]/80 backdrop-blur-[10px] p-1.5 h-16 border border-[#D4AF37]/10 rounded-3xl shadow-2xl overflow-hidden">
            <TabsTrigger value="insurance" className="rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-[linear-gradient(135deg,#D4AF37_0%,#FBE795_50%,#C5A028_100%)] data-[state=active]:text-black transition-all duration-500 gap-2 border border-transparent data-[state=active]:border-white/20">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Assicurazione</span>
            </TabsTrigger>
            <TabsTrigger value="tax" className="rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-[linear-gradient(135deg,#D4AF37_0%,#FBE795_50%,#C5A028_100%)] data-[state=active]:text-black transition-all duration-500 gap-2 border border-transparent data-[state=active]:border-white/20">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Bollo Auto</span>
            </TabsTrigger>
            <TabsTrigger value="inspection" className="rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-[linear-gradient(135deg,#D4AF37_0%,#FBE795_50%,#C5A028_100%)] data-[state=active]:text-black transition-all duration-500 gap-2 border border-transparent data-[state=active]:border-white/20">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Revisione</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {filteredVehicles.map(vehicle => {
              const legal = getLegalData(vehicle.id);
              const inspectionInfo = getInspectionInfo(vehicle.id);
              
              let status: string | null = 'missing';
              let date: string | undefined = undefined;
              let amount: number | undefined = undefined;
              let daysLeft: number | null = null;

              if (activeTab === 'insurance') {
                date = legal?.insurance?.endDate;
                amount = legal?.insurance?.amount;
                status = date ? calculateLegalStatus(date) : 'missing';
                if (date) daysLeft = getDaysUntilExpiry(date);
              } else if (activeTab === 'tax') {
                const taxStatus = calculateRoadTaxStatus(vehicle);
                if (taxStatus !== 'Payable') {
                  status = 'ok';
                  date = 'Esenzione attiva';
                } else {
                  date = legal?.tax?.dueDate;
                  amount = legal?.tax?.amount;
                  status = date ? calculateLegalStatus(date) : 'missing';
                  if (date) daysLeft = getDaysUntilExpiry(date);
                }
              } else if (activeTab === 'inspection') {
                date = inspectionInfo?.nextDate;
                status = date ? calculateLegalStatus(date) : 'missing';
                if (date) daysLeft = getDaysUntilExpiry(date);
              }

              return (
                <div key={vehicle.id} className="bg-[#1E1E1E]/80 backdrop-blur-[10px] p-8 flex flex-col justify-between group border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 rounded-[32px] transition-all duration-500 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    {activeTab === 'insurance' ? <Shield size={80} className="text-[#D4AF37]" /> : activeTab === 'tax' ? <FileCheck size={80} className="text-[#D4AF37]" /> : <Calendar size={80} className="text-[#D4AF37]" />}
                  </div>

                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                        {vehicle.type === 'auto' ? <Car className="h-7 w-7 text-[#D4AF37]" /> : <Bike className="h-7 w-7 text-[#D4AF37]" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#F5F5F5] group-hover:text-[#D4AF37] transition-colors duration-300 uppercase tracking-tighter">{vehicle.brand} {vehicle.model}</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-60 mt-1">{vehicle.plate}</p>
                      </div>
                    </div>
                    {getStatusBadge(status, daysLeft)}
                  </div>

                  <div className="space-y-5 relative z-10">
                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                      <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em]">
                        {activeTab === 'insurance' ? 'Scadenza Polizza' : activeTab === 'tax' ? 'Scadenza Bollo' : 'Prossima Revisione'}
                      </span>
                      <span className={cn(
                        "text-sm font-bold tracking-tight",
                        date === 'Esenzione attiva' ? "text-[#D4AF37]" : "text-white"
                      )}>
                        {date && date !== 'Esenzione attiva' ? formatDate(date) : date || 'Non impostata'}
                      </span>
                    </div>
                    {amount !== undefined && (
                      <div className="flex justify-between items-center py-4 border-b border-white/5">
                        <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em]">Importo Premium</span>
                        <span className="text-sm font-bold text-[#FBE795] drop-shadow-[0_0_5px_rgba(251,231,149,0.3)]">{formatCurrency(amount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex gap-4 relative z-10">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-2xl font-bold uppercase tracking-widest text-[10px] h-12 bg-[linear-gradient(135deg,#D4AF37_0%,#FBE795_50%,#C5A028_100%)] text-black border-none hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95"
                      onClick={() => setShowForm({ type: activeTab, vehicleId: vehicle.id })}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifica
                    </Button>
                    
                    {activeTab === 'insurance' && legal?.insurance && (
                      legal.insurance.statoPolizza === 'attiva' ? (
                        <Button 
                          variant="outline" 
                          className="rounded-2xl font-bold uppercase tracking-widest text-[10px] h-12 border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 px-6 transition-all active:scale-95"
                          onClick={() => sospendiPolizza(vehicle.id)}
                        >
                          Sospendi
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="rounded-2xl font-bold uppercase tracking-widest text-[10px] h-12 border border-green-500/30 text-green-500 bg-green-500/5 hover:bg-green-500/10 px-6 transition-all active:scale-95"
                          onClick={() => riattivaPolizza(vehicle.id)}
                        >
                          Riattiva
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Tabs>
      </div>

      <Dialog open={!!showForm} onOpenChange={(open) => !open && setShowForm(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border-primary/20 rounded-[32px] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-extrabold text-white gold-text-gradient uppercase tracking-tight">
              {showForm?.type === 'insurance' ? 'Dettagli Assicurazione' : 
               showForm?.type === 'tax' ? 'Dettagli Bollo' : 'Dettagli Revisione'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Aggiorna le informazioni legali del veicolo
            </DialogDescription>
          </DialogHeader>
          
          {showForm?.type === 'insurance' && (
            <InsuranceForm vehicleId={showForm.vehicleId} onComplete={() => setShowForm(null)} />
          )}
          {showForm?.type === 'tax' && (
            <TaxForm vehicleId={showForm.vehicleId} onComplete={() => setShowForm(null)} />
          )}
          {showForm?.type === 'inspection' && (
            <InspectionForm vehicleId={showForm.vehicleId} onComplete={() => setShowForm(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
