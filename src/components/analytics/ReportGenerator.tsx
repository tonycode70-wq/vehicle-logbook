import React from 'react';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Printer, Car, Euro } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDate } from '@/lib/utils/dates';

export function ReportGenerator() {
  const { data, getVehicleAnalytics, getLegalDeadlines } = useVehicleContext();
  const isMobile = useIsMobile();

  const exportCSV = () => {
    const rows = [
      ['Veicolo', 'Targa', 'KM', 'Costo/KM', 'Scadenza Bollo', 'Prossima Revisione']
    ];
    data.vehicles.forEach(vehicle => {
      const stats = getVehicleAnalytics(vehicle.id);
      const legal = getLegalDeadlines(vehicle.id);
      rows.push([
        `${vehicle.brand} ${vehicle.model}`,
        vehicle.plate,
        String(vehicle.currentKm),
        stats?.costPerKm ?? '0.00',
        legal?.nextTax === 'Esente' ? 'Esente' : (legal?.nextTax ? formatDate(legal.nextTax) : ''),
        legal?.nextInspection ? formatDate(legal.nextInspection) : ''
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report-flotta.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (isMobile) {
      exportCSV();
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Report Esportazione Flotta
        </h2>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> {isMobile ? 'Scarica CSV' : 'Stampa / Salva PDF'}
          </Button>
          <Button onClick={exportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Scarica CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 print:block">
        {data.vehicles.map((vehicle) => {
          const stats = getVehicleAnalytics(vehicle.id);
          const legal = getLegalDeadlines(vehicle.id);

          return (
            <Card key={vehicle.id} className="overflow-hidden print:shadow-none print:border-b print:mb-8">
              <CardHeader className="bg-slate-50 print:bg-white border-b">
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <span>{vehicle.brand} {vehicle.model}</span>
                  </div>
                  <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                    {vehicle.plate}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">KM Totali</p>
                    <p className="font-bold">{vehicle.currentKm.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Costo Reale/KM</p>
                    <p className="font-bold text-primary">€ {stats?.costPerKm}</p>
                  </div>
          <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Scadenza Bollo</p>
            <p className="font-bold">
              {legal?.nextTax === 'Esente' ? 'Esente' : (legal?.nextTax ? formatDate(legal.nextTax) : '')}
            </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Prossima Revisione</p>
                    <p className={`font-bold ${legal?.isUrgent ? 'text-destructive' : ''}`}>
              {legal?.nextInspection ? formatDate(legal.nextInspection) : ''}
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-slate-50/50">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Euro className="h-4 w-4" /> Riepilogo Finanziario
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Totale Manutenzioni:</span>
                      <span className="font-medium">€ {stats?.totalMaintenance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Totale Altre Spese:</span>
                      <span className="font-medium">€ {stats?.totalExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                      <span>Investimento Totale:</span>
                      <span>€ {stats?.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; background: white; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}} />
    </div>
  );
}
