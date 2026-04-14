import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Car, 
  Bike, 
  Calendar, 
  Wrench, 
  Activity, 
  Plus, 
  Gauge, 
  Fuel, 
  Shield, 
  FileText, 
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Bell,
  Truck,
  ImagePlus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVehicleContext } from '@/contexts/VehicleContext';
import { formatKm, formatDate, getDaysUntilExpiry, formatCurrency } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

interface DashboardProps {
  onAddVehicle?: () => void;
  onSelectVehicle?: (id: string) => void;
  onEditVehicle?: (vehicle: any) => void;
  onTabChange?: (tab: any) => void;
}

export function Dashboard({ onAddVehicle, onSelectVehicle, onEditVehicle, onTabChange }: DashboardProps) {
  const { data, isLoaded } = useVehicleContext();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | 'all'>(() => {
    const saved = localStorage.getItem('selectedVehicleId');
    return (saved && saved.length > 0 ? saved : 'all') as 'all' | string;
  });
  const [period, setPeriod] = useState('Questo mese');

  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    localStorage.setItem('selectedVehicleId', selectedVehicleId as string);
  }, [selectedVehicleId]);

  // Render Charts
  useEffect(() => {
    if (!isLoaded) return;

    // Line Chart: Andamento consumi
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d');
      if (ctx) {
        const canvas = lineChartRef.current;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const months = ['Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov'];
        const values = [14, 17.5, 14.2, 16.8, 15.5, 21];
        const maxValue = 22;
        const minValue = 10;

        ctx.clearRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
          const y = padding.top + (chartHeight / 3) * i;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
          
          ctx.fillStyle = '#A0A0A0';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText((maxValue - (maxValue - minValue) / 3 * i).toString(), padding.left - 8, y + 4);
        }

        // Line and area
        const points = values.map((v, i) => ({
          x: padding.left + (chartWidth / (values.length - 1)) * i,
          y: padding.top + chartHeight - ((v - minValue) / (maxValue - minValue)) * chartHeight
        }));

        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.lineTo(points[0].x, padding.top + chartHeight);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Points
        points.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#0D0D0D';
          ctx.fill();
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        // X-axis labels
        ctx.fillStyle = '#A0A0A0';
        ctx.textAlign = 'center';
        months.forEach((m, i) => {
          ctx.fillText(m, padding.left + (chartWidth / (months.length - 1)) * i, height - 5);
        });
      }
    }

    // Donut Chart: Consumo medio
    if (donutChartRef.current) {
      const ctx = donutChartRef.current.getContext('2d');
      if (ctx) {
        const canvas = donutChartRef.current;
        const dpr = window.devicePixelRatio || 1;
        const size = 140;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = 55;
        const thickness = 12;

        ctx.clearRect(0, 0, size, size);

        // Background track
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
        ctx.lineWidth = thickness;
        ctx.stroke();

        // Progress arc (75%)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, Math.PI);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Text
        ctx.fillStyle = '#A0A0A0';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Consumo medio', centerX, centerY - 15);

        ctx.fillStyle = '#F5F5F5';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('15,2', centerX, centerY + 10);

        ctx.fillStyle = '#A0A0A0';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('km/l', centerX, centerY + 28);
      }
    }
  }, [isLoaded]);

  // Stats for the dashboard
  const stats = useMemo(() => {
    return {
      km: { value: 139, trend: -12 },
      fuel: { value: 28.4, trend: -5 },
      maintenance: { value: 2 },
      totalSpent: { value: 96.50, trend: -8 }
    };
  }, [data]);

  // Upcoming deadlines list
  const deadlineList = useMemo(() => {
    const items: { type: string; vehicle: string; days: number; status: 'ok' | 'warning' | 'critical'; icon: React.ReactNode }[] = [];
    
    data.legal.forEach(doc => {
      const vehicle = data.vehicles.find(v => v.id === doc.vehicleId);
      if (!vehicle) return;

      const checkDate = (date: string | undefined, type: string, icon: React.ReactNode) => {
        if (!date) return;
        const days = getDaysUntilExpiry(date);
        // Filtriamo le scadenze imminenti (es. entro 30 giorni) o già scadute
        if (days > 30) return; 

        let status: 'ok' | 'warning' | 'critical' = 'ok';
        if (days < 0) status = 'critical';
        else if (days <= 15) status = 'critical';
        else if (days <= 30) status = 'warning';

        items.push({ 
          type, 
          vehicle: `${vehicle.brand} ${vehicle.model}`, 
          days, 
          status, 
          icon 
        });
      };

      checkDate(doc.insurance?.endDate, 'Assicurazione', <Shield className="h-5 w-5" />);
      checkDate(doc.tax?.dueDate, 'Bollo auto', <FileText className="h-5 w-5" />);
      checkDate(doc.inspection?.nextDate, 'Revisione', <Truck className="h-5 w-5" />);
    });

    return items.sort((a, b) => a.days - b.days);
  }, [data]);

  if (!isLoaded) return <div className="p-8 text-center">Caricamento dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white gold-text-gradient">I miei veicoli</h1>
          <p className="text-muted-foreground font-medium">Tutti i veicoli della tua famiglia, sempre sotto controllo</p>
        </div>
        <Button 
          onClick={onAddVehicle}
          className="gold-gradient text-black hover:opacity-90 rounded-xl px-6 font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)] h-12 border-0"
        >
          <Plus className="mr-2 h-5 w-5" />
          Aggiungi veicolo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Vehicles Horizontal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.vehicles.length === 0 ? (
               <div className="col-span-full py-16 text-center luxury-card border-dashed">
                  <Car className="mx-auto h-12 w-12 text-primary/30 mb-4" />
                  <p className="text-muted-foreground font-medium">Nessun veicolo trovato</p>
                  <Button onClick={onAddVehicle} className="mt-4 rounded-full px-6 font-bold gold-gradient text-black">Aggiungi ora</Button>
               </div>
            ) : (
              data.vehicles.map((vehicle, idx) => (
                <ModernVehicleCard 
                  key={vehicle.id} 
                  vehicle={vehicle} 
                  status={getDaysUntilExpiry(data.legal.find(l => l.vehicleId === vehicle.id)?.insurance?.endDate || '') <= 30 ? 'Attenzione' : 'Attivo'} 
                  onClick={() => {
                    onTabChange?.('vehicles');
                    onSelectVehicle?.(vehicle.id);
                  }}
                  onEdit={() => onEditVehicle?.(vehicle)}
                />
              ))
            )}
          </div>

          {/* Panoramica Mese */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-white gold-text-gradient">Panoramica</h2>
                <div className="h-6 w-px bg-primary/10 hidden sm:block" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 px-3 gap-2 font-extrabold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/10">
                      {selectedVehicleId === 'all' ? 'Tutti i veicoli' : data.vehicles.find(v => v.id === selectedVehicleId)?.model}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl w-56 bg-black border-primary/20">
                    <DropdownMenuItem className="focus:bg-primary/10 focus:text-primary" onClick={() => setSelectedVehicleId('all')}>Tutti i veicoli</DropdownMenuItem>
                    {data.vehicles.map(v => (
                      <DropdownMenuItem key={v.id} className="focus:bg-primary/10 focus:text-primary" onClick={() => setSelectedVehicleId(v.id)}>
                        {v.brand} {v.model}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl h-10 gap-2 font-bold text-muted-foreground border-primary/10 bg-white/5 hover:bg-white/10">
                    {period} <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl bg-black border-primary/20">
                  <DropdownMenuItem className="focus:bg-primary/10 focus:text-primary" onClick={() => setPeriod('Questo mese')}>Questo mese</DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-primary/10 focus:text-primary" onClick={() => setPeriod('Ultimi 3 mesi')}>Ultimi 3 mesi</DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-primary/10 focus:text-primary" onClick={() => setPeriod('Ultimi 6 mesi')}>Ultimi 6 mesi</DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-primary/10 focus:text-primary" onClick={() => setPeriod('Quest\'anno')}>Quest'anno</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsSmallCard 
                icon={<Activity className="h-5 w-5 text-primary" />}
                value={`${stats.km.value} km`}
                label="Percorsi totali"
                trend={stats.km.trend}
                color="gold"
                onClick={() => onTabChange?.('analytics')}
              />
              <StatsSmallCard 
                icon={<Fuel className="h-5 w-5 text-primary" />}
                value={`${stats.fuel.value} l`}
                label="Carburante"
                trend={stats.fuel.trend}
                color="gold"
                onClick={() => onTabChange?.('expenses')}
              />
              <StatsSmallCard 
                icon={<Wrench className="h-5 w-5 text-primary" />}
                value={stats.maintenance.value.toString()}
                label="Manutenzioni"
                color="gold"
                onClick={() => onTabChange?.('maintenance')}
              />
              <StatsSmallCard 
                icon={<span className="text-primary font-bold">€</span>}
                value={formatCurrency(stats.totalSpent.value)}
                label="Spesa totale"
                trend={stats.totalSpent.trend}
                color="gold"
                onClick={() => onTabChange?.('analytics')}
              />
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 luxury-card p-6">
              <h3 className="text-sm font-bold text-white mb-6">Andamento consumi <span className="text-muted-foreground font-normal ml-1">(ultimi 6 mesi)</span></h3>
              <canvas ref={lineChartRef} className="w-full h-[200px]" />
            </div>
            <div className="luxury-card p-6 flex flex-col items-center justify-center">
              <canvas ref={donutChartRef} className="w-[140px] h-[140px]" />
            </div>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-8">
          <div className="luxury-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-white">Scadenze imminenti</h2>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => onTabChange?.('legal')} />
            </div>
            
            <div className="space-y-5">
              {deadlineList.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Tutto in regola</p>
                </div>
              ) : (
                deadlineList.map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-1 cursor-pointer hover:translate-x-1 transition-transform group"
                    onClick={() => onTabChange?.('legal')}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-2xl border border-primary/10 transition-colors group-hover:border-primary/30",
                        item.status === 'critical' ? "bg-red-500/10 text-red-500" : 
                        item.status === 'warning' ? "bg-primary/10 text-primary" : 
                        "bg-white/5 text-muted-foreground"
                      )}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{item.type}</p>
                        <p className="text-xs text-muted-foreground font-medium">{item.vehicle}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold shadow-sm",
                      item.status === 'critical' ? "bg-red-500 text-white" : 
                      item.status === 'warning' ? "bg-primary text-black" : 
                      "bg-white/10 text-white"
                    )}>
                      Tra {item.days} giorni
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button 
              variant="link" 
              className="w-full mt-8 text-primary font-bold hover:no-underline flex items-center justify-center gap-2 hover:opacity-80"
              onClick={() => onTabChange?.('legal')}
            >
              Vedi tutte le scadenze <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatsSmallCard({ icon, value, label, trend, onClick }: any) {
  return (
    <div 
      className="luxury-card p-5 space-y-3 cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-2.5 rounded-xl w-fit bg-primary/10 border border-primary/10 group-hover:border-primary/30 transition-colors shadow-[0_0_10px_rgba(212,175,55,0.05)]">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-white group-hover:text-primary transition-colors">{value}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-widest opacity-60">{label}</p>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm",
              trend < 0 ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            )}>
              {trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModernVehicleCard({ vehicle, status, onClick, onEdit }: { vehicle: any, status: string, onClick: () => void, onEdit?: () => void }) {
  return (
    <div 
      className="luxury-card p-5 space-y-4 group cursor-pointer relative overflow-hidden"
    >
      <div 
        className="relative h-36 bg-black/40 rounded-[24px] overflow-hidden border border-white/5 group-hover:border-primary/20 transition-all duration-500"
        onClick={onClick}
      >
        {vehicle.imageUrl ? (
          <div className="w-full h-full relative p-2">
            <img 
              src={vehicle.imageUrl} 
              alt={vehicle.model} 
              className="w-full h-full object-contain vehicle-shadow transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {vehicle.type === 'moto' ? 
              <Bike className="h-16 w-16 text-primary/10 transition-colors group-hover:text-primary/20" /> : 
              <Car className="h-16 w-16 text-primary/10 transition-colors group-hover:text-primary/20" />
            }
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className={cn(
            "rounded-full px-3 py-1 font-bold shadow-lg border-0 text-[10px] uppercase tracking-[0.1em]",
            status === 'Attivo' ? "bg-green-500/20 text-green-500 border border-green-500/20" : "bg-primary/20 text-primary border border-primary/20"
          )}>
            {status}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-1.5" onClick={onClick}>
        <h3 className="text-lg font-extrabold text-white group-hover:text-primary transition-colors truncate">{vehicle.brand} {vehicle.model}</h3>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-50">
          {vehicle.type === 'auto' ? 'Auto' : 'Moto'} • {vehicle.plate}
        </p>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60" onClick={onClick}>
        <div className="flex items-center gap-1.5 group-hover:text-primary/80 transition-colors">
          <Fuel className="h-3 w-3 text-primary/60" />
          <span>{vehicle.fuel}</span>
        </div>
        <div className="flex items-center gap-1.5 group-hover:text-primary/80 transition-colors">
          <Calendar className="h-3 w-3 text-primary/60" />
          <span>{vehicle.year}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5" onClick={onClick}>
        <div>
          <p className="text-[13px] font-extrabold text-white group-hover:text-primary transition-colors">{formatKm(vehicle.currentKm)}</p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-40">Distanza totale</p>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className="text-[13px] font-extrabold text-white group-hover:text-primary transition-colors">15,4 km/l</p>
            <TrendingDown className="h-3 w-3 text-green-500" />
          </div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-40">Consumo medio</p>
        </div>
      </div>

      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full shadow-2xl gold-gradient border-0 hover:scale-110 active:scale-90"
          title="Modifica veicolo"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
        >
          <ImagePlus className="h-4 w-4 text-black" />
        </Button>
      </div>
    </div>
  );
}