import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Bike, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Fuel,
  Gauge,
  Shield,
  FileText,
  Wrench,
  TrendingUp,
  ChevronDown,
  Calendar,
  Zap,
  Activity
} from 'lucide-react';
import { GlassmorphicCard, GlassmorphicCardHeader, GlassmorphicCardTitle } from '@/components/ui/glassmorphic-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { formatCurrency, formatKm, formatDate, calculateLegalStatus, getDaysUntilExpiry } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';
// Nuovi import per logiche flotta
import { 
  calculateVehicleAge, 
  calculateRoadTaxStatus, 
  calculateEfficiencyIndex 
} from '@/lib/utils/vehicleCalculations';

export function Dashboard() {
  const { data, isLoaded } = useVehicleContext();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | 'all'>('all');
  
  // Canvas refs per grafici
  const monthlyChartRef = useRef<HTMLCanvasElement>(null);
  const distributionChartRef = useRef<HTMLCanvasElement>(null);

  const selectedVehicle = useMemo(() => {
    return selectedVehicleId === 'all' 
      ? null 
      : data.vehicles.find(v => v.id === selectedVehicleId);
  }, [selectedVehicleId, data.vehicles]);

  // --- NUOVA LOGICA FLOTTA INTEGRATA ---
  const fleetStats = useMemo(() => {
    if (data.vehicles.length === 0) return { avgEfficiency: 0, totalTaxExempt: 0 };

    const totalEfficiency = data.vehicles.reduce((acc, v) => {
      const vMaintenances = data.maintenance.filter(m => m.vehicleId === v.id);
      return acc + calculateEfficiencyIndex(v, vMaintenances).score;
    }, 0);

    const exemptVehicles = data.vehicles.filter(v => {
      const age = v.registrationDate ? calculateVehicleAge(v.registrationDate).ageYears : 0;
      const status = calculateRoadTaxStatus(v, age);
      return status.includes('Exempt');
    }).length;

    return {
      avgEfficiency: Math.round(totalEfficiency / data.vehicles.length),
      totalTaxExempt: exemptVehicles
    };
  }, [data]);

  // Filtra dati per veicolo selezionato - MEMOIZED
  const filteredExpenses = useMemo(() => {
    return selectedVehicleId === 'all' 
      ? data.expenses 
      : data.expenses.filter(e => e.vehicleId === selectedVehicleId);
  }, [data.expenses, selectedVehicleId]);
  
  const filteredMaintenance = useMemo(() => {
    return selectedVehicleId === 'all'
      ? data.maintenance
      : data.maintenance.filter(m => m.vehicleId === selectedVehicleId);
  }, [data.maintenance, selectedVehicleId]);

  // KPI Calculations - MEMOIZED
  const kpiData = useMemo(() => {
    const totalExpensesSelected = filteredExpenses.reduce((sum, e) => sum + e.amount, 0) 
      + filteredMaintenance.reduce((sum, m) => sum + m.cost, 0);
    
    const totalExpensesAll = data.expenses.reduce((sum, e) => sum + e.amount, 0) 
      + data.maintenance.reduce((sum, m) => sum + m.cost, 0);

    // Media mensile (ultimi 12 mesi)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const recentExpenses = [...filteredExpenses, ...filteredMaintenance.map(m => ({ ...m, amount: m.cost, date: m.date }))]
      .filter(e => new Date(e.date) >= oneYearAgo);
    const monthlyAverage = recentExpenses.length > 0 
      ? recentExpenses.reduce((sum, e) => sum + e.amount, 0) / 12 
      : 0;

    // Km attuali
    const currentKm = selectedVehicle?.currentKm || 
      (data.vehicles.length > 0 ? Math.max(...data.vehicles.map(v => v.currentKm)) : 0);

    return { totalExpensesSelected, totalExpensesAll, monthlyAverage, currentKm };
  }, [filteredExpenses, filteredMaintenance, data.expenses, data.maintenance, data.vehicles, selectedVehicle]);

  // Avvisi scadenze - MEMOIZED
  const alerts = useMemo(() => {
    const vehiclesForAlerts = selectedVehicleId === 'all' 
      ? data.vehicles 
      : data.vehicles.filter(v => v.id === selectedVehicleId);

    return data.legal.flatMap(doc => {
      const vehicle = vehiclesForAlerts.find(v => v.id === doc.vehicleId);
      if (!vehicle) return [];
      
      const warnings: { type: string; vehicle: string; vehicleId: string; status: string; daysLeft: number; icon: React.ReactNode }[] = [];
      
      if (doc.insurance?.endDate) {
        const status = calculateLegalStatus(doc.insurance.endDate);
        if (status !== 'ok') {
          warnings.push({
            type: 'Assicurazione',
            vehicle: `${vehicle.brand} ${vehicle.model}`,
            vehicleId: vehicle.id,
            status,
            daysLeft: getDaysUntilExpiry(doc.insurance.endDate),
            icon: <Shield className="h-4 w-4" />
          });
        }
      }
      
      if (doc.tax?.dueDate) {
        const status = calculateLegalStatus(doc.tax.dueDate);
        if (status !== 'ok') {
          warnings.push({
            type: 'Bollo',
            vehicle: `${vehicle.brand} ${vehicle.model}`,
            vehicleId: vehicle.id,
            status,
            daysLeft: getDaysUntilExpiry(doc.tax.dueDate),
            icon: <FileText className="h-4 w-4" />
          });
        }
      }
      
      if (doc.inspection?.nextDate) {
        const status = calculateLegalStatus(doc.inspection.nextDate);
        if (status !== 'ok') {
          warnings.push({
            type: 'Revisione',
            vehicle: `${vehicle.brand} ${vehicle.model}`,
            vehicleId: vehicle.id,
            status,
            daysLeft: getDaysUntilExpiry(doc.inspection.nextDate),
            icon: <Wrench className="h-4 w-4" />
          });
        }
      }
      
      return warnings;
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [data.legal, data.vehicles, selectedVehicleId]);

  const activeAlerts = alerts.length;

  // Stato generale - MEMOIZED
  const overallStatus = useMemo(() => {
    const expiredCount = alerts.filter(a => a.status === 'scaduto').length;
    const warningCount = alerts.filter(a => a.status === 'in_scadenza').length;
    
    if (expiredCount > 0) return { label: 'Criticità', color: 'destructive' as const, icon: AlertTriangle };
    if (warningCount > 0) return { label: 'Avvisi', color: 'warning' as const, icon: AlertTriangle };
    return { label: 'Tutto OK', color: 'success' as const, icon: CheckCircle2 };
  }, [alerts]);

  // Stato legale per veicoli selezionati - MEMOIZED
  const legalStatuses = useMemo(() => {
    const vehicleIds = selectedVehicleId === 'all' 
      ? data.vehicles.map(v => v.id)
      : [selectedVehicleId];

    return vehicleIds.map(vId => {
      const legal = data.legal.find(l => l.vehicleId === vId);
      const vehicle = data.vehicles.find(v => v.id === vId);
      if (!vehicle) return null;

      return {
        vehicleId: vId,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        insurance: legal?.insurance?.endDate ? calculateLegalStatus(legal.insurance.endDate) : 'missing',
        insuranceExpiry: legal?.insurance?.endDate,
        tax: legal?.tax?.dueDate ? calculateLegalStatus(legal.tax.dueDate) : 'missing',
        taxExpiry: legal?.tax?.dueDate,
        inspection: legal?.inspection?.nextDate ? calculateLegalStatus(legal.inspection.nextDate) : 'missing',
        inspectionExpiry: legal?.inspection?.nextDate,
      };
    }).filter(Boolean);
  }, [data.legal, data.vehicles, selectedVehicleId]);

  // Ultime operazioni (max 8) - MEMOIZED
  const recentOps = useMemo(() => {
    return [
      ...filteredExpenses.map(e => ({ 
        type: 'expense' as const, 
        date: e.date, 
        desc: e.category,
        amount: e.amount,
        vehicleId: e.vehicleId
      })),
      ...filteredMaintenance.map(m => ({ 
        type: 'maintenance' as const, 
        date: m.date, 
        desc: m.type,
        amount: m.cost,
        vehicleId: m.vehicleId
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [filteredExpenses, filteredMaintenance]);

  // Dati per grafici - MEMOIZED
  const monthlyData = useMemo(() => {
    const months: { [key: string]: number } = {};
    const allData = [...filteredExpenses.map(e => ({ date: e.date, amount: e.amount })),
                     ...filteredMaintenance.map(m => ({ date: m.date, amount: m.cost }))];
    
    // Ultimi 6 mesi
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    allData.forEach(item => {
      const d = new Date(item.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key] !== undefined) {
        months[key] += item.amount;
      }
    });

    return Object.entries(months).map(([key, value]) => ({
      month: new Date(key + '-01').toLocaleDateString('it-IT', { month: 'short' }),
      amount: value
    }));
  }, [filteredExpenses, filteredMaintenance]);

  const distributionData = useMemo(() => {
    const categories: { [key: string]: number } = {
      'Carburante': 0,
      'Manutenzione': 0,
      'Assicurazione': 0,
      'Bollo': 0,
      'Altro': 0
    };

    filteredExpenses.forEach(e => {
      if (e.category === 'carburante') categories['Carburante'] += e.amount;
      else if (e.category === 'assicurazione') categories['Assicurazione'] += e.amount;
      else if (e.category === 'bollo') categories['Bollo'] += e.amount;
      else if (['parcheggio', 'pedaggi', 'lavaggio', 'revisione', 'tasse', 'accessori'].includes(e.category)) categories['Altro'] += e.amount;
      else categories['Altro'] += e.amount;
    });

    filteredMaintenance.forEach(m => {
      categories['Manutenzione'] += m.cost;
    });

    // Aggiungi assicurazioni/bollo dai dati legali se non già presenti come spese
    data.legal.forEach(l => {
      if (selectedVehicleId === 'all' || l.vehicleId === selectedVehicleId) {
        // Solo se non ci sono già spese di quel tipo
        const hasInsuranceExpense = filteredExpenses.some(e => e.category === 'assicurazione' && e.vehicleId === l.vehicleId);
        const hasTaxExpense = filteredExpenses.some(e => e.category === 'bollo' && e.vehicleId === l.vehicleId);
        
        if (!hasInsuranceExpense && l.insurance?.amount) {
          categories['Assicurazione'] += l.insurance.amount;
        }
        if (!hasTaxExpense && l.tax?.amount) {
          categories['Bollo'] += l.tax.amount;
        }
      }
    });

    return Object.entries(categories)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredExpenses, filteredMaintenance, data.legal, selectedVehicleId]);

  // Render grafici con Canvas - LOGICA ORIGINALE INVARIATA
  useEffect(() => {
    if (!isLoaded) return;

    // Grafico barre mensili
    if (monthlyChartRef.current) {
      const ctx = monthlyChartRef.current.getContext('2d');
      if (ctx) {
        const canvas = monthlyChartRef.current;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        const maxValue = Math.max(...monthlyData.map(d => d.amount), 100);
        const barWidth = chartWidth / monthlyData.length * 0.6;
        const gap = chartWidth / monthlyData.length * 0.4;

        // Stile basato su CSS variables
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? 'hsl(210, 20%, 65%)' : 'hsl(215, 16%, 47%)';
        const barColor = isDark ? 'hsl(217, 91%, 60%)' : 'hsl(217, 91%, 45%)';
        const gridColor = isDark ? 'hsl(217, 32%, 20%)' : 'hsl(214, 32%, 91%)';

        // Griglia
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const y = padding.top + (chartHeight / 4) * i;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
        }

        // Etichette Y
        ctx.fillStyle = textColor;
        ctx.font = '11px system-ui';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
          const value = maxValue - (maxValue / 4) * i;
          const y = padding.top + (chartHeight / 4) * i;
          ctx.fillText(`€${Math.round(value)}`, padding.left - 8, y + 4);
        }

        // Barre
        monthlyData.forEach((d, i) => {
          const x = padding.left + (chartWidth / monthlyData.length) * i + gap / 2;
          const barHeight = (d.amount / maxValue) * chartHeight;
          const y = padding.top + chartHeight - barHeight;

          const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
          gradient.addColorStop(0, barColor);
          gradient.addColorStop(1, isDark ? 'hsl(217, 91%, 70%)' : 'hsl(217, 91%, 55%)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 4);
          ctx.fill();

          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';
          ctx.fillText(d.month, x + barWidth / 2, height - padding.bottom + 20);
        });
      }
    }

    // Grafico torta distribuzione - LOGICA ORIGINALE INVARIATA
    if (distributionChartRef.current) {
      const ctx = distributionChartRef.current.getContext('2d');
      if (ctx) {
        const canvas = distributionChartRef.current;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const centerX = width * 0.35;
        const centerY = height / 2;
        const radius = Math.min(width * 0.3, height * 0.4);

        ctx.clearRect(0, 0, width, height);

        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? 'hsl(210, 20%, 98%)' : 'hsl(222, 47%, 11%)';
        const mutedColor = isDark ? 'hsl(210, 20%, 65%)' : 'hsl(215, 16%, 47%)';

        const colors = [
          isDark ? 'hsl(217, 91%, 60%)' : 'hsl(217, 91%, 45%)',
          isDark ? 'hsl(142, 76%, 42%)' : 'hsl(142, 76%, 36%)',
          isDark ? 'hsl(38, 92%, 50%)' : 'hsl(38, 92%, 50%)',
          isDark ? 'hsl(280, 65%, 55%)' : 'hsl(280, 65%, 45%)',
          isDark ? 'hsl(0, 63%, 45%)' : 'hsl(0, 84%, 60%)',
        ];

        const total = distributionData.reduce((sum, d) => sum + d.value, 0);
        
        if (total === 0) {
          ctx.fillStyle = mutedColor;
          ctx.font = '14px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('Nessun dato', centerX, centerY);
          return;
        }

        let startAngle = -Math.PI / 2;
        distributionData.forEach((d, i) => {
          const sliceAngle = (d.value / total) * 2 * Math.PI;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
          ctx.closePath();
          ctx.fillStyle = colors[i % colors.length];
          ctx.fill();
          startAngle += sliceAngle;
        });

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.55, 0, 2 * Math.PI);
        ctx.fillStyle = isDark ? 'hsl(222, 47%, 11%)' : 'hsl(0, 0%, 100%)';
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(formatCurrency(total), centerX, centerY - 5);
        ctx.font = '11px system-ui';
        ctx.fillStyle = mutedColor;
        ctx.fillText('Totale', centerX, centerY + 12);

        const legendX = width * 0.65;
        let legendY = 20;
        distributionData.forEach((d, i) => {
          ctx.fillStyle = colors[i % colors.length];
          ctx.beginPath();
          ctx.roundRect(legendX, legendY, 12, 12, 2);
          ctx.fill();
          ctx.fillStyle = textColor;
          ctx.font = '12px system-ui';
          ctx.textAlign = 'left';
          ctx.fillText(d.name, legendX + 18, legendY + 10);
          ctx.fillStyle = mutedColor;
          ctx.font = '11px system-ui';
          ctx.fillText(formatCurrency(d.value), legendX + 18, legendY + 25);
          legendY += 40;
        });
      }
    }
  }, [monthlyData, distributionData, isLoaded]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ok': return 'success';
      case 'in_scadenza': return 'warning';
      case 'scaduto': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ok': return 'OK';
      case 'in_scadenza': return 'Scadenza';
      case 'scaduto': return 'Scaduto';
      default: return 'N/D';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      carburante: 'Carburante', parcheggio: 'Parcheggio', pedaggi: 'Pedaggi',
      lavaggio: 'Lavaggio', accessori: 'Accessori', assicurazione: 'Assicurazione',
      bollo: 'Bollo', revisione: 'Revisione', tasse: 'Tasse', altro: 'Altro',
      tagliando: 'Tagliando', freni: 'Freni', gomme: 'Gomme', olio: 'Olio',
      filtri: 'Filtri', batteria: 'Batteria', frizione: 'Frizione', sospensioni: 'Sospensioni',
    };
    return labels[category] || category;
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6 pb-20 md:pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* === 1) HEADER DASHBOARD === */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>

          <h1 className="text-2xl font-sans font-bold tracking-tight md:text-3xl">Dashboard</h1>

          <p className="text-sm text-muted-foreground">Centro di controllo veicoli</p>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[180px] justify-between">
                <span className="flex items-center gap-2">
                  {selectedVehicle ? (
                    <>
                      {selectedVehicle.type === 'auto' ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                      <span className="truncate">{selectedVehicle.brand} {selectedVehicle.model}</span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4" />
                      <span>Tutti i veicoli</span>
                    </>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setSelectedVehicleId('all')}>
                <Activity className="mr-2 h-4 w-4" />
                Tutti i veicoli
              </DropdownMenuItem>
              {data.vehicles.map(v => (
                <DropdownMenuItem key={v.id} onClick={() => setSelectedVehicleId(v.id)}>
                  {v.type === 'auto' ? <Car className="mr-2 h-4 w-4" /> : <Bike className="mr-2 h-4 w-4" />}
                  {v.brand} {v.model}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge 
            variant={overallStatus.color === 'success' ? 'outline' : overallStatus.color === 'warning' ? 'outline' : 'destructive'}
            className={cn(
              "gap-1.5 px-3 py-1.5",
              overallStatus.color === 'success' && "border-success text-success bg-success/10",
              overallStatus.color === 'warning' && "border-warning text-warning bg-warning/10"
            )}
          >
            <overallStatus.icon className="h-3.5 w-3.5" />
            {overallStatus.label}
          </Badge>
        </div>
      </div>

      {/* === 2) KPI CARDS === */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {/* KPI 1: Efficienza */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4 }}>
        <GlassmorphicCard className="border-l-2 border-l-violet-500">
          <CardContent className="p-4">

            <p className="text-[13px] font-sans font-bold text-red-600 uppercase tracking-widest mb-1">Efficienza Media</p>
            <div className="text-2xl font-bold text-blue-600 text-foreground">{fleetStats.avgEfficiency}/100</div>

          </CardContent>
        </GlassmorphicCard>
        </motion.div>

        {/* KPI 2: Esenzioni */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <GlassmorphicCard className="border-l-2 border-l-teal-500">
          <CardContent className="p-4">

            <p className="text-[11px] font-sans text--primary uppercase tracking-widest mb-1">Esenti Bollo</p>
            <div className="text-2xl font-sans font-medium text-foreground">{fleetStats.totalTaxExempt}</div>

            </CardContent>
        </GlassmorphicCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Spese Veicolo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">

            <div className="text-2xl font-sans font-bolt font-medium text-blue-600">{formatCurrency(kpiData.totalExpensesSelected)}</div>

            <p className="text-xs text-muted-foreground mt-1 truncate">
              {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'Selezionato'}
            </p>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Media Mensile
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-foreground">{formatCurrency(kpiData.monthlyAverage)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ultimi 12 mesi</p>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
        <Card className={cn(activeAlerts > 0 && "border-warning/50 bg-warning/5")}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className={cn("h-3.5 w-3.5", activeAlerts > 0 && "text-warning")} />
              Avvisi
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={cn("text-2xl font-bold", activeAlerts > 0 ? "text-warning" : "text-foreground")}>{activeAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {alerts.filter(a => a.status === 'scaduto').length} scaduti
            </p>
          </CardContent>
        </Card>
        </motion.div>
      </div>

      {/* === 3) STATO LEGALE === */}
      <GlassmorphicCard>
        <GlassmorphicCardHeader>

          <GlassmorphicCardTitle className="flex items-center gap-2 text-lg font-sans font-semibold">

            <Shield className="h-5 w-5 text-primary" />
            Stato Legale & Verifiche
          </GlassmorphicCardTitle>
        </GlassmorphicCardHeader>
        <CardContent>
          {data.vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aggiungi un veicolo per vedere lo stato legale</p>
          ) : legalStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nessun documento legale configurato</p>
          ) : (
            <div className="space-y-3">
              {legalStatuses.slice(0, selectedVehicleId === 'all' ? 3 : 1).map((status, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-sm font-medium min-w-[120px]">{status!.vehicleName}</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getStatusBadgeVariant(status!.insurance)} className="gap-1">
                      Assicurazione: {getStatusLabel(status!.insurance)}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(status!.tax)} className="gap-1">
                      Bollo: {getStatusLabel(status!.tax)}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(status!.inspection)} className="gap-1">
                      Revisione: {getStatusLabel(status!.inspection)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </GlassmorphicCard>

      {/* === 4) ATTIVITÀ RECENTI & 5) ANALISI RAPIDA === */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Attività Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nessuna operazione registrata</p>
            ) : (
              <div className="space-y-2">
                {recentOps.map((op, idx) => {
                  const vehicle = data.vehicles.find(v => v.id === op.vehicleId);
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        op.type === 'expense' ? "bg-primary/10" : "bg-success/10"
                      )}>
                        {op.type === 'expense' ? <Fuel className="h-4 w-4 text-primary" /> : <Wrench className="h-4 w-4 text-success" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{getCategoryLabel(op.desc)}</p>
                          <span className="text-sm font-semibold shrink-0">{formatCurrency(op.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground truncate">{vehicle?.brand} {vehicle?.model}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{formatDate(op.date)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Spese Mensili
              </CardTitle>
            </CardHeader>
            <CardContent>
              <canvas ref={monthlyChartRef} className="w-full" style={{ height: '160px' }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Distribuzione Costi</CardTitle>
            </CardHeader>
            <CardContent>
              <canvas ref={distributionChartRef} className="w-full" style={{ height: '180px' }} />
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}