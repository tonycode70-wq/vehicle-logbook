import React, { useState, useMemo, useEffect } from 'react';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { formatCurrency, formatKm } from '@/lib/utils/dates';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Calculator, FileText } from 'lucide-react';

// --- INTEGRAZIONE PUNTO 4: IMPORT REPORT GENERATOR ---
import { ReportGenerator } from './ReportGenerator';

const COLORS = ['hsl(220, 70%, 50%)', 'hsl(160, 60%, 45%)', 'hsl(45, 90%, 50%)', 'hsl(350, 70%, 55%)', 'hsl(280, 60%, 55%)', 'hsl(200, 70%, 50%)'];

const CATEGORY_LABELS: Record<string, string> = {
  carburante: 'Carburante',
  parcheggio: 'Parcheggio',
  pedaggi: 'Pedaggi',
  lavaggio: 'Lavaggio',
  accessori: 'Accessori',
  altro: 'Altro',
};

const MAINTENANCE_LABELS: Record<string, string> = {
  tagliando: 'Tagliando',
  freni: 'Freni',
  gomme: 'Gomme',
  olio: 'Olio',
  filtri: 'Filtri',
  batteria: 'Batteria',
  frizione: 'Frizione',
  sospensioni: 'Sospensioni',
  altro: 'Altro',
};

export function Analytics() {
  const { data } = useVehicleContext();
  const [selectedVehicle, setSelectedVehicle] = useState<string>(() => {
    const saved = localStorage.getItem('selectedVehicleId');
    return saved || 'all';
  });
  useEffect(() => {
    localStorage.setItem('selectedVehicleId', selectedVehicle);
  }, [selectedVehicle]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Filtra dati per veicolo
  const filteredExpenses = useMemo(() => {
    let expenses = data.expenses;
    if (selectedVehicle !== 'all') {
      expenses = expenses.filter(e => e.vehicleId === selectedVehicle);
    }
    return expenses.filter(e => new Date(e.date).getFullYear().toString() === selectedYear);
  }, [data.expenses, selectedVehicle, selectedYear]);

  const filteredMaintenance = useMemo(() => {
    let maintenance = data.maintenance;
    if (selectedVehicle !== 'all') {
      maintenance = maintenance.filter(m => m.vehicleId === selectedVehicle);
    }
    return maintenance.filter(m => new Date(m.date).getFullYear().toString() === selectedYear);
  }, [data.maintenance, selectedVehicle, selectedYear]);

  // Dati per grafico spese mensili
  const monthlyData = useMemo(() => {
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    return months.map((month, index) => {
      const monthExpenses = filteredExpenses.filter(e => new Date(e.date).getMonth() === index);
      const monthMaintenance = filteredMaintenance.filter(m => new Date(m.date).getMonth() === index);
      return {
        name: month,
        spese: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
        manutenzioni: monthMaintenance.reduce((sum, m) => sum + m.cost, 0),
      };
    });
  }, [filteredExpenses, filteredMaintenance]);

  // Dati per grafico a torta categorie spese
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({
      name: CATEGORY_LABELS[name] || name,
      value,
    }));
  }, [filteredExpenses]);

  // Dati per grafico a torta tipi manutenzione
  const maintenanceTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    filteredMaintenance.forEach(m => {
      types[m.type] = (types[m.type] || 0) + m.cost;
    });
    return Object.entries(types).map(([name, value]) => ({
      name: MAINTENANCE_LABELS[name] || name,
      value,
    }));
  }, [filteredMaintenance]);

  // Trend cumulativo
  const trendData = useMemo(() => {
    const allItems = [
      ...filteredExpenses.map(e => ({ date: e.date, amount: e.amount })),
      ...filteredMaintenance.map(m => ({ date: m.date, amount: m.cost })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulative = 0;
    const monthlyTrend: Record<string, number> = {};
    
    allItems.forEach(item => {
      const monthKey = new Date(item.date).toLocaleDateString('it-IT', { month: 'short' });
      cumulative += item.amount;
      monthlyTrend[monthKey] = cumulative;
    });

    return Object.entries(monthlyTrend).map(([name, totale]) => ({ name, totale }));
  }, [filteredExpenses, filteredMaintenance]);

  // Costo al km per veicolo
  const costPerKm = useMemo(() => {
    return data.vehicles.map(vehicle => {
      const vehicleExpenses = data.expenses
        .filter(e => e.vehicleId === vehicle.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const vehicleMaintenance = data.maintenance
        .filter(m => m.vehicleId === vehicle.id)
        .reduce((sum, m) => sum + m.cost, 0);
      const totalCost = vehicleExpenses + vehicleMaintenance;
      const kmCost = vehicle.currentKm > 0 ? totalCost / vehicle.currentKm : 0;
      
      return {
        name: `${vehicle.brand} ${vehicle.model}`,
        plate: vehicle.plate,
        totalCost,
        km: vehicle.currentKm,
        costPerKm: kmCost,
      };
    });
  }, [data.vehicles, data.expenses, data.maintenance]);

  // Anni disponibili
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.expenses.forEach(e => years.add(new Date(e.date).getFullYear().toString()));
    data.maintenance.forEach(m => years.add(new Date(m.date).getFullYear().toString()));
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [data.expenses, data.maintenance]);

  // Totali
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMaintenance = filteredMaintenance.reduce((sum, m) => sum + m.cost, 0);
  const grandTotal = totalExpenses + totalMaintenance;

  if (data.vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Analisi & Grafici</h1>
        <p className="text-muted-foreground mt-2">Aggiungi almeno un veicolo per visualizzare le statistiche</p>
      </div>
    );
  }

  const selectedVehicleName = selectedVehicle === 'all'
    ? 'Report Veicoli Generale'
    : (data.vehicles.find(v => v.id === selectedVehicle) ? `Report Storico: ${data.vehicles.find(v => v.id === selectedVehicle)!.brand} ${data.vehicles.find(v => v.id === selectedVehicle)!.model}` : 'Report Veicoli Generale');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{selectedVehicleName}</h1>
          <p className="text-muted-foreground">Statistiche e andamento costi</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tutti i veicoli" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i veicoli</SelectItem>
              {data.vehicles.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  {v.brand} {v.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Anno" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Riepilogo totali */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalExpenses)}</div>
            <p className="text-sm text-muted-foreground">Spese {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-chart-2">{formatCurrency(totalMaintenance)}</div>
            <p className="text-sm text-muted-foreground">Manutenzioni {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-chart-4">{formatCurrency(grandTotal)}</div>
            <p className="text-sm text-muted-foreground">Totale {selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Mensile</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Categorie</span>
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trend</span>
          </TabsTrigger>
          <TabsTrigger value="costperkm" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">€/km</span>
          </TabsTrigger>
        </TabsList>

        {/* Grafico Mensile */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Spese e Manutenzioni Mensili</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `€${v}`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelClassName="font-bold"
                    />
                    <Legend />
                    <Bar dataKey="spese" name="Spese" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="manutenzioni" name="Manutenzioni" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grafico Categorie */}
        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Spese</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Nessuna spesa registrata
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Manutenzioni</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {maintenanceTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={maintenanceTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {maintenanceTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Nessuna manutenzione registrata
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Grafico Trend */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Andamento Cumulativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `€${v}`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line 
                        type="monotone" 
                        dataKey="totale" 
                        name="Totale Cumulativo"
                        stroke="hsl(220, 70%, 50%)" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(220, 70%, 50%)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costo al km */}
        <TabsContent value="costperkm">
          <Card>
            <CardHeader>
              <CardTitle>Costo per Chilometro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costPerKm.map((vehicle, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{vehicle.name}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.plate} • {formatKm(vehicle.km)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {vehicle.costPerKm.toFixed(3)} €/km
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Totale: {formatCurrency(vehicle.totalCost)}
                      </p>
                    </div>
                  </div>
                ))}
                {costPerKm.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nessun veicolo registrato
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- INTEGRAZIONE PUNTO 4: SEZIONE REPORT TECNICO FINALE --- */}
      <div className="pt-8 border-t no-print">
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{selectedVehicleName}</h3>
              <p className="text-sm text-muted-foreground">Esporta il report tecnico completo in PDF.</p>
            </div>
          </div>
          <ReportGenerator />
        </div>
      </div>
    </div>
  );
}
