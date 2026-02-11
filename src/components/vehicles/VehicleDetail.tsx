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
import { useVehicleContext } from '@/contexts/VehicleContext';
import { formatKm, formatDate } from '@/lib/utils/dates';
import { calculateVehicleAge, calculateRoadTaxStatus } from '@/lib/utils/vehicleCalculations';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types/vehicle';

interface VehicleDetailProps {
  vehicleId: string;
  onBack: () => void;
  onEdit?: (vehicle: Vehicle) => void; // Aggiunto per gestire la modifica
}

export function VehicleDetail({ vehicleId, onBack, onEdit }: VehicleDetailProps) {
  const { data } = useVehicleContext();
  
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Torna alla flotta
        </Button>
        <div className="flex gap-2">
          {/* Tasto Modifica ora FUNZIONANTE */}
          <Button variant="outline" size="sm" onClick={() => onEdit?.(vehicle)}>
            Modifica
          </Button>
          <Button variant="destructive" size="sm">Elimina</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {vehicle.type === 'auto' ? <Car className="h-10 w-10 text-primary" /> : <Bike className="h-10 w-10 text-primary" />}
            </div>
            <h2 className="text-xl font-bold">{vehicle.brand} {vehicle.model}</h2>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono mt-1">
              {vehicle.plate}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="outline">{vehicle.fuel}</Badge>
              <Badge variant="secondary">{ageData.ageYears} anni</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid gap-4 grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs uppercase font-medium">Chilometraggio</span>
              </div>
              <div className="text-2xl font-bold">{formatKm(vehicle.currentKm)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-xs uppercase font-medium">Alimentazione</span>
              </div>
              <div className="text-2xl font-bold capitalize">{vehicle.fuel}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Specifiche</TabsTrigger>
          <TabsTrigger value="docs">Documenti</TabsTrigger>
          <TabsTrigger value="history">Cronologia</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase">Anagrafica Tecnica</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Immatricolazione</span>
                <span className="font-medium text-sm">
                  {vehicle.registrationDate ? formatDate(vehicle.registrationDate) : 'N/D'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Classe Ambientale</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Euro {vehicle.euroClass || 'N/D'}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Stato Bollo</span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">
                  {taxStatus || 'N/D'}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Potenza</span>
                <div className="text-right">
                  <span className="font-medium text-sm block">
                    {vehicle.power ? `${vehicle.power} kW` : 'N/D'}
                  </span>
                  {horsepower && (
                    <span className="text-[10px] text-muted-foreground italic">({horsepower} CV)</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded">
                    <Shield className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Assicurazione</p>
                    <p className="text-xs text-muted-foreground">
                      Scade il {legalInfo?.insurance?.endDate ? formatDate(legalInfo.insurance.endDate) : 'N/D'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Vedi</Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded">
                    <FileText className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Libretto di Circolazione</p>
                    <p className="text-xs text-muted-foreground">Documento caricato</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Vedi</Button>
              </div>
              <Button variant="outline" className="w-full border-dashed gap-2">
                <Plus className="h-4 w-4" />
                Aggiungi Documento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground italic">
                Report storico generato per pratica PEC: consultare tab Analytics per esportazione PDF.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}