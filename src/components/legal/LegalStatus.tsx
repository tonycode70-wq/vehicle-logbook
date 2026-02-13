import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Shield, FileCheck, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
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
  const { data } = useVehicleContext();
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
      return <Badge variant="outline">Non configurato</Badge>;
    }
    
    switch (status) {
      case 'ok': 
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            In regola
          </Badge>
        );
      case 'in_scadenza': 
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            {daysLeft !== undefined && daysLeft !== null ? `${daysLeft} giorni` : 'In scadenza'}
          </Badge>
        );
      case 'scaduto': 
        return (
          <Badge variant="destructive" className="gap-1">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Stato Legale</h1>
          <p className="text-muted-foreground">Gestisci assicurazione, bollo e revisione</p>
        </div>
      </div>

      {/* Stats Cards */}
      {data.vehicles.length > 0 && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-success/20 bg-success/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{stats.okCount}</p>
                  <p className="text-xs text-muted-foreground">In regola</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{stats.warningCount}</p>
                  <p className="text-xs text-muted-foreground">In scadenza</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.expiredCount}</p>
                  <p className="text-xs text-muted-foreground">Scaduti</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.missingCount}</p>
                  <p className="text-xs text-muted-foreground">Da configurare</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtro veicolo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Veicolo:</span>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Seleziona veicolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i veicoli</SelectItem>
                {data.vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs per tipo documento */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LegalTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insurance" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Assicurazione</span>
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Bollo</span>
          </TabsTrigger>
          <TabsTrigger value="inspection" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Revisione</span>
          </TabsTrigger>
        </TabsList>

        {/* Assicurazione */}
        <TabsContent value="insurance" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map(vehicle => {
              const legal = getLegalData(vehicle.id);
              const insurance = legal?.insurance;
              const status = insurance?.endDate ? calculateLegalStatus(insurance.endDate) : null;
              const daysLeft = insurance?.endDate ? getDaysUntilExpiry(insurance.endDate) : null;

              return (
                <Card key={vehicle.id} className={cn(
                  status === 'scaduto' && "border-destructive/50",
                  status === 'in_scadenza' && "border-warning/50"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {vehicle.brand} {vehicle.model}
                      </CardTitle>
                      {getStatusBadge(status, daysLeft)}
                    </div>
                    <CardDescription>{vehicle.plate}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {insurance ? (
                      <>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Compagnia</span>
                            <span className="font-medium">{insurance.company}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Polizza</span>
                            <span className="font-mono text-xs">{insurance.policyNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Periodo</span>
                            <span>{formatDate(insurance.startDate)} - {formatDate(insurance.endDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Importo</span>
                            <span className="font-medium">{formatCurrency(insurance.amount)}</span>
                          </div>
                          {daysLeft !== null && (
                            <div className={cn(
                              "mt-2 rounded-md p-2 text-center text-sm font-medium",
                              status === 'ok' ? "bg-success/10 text-success" :
                              status === 'in_scadenza' ? "bg-warning/10 text-warning" :
                              "bg-destructive/10 text-destructive"
                            )}>
                              {daysLeft < 0 
                                ? `Scaduta da ${Math.abs(daysLeft)} giorni` 
                                : `${daysLeft} giorni alla scadenza`}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setShowForm({ type: 'insurance', vehicleId: vehicle.id })}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifica
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowForm({ type: 'insurance', vehicleId: vehicle.id })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Aggiungi Assicurazione
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Bollo - AGGIORNATO CON ESENZIONE */}
        <TabsContent value="tax" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map(vehicle => {
              const legal = getLegalData(vehicle.id);
              const tax = legal?.tax;
              
              // Applica logica esenzione Legge 104/Elettrico/Ibrido
              const taxStatus = calculateRoadTaxStatus(vehicle);
              const isExempt = taxStatus !== 'Payable';

              const status = isExempt ? 'ok' : (tax?.dueDate ? calculateLegalStatus(tax.dueDate) : null);
              const daysLeft = tax?.dueDate ? getDaysUntilExpiry(tax.dueDate) : null;

              return (
                <Card key={vehicle.id} className={cn(
                  status === 'scaduto' && "border-destructive/50",
                  status === 'in_scadenza' && "border-warning/50"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {vehicle.brand} {vehicle.model}
                      </CardTitle>
                      {getStatusBadge(status, daysLeft)}
                    </div>
                    <CardDescription>{vehicle.plate}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isExempt ? (
                      <div className="space-y-4">
                        <div className="rounded-md bg-emerald-500/10 p-3 text-emerald-600 text-sm font-medium text-center border border-emerald-500/20">
                           {taxStatus === 'Exempt (Law 104/Disability)' ? 'Esenzione Legge 104' : taxStatus}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setShowForm({ type: 'tax', vehicleId: vehicle.id })}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifica Dati
                        </Button>
                      </div>
                    ) : tax ? (
                      <>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Anno</span>
                            <span className="font-medium">{tax.year}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Regione</span>
                            <span>{tax.region}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Scadenza</span>
                            <span>{formatDate(tax.dueDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Importo</span>
                            <span className="font-medium">{formatCurrency(tax.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pagato</span>
                            <span className={tax.paidDate ? "text-success" : "text-warning"}>
                              {tax.paidDate ? formatDate(tax.paidDate) : 'Non pagato'}
                            </span>
                          </div>
                          {daysLeft !== null && (
                            <div className={cn(
                              "mt-2 rounded-md p-2 text-center text-sm font-medium",
                              status === 'ok' ? "bg-success/10 text-success" :
                              status === 'in_scadenza' ? "bg-warning/10 text-warning" :
                              "bg-destructive/10 text-destructive"
                            )}>
                              {daysLeft < 0 
                                ? `Scaduto da ${Math.abs(daysLeft)} giorni` 
                                : `${daysLeft} giorni alla scadenza`}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setShowForm({ type: 'tax', vehicleId: vehicle.id })}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifica
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowForm({ type: 'tax', vehicleId: vehicle.id })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Aggiungi Bollo
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Revisione - AGGIORNATO CON LOGICA AUTOMATICA */}
        <TabsContent value="inspection" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map(vehicle => {
              const inspection = getInspectionInfo(vehicle.id);
              const status = inspection?.nextDate ? calculateLegalStatus(inspection.nextDate) : null;
              const daysLeft = inspection?.nextDate ? getDaysUntilExpiry(inspection.nextDate) : null;

              return (
                <Card key={vehicle.id} className={cn(
                  status === 'scaduto' && "border-destructive/50",
                  status === 'in_scadenza' && "border-warning/50"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {vehicle.brand} {vehicle.model}
                      </CardTitle>
                      {getStatusBadge(status, daysLeft)}
                    </div>
                    <CardDescription>{vehicle.plate}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {inspection ? (
                      <>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ultima revisione</span>
                            <span>{inspection.lastDate ? formatDate(inspection.lastDate) : 'Da effettuare'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prossima</span>
                            <span className="font-medium">{formatDate(inspection.nextDate)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Esito</span>
                            <Badge variant={inspection.result === 'superata' ? 'success' : inspection.result === 'non_superata' ? 'destructive' : 'outline'}>
                              {inspection.result === 'superata' ? 'Superata' : 
                               inspection.result === 'non_superata' ? 'Non superata' : 'Da effettuare'}
                            </Badge>
                          </div>
                          {inspection.isAuto && (
                            <p className="text-[10px] text-blue-500 font-medium italic mt-1">Calcolata da immatricolazione</p>
                          )}
                          {daysLeft !== null && (
                            <div className={cn(
                              "mt-2 rounded-md p-2 text-center text-sm font-medium",
                              status === 'ok' ? "bg-success/10 text-success" :
                              status === 'in_scadenza' ? "bg-warning/10 text-warning" :
                              "bg-destructive/10 text-destructive"
                            )}>
                              {daysLeft < 0 
                                ? `Scaduta da ${Math.abs(daysLeft)} giorni` 
                                : `${daysLeft} giorni alla scadenza`}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setShowForm({ type: 'inspection', vehicleId: vehicle.id })}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifica
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowForm({ type: 'inspection', vehicleId: vehicle.id })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Aggiungi Revisione
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* No vehicles message */}
      {data.vehicles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">Nessun veicolo registrato</p>
            <p className="text-muted-foreground">
              Aggiungi prima un veicolo per gestire i documenti legali
            </p>
          </CardContent>
        </Card>
      )}

      {/* Form Dialogs */}
      <Dialog open={!!showForm} onOpenChange={(open) => !open && setShowForm(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showForm?.type === 'insurance' && 'Assicurazione'}
              {showForm?.type === 'tax' && 'Bollo'}
              {showForm?.type === 'inspection' && 'Revisione'}
            </DialogTitle>
            <DialogDescription>
              {data.vehicles.find(v => v.id === showForm?.vehicleId)?.brand}{' '}
              {data.vehicles.find(v => v.id === showForm?.vehicleId)?.model}
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
