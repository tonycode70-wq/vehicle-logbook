import React, { useState, useMemo } from 'react';
import { useVehicleContext } from '@/contexts/VehicleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/lib/utils/dates';
import { History as HistoryIcon, Search, Car, FileText, Wrench, Wallet, Database, Settings } from 'lucide-react';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'VEICOLO_AGGIUNTO': <Car className="h-4 w-4 text-chart-2" />,
  'VEICOLO_ELIMINATO': <Car className="h-4 w-4 text-destructive" />,
  'KM_AGGIORNATI': <Car className="h-4 w-4 text-primary" />,
  'MANUTENZIONE_AGGIUNTA': <Wrench className="h-4 w-4 text-chart-3" />,
  'MANUTENZIONE_ELIMINATA': <Wrench className="h-4 w-4 text-destructive" />,
  'SPESA_AGGIUNTA': <Wallet className="h-4 w-4 text-chart-5" />,
  'SPESA_ELIMINATA': <Wallet className="h-4 w-4 text-destructive" />,
  'DOCUMENTO_AGGIORNATO': <FileText className="h-4 w-4 text-chart-1" />,
  'OBD_LETTURA': <Database className="h-4 w-4 text-chart-4" />,
};

const ACTION_LABELS: Record<string, string> = {
  'VEICOLO_AGGIUNTO': 'Veicolo aggiunto',
  'VEICOLO_ELIMINATO': 'Veicolo eliminato',
  'KM_AGGIORNATI': 'Km aggiornati',
  'MANUTENZIONE_AGGIUNTA': 'Manutenzione aggiunta',
  'MANUTENZIONE_ELIMINATA': 'Manutenzione eliminata',
  'SPESA_AGGIUNTA': 'Spesa aggiunta',
  'SPESA_ELIMINATA': 'Spesa eliminata',
  'DOCUMENTO_AGGIORNATO': 'Documento aggiornato',
  'OBD_LETTURA': 'Lettura OBD',
};

export function History() {
  const { data } = useVehicleContext();
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    let logs = [...data.logs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (selectedVehicle !== 'all') {
      logs = logs.filter(l => l.vehicleId === selectedVehicle);
    }

    if (selectedAction !== 'all') {
      logs = logs.filter(l => l.action === selectedAction);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      logs = logs.filter(l => 
        l.details.toLowerCase().includes(query) ||
        l.action.toLowerCase().includes(query)
      );
    }

    return logs;
  }, [data.logs, selectedVehicle, selectedAction, searchQuery]);

  const getVehicleName = (vehicleId: string) => {
    if (vehicleId === 'system') return 'Sistema';
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veicolo eliminato';
  };

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(data.logs.map(l => l.action)));
  }, [data.logs]);

  if (data.logs.length === 0) {
    return (
      <div className="text-center py-12">
        <HistoryIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Registro Storico</h1>
        <p className="text-muted-foreground mt-2">
          Le attività verranno registrate automaticamente qui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registro Storico</h1>
        <p className="text-muted-foreground">Cronologia completa delle attività</p>
      </div>

      {/* Filtri */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="Tutti i veicoli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i veicoli</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                {data.vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.brand} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le azioni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le azioni</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Attività</span>
            <Badge variant="secondary">{filteredLogs.length} voci</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {ACTION_ICONS[log.action] || <Settings className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getVehicleName(log.vehicleId)}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm">{log.details}</p>
                    
                    {(log.previousValue || log.newValue) && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {log.previousValue && (
                          <span className="px-2 py-1 bg-destructive/10 text-destructive rounded">
                            {log.previousValue}
                          </span>
                        )}
                        {log.previousValue && log.newValue && <span>→</span>}
                        {log.newValue && (
                          <span className="px-2 py-1 bg-chart-2/10 text-chart-2 rounded">
                            {log.newValue}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium">
                      {formatDate(log.date, 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.date, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nessuna attività trovata con i filtri selezionati
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
