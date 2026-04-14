import React, { useState, useMemo, useEffect } from 'react';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { formatCurrency, formatKm } from '@/lib/utils/dates';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Calculator, FileText } from 'lucide-react';

// --- INTEGRAZIONE PUNTO 4: IMPORT REPORT GENERATOR ---
import { ReportGenerator } from './ReportGenerator';

const COLORS = ['#D4AF37', '#8A6621', '#F5F5F5', '#A0A0A0', '#C5A028', '#1E1E1E'];

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
      <div className="text-center py-24 luxury-card max-w-2xl mx-auto border-dashed border-primary/20">
        <BarChart3 className="h-20 w-20 mx-auto text-primary/20 mb-6" />
        <h1 className="text-3xl font-extrabold text-white gold-text-gradient uppercase tracking-tight">Analisi & Grafici</h1>
        <p className="text-muted-foreground mt-3 font-medium">Aggiungi almeno un veicolo per visualizzare le statistiche premium</p>
      </div>
    );
  }

  const selectedVehicleName = selectedVehicle === 'all'
    ? 'Report Flotta Premium'
    : (data.vehicles.find(v => v.id === selectedVehicle) ? `Report Storico: ${data.vehicles.find(v => v.id === selectedVehicle)!.brand} ${data.vehicles.find(v => v.id === selectedVehicle)!.model}` : 'Report Flotta Premium');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white gold-text-gradient uppercase tracking-tight">{selectedVehicleName}</h1>
          <p className="text-muted-foreground font-medium">Statistiche avanzate e andamento costi automotive</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-[220px] h-12 luxury-card border-white/10 bg-white/5 font-bold">
              <SelectValue placeholder="Tutti i veicoli" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 backdrop-blur-xl border-primary/20 rounded-xl font-bold">
              <SelectItem value="all" className="focus:bg-primary/10 focus:text-primary">Tutti i veicoli</SelectItem>
              {data.vehicles.map(v => (
                <SelectItem key={v.id} value={v.id} className="focus:bg-primary/10 focus:text-primary">
                  {v.brand} {v.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px] h-12 luxury-card border-white/10 bg-white/5 font-bold text-primary">
              <SelectValue placeholder="Anno" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 backdrop-blur-xl border-primary/20 rounded-xl font-bold">
              {availableYears.map(year => (
                <SelectItem key={year} value={year} className="focus:bg-primary/10 focus:text-primary">{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Riepilogo totali */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="luxury-card p-8 border-primary/10 group hover:border-primary/30 transition-all">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">Spese {selectedYear}</p>
          <div className="text-3xl font-extrabold text-white gold-text-gradient">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className="luxury-card p-8 border-white/5 group hover:border-primary/20 transition-all">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">Manutenzioni {selectedYear}</p>
          <div className="text-3xl font-extrabold text-white">{formatCurrency(totalMaintenance)}</div>
        </div>
        <div className="luxury-card p-8 border-white/10 group hover:border-primary/40 transition-all bg-primary/5">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Totale {selectedYear}</p>
          <div className="text-3xl font-extrabold text-white gold-text-gradient drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{formatCurrency(grandTotal)}</div>
        </div>
      </div>

      <Tabs defaultValue="monthly" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 luxury-card p-1.5 h-16 border-white/5 shadow-2xl">
          <TabsTrigger value="monthly" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Mensile</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Categorie</span>
          </TabsTrigger>
          <TabsTrigger value="trend" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trend</span>
          </TabsTrigger>
          <TabsTrigger value="costperkm" className="rounded-xl font-extrabold text-xs uppercase tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-black transition-all gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">€/km</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="luxury-card p-8 border-white/5 min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Andamento Mensile</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Spese</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white/40" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Manutenzioni</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(212,175,55,0.05)" />
              <XAxis dataKey="name" stroke="#A0A0A0" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
              <YAxis stroke="#A0A0A0" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} tick={{ fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', color: '#F5F5F5' }}
                itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                cursor={{ fill: 'rgba(212,175,55,0.05)' }}
              />
              <Bar dataKey="spese" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="manutenzioni" fill="rgba(245, 245, 245, 0.4)" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="categories" className="grid gap-8 md:grid-cols-2">
          <div className="luxury-card p-8 border-white/5 min-h-[450px]">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-8">Ripartizione Spese</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', color: '#F5F5F5' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="luxury-card p-8 border-white/5 min-h-[450px]">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-8">Tipi di Manutenzione</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={maintenanceTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {maintenanceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', color: '#F5F5F5' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="luxury-card p-8 border-white/5 min-h-[450px]">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-8">Trend Costi Cumulativi</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorTotale" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(212,175,55,0.05)" />
              <XAxis dataKey="name" stroke="#A0A0A0" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
              <YAxis stroke="#A0A0A0" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} tick={{ fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', color: '#F5F5F5' }}
              />
              <Area type="monotone" dataKey="totale" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorTotale)" />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="costperkm" className="luxury-card p-8 border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-8">Efficienza Flotta (€/km)</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {costPerKm.map((item, index) => (
              <div key={index} className="p-6 luxury-card bg-white/5 border-white/5 group hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-extrabold text-white group-hover:text-primary transition-colors">{item.name}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">{item.plate}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Costo Totale</span>
                    <span className="text-sm font-extrabold text-white">{formatCurrency(item.totalCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Km Percorsi</span>
                    <span className="text-sm font-extrabold text-white">{item.km.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Costo al Km</span>
                    <span className="text-xl font-extrabold text-white gold-text-gradient">€{item.costPerKm.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="luxury-card p-8 border-primary/20 bg-primary/5">
        <ReportGenerator />
      </div>
    </div>
  );
}
