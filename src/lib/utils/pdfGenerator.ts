import { Vehicle, Maintenance, Expense, Battery, Tire, LegalDocument, Insurance, Tax, Inspection } from '@/types/vehicle';
import { 
  calculateVehicleAge, 
  calculateRoadTaxStatus, 
  calculateEfficiencyIndex,
  VehicleAgeResult,
  EfficiencyIndexResult,
  RoadTaxStatus
} from './vehicleCalculations';

/**
 * Interfaccia per i dati completi del veicolo da includere nel PDF
 */
export interface VehiclePDFData {
  vehicle: Vehicle;
  ageData: VehicleAgeResult;
  roadTaxStatus: RoadTaxStatus;
  efficiencyIndex: EfficiencyIndexResult;
  reliabilityIndex?: number;
  legal: {
    insurance?: Insurance;
    tax?: Tax;
    inspection?: Inspection;
  };
  technical: {
    battery?: Battery;
    tire?: Tire;
  };
  maintenance: Maintenance[];
  expenses: Expense[];
  totalCostOfOwnership: number;
}

/**
 * Formatta una data in formato italiano dd/MM/yyyy
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Formatta un numero come valuta EUR
 */
function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '€ 0,00';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Genera il contenuto HTML per il PDF completo del veicolo
 */
export function generateVehiclePDFContent(data: VehiclePDFData): string {
  const { vehicle, ageData, roadTaxStatus, efficiencyIndex, legal, technical, maintenance, expenses, totalCostOfOwnership } = data;
  
  // Calcola totali per categoria di spesa
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scheda Veicolo - ${vehicle.brand} ${vehicle.model}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #fff;
      padding: 40px;
      font-size: 12px;
    }
    
    .header {
      border-bottom: 4px solid #8b5cf6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #8b5cf6;
      font-size: 28px;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section-title {
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
      color: white;
      padding: 10px 15px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      border-radius: 6px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px 30px;
      margin-bottom: 15px;
    }
    
    .info-item {
      padding: 8px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .info-label {
      font-weight: 600;
      color: #666;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 13px;
      color: #1a1a1a;
      font-weight: 500;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge-excellent { background: #10b981; color: white; }
    .badge-good { background: #3b82f6; color: white; }
    .badge-monitor { background: #f59e0b; color: white; }
    .badge-critical { background: #ef4444; color: white; }
    .badge-exempt { background: #10b981; color: white; }
    .badge-payable { background: #f59e0b; color: white; }
    
    .index-card {
      background: #f8f9fa;
      border-left: 4px solid #8b5cf6;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 6px;
    }
    
    .index-card h3 {
      font-size: 14px;
      color: #8b5cf6;
      margin-bottom: 10px;
    }
    
    .index-score {
      font-size: 32px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 5px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 11px;
    }
    
    table thead {
      background: #f8f9fa;
    }
    
    table th {
      padding: 10px;
      text-align: left;
      font-weight: 600;
      color: #666;
      border-bottom: 2px solid #e5e5e5;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    
    table td {
      padding: 10px;
      border-bottom: 1px solid #e5e5e5;
    }
    
    table tbody tr:hover {
      background: #fafafa;
    }
    
    .total-row {
      background: #f8f9fa;
      font-weight: 600;
      border-top: 2px solid #8b5cf6;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e5e5;
      text-align: center;
      color: #999;
      font-size: 10px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${vehicle.brand} ${vehicle.model}</h1>
    <div class="subtitle">${vehicle.version || ''} - Targa: ${vehicle.plate}</div>
  </div>

  <!-- SEZIONE 1: IDENTITÀ VEICOLO -->
  <div class="section">
    <div class="section-title">📋 Identità Veicolo</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Marca</div>
        <div class="info-value">${vehicle.brand}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Modello</div>
        <div class="info-value">${vehicle.model}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Versione</div>
        <div class="info-value">${vehicle.version || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Targa</div>
        <div class="info-value">${vehicle.plate}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Telaio (VIN)</div>
        <div class="info-value">${vehicle.vin}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data Immatricolazione</div>
        <div class="info-value">${formatDate(vehicle.registrationDate) || formatDate(vehicle.createdAt)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Età Veicolo</div>
        <div class="info-value">${ageData.ageYears} anni (${ageData.category})</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tipo Alimentazione</div>
        <div class="info-value">${vehicle.fuel.toUpperCase()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Anno</div>
        <div class="info-value">${vehicle.year}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Colore</div>
        <div class="info-value">${vehicle.color}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Cilindrata</div>
        <div class="info-value">${vehicle.displacement} cc</div>
      </div>
      <div class="info-item">
        <div class="info-label">Potenza</div>
        <div class="info-value">${vehicle.power} kW</div>
      </div>
    </div>
  </div>

  <!-- SEZIONE 2: INDICI PRESTAZIONE -->
  <div class="section">
    <div class="section-title">📊 Indici di Prestazione</div>
    
    <div class="index-card">
      <h3>Indice di Efficienza</h3>
      <div class="index-score">${efficiencyIndex.score}/100</div>
      <span class="badge badge-${efficiencyIndex.status.toLowerCase()}">${efficiencyIndex.status}</span>
      <div style="margin-top: 10px; font-size: 11px; color: #666;">
        Penalità Età: -${efficiencyIndex.agePenalty} | Penalità Km: -${efficiencyIndex.kmPenalty} | Bonus Manutenzione: +${efficiencyIndex.bonus}
      </div>
    </div>
    
    ${data.reliabilityIndex !== undefined ? `
    <div class="index-card">
      <h3>Indice di Affidabilità</h3>
      <div class="index-score">${data.reliabilityIndex}/100</div>
    </div>
    ` : ''}
  </div>

  <!-- SEZIONE 3: STATO LEGALE E SCADENZE -->
  <div class="section">
    <div class="section-title">⚖️ Stato Legale e Scadenze</div>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Stato Bollo Auto</div>
        <div class="info-value">
          <span class="badge ${roadTaxStatus === 'Payable' ? 'badge-payable' : 'badge-exempt'}">
            ${roadTaxStatus}
          </span>
        </div>
      </div>
      ${vehicle.disabilityExemption ? `
      <div class="info-item">
        <div class="info-label">Esenzione Disabilità</div>
        <div class="info-value">✓ Attiva (Legge 104)</div>
      </div>
      ` : ''}
      <div class="info-item">
        <div class="info-label">Scadenza Assicurazione</div>
        <div class="info-value">${legal.insurance ? formatDate(legal.insurance.endDate) : 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Scadenza Revisione</div>
        <div class="info-value">${legal.inspection ? formatDate(legal.inspection.nextDate) : 'N/A'}</div>
      </div>
    </div>
    
    ${legal.insurance ? `
    <div style="margin-top: 15px;">
      <h4 style="font-size: 13px; margin-bottom: 8px; color: #666;">Dettagli Assicurazione</h4>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Compagnia</div>
          <div class="info-value">${legal.insurance.company}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Numero Polizza</div>
          <div class="info-value">${legal.insurance.policyNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Premio Annuale</div>
          <div class="info-value">${formatCurrency(legal.insurance.amount)}</div>
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  <!-- SEZIONE 4: SPECIFICHE TECNICHE -->
  <div class="section">
    <div class="section-title">🔧 Specifiche Tecniche</div>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Chilometraggio Attuale</div>
        <div class="info-value">${vehicle.currentKm.toLocaleString('it-IT')} km</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tipo Olio</div>
        <div class="info-value">N/A</div>
      </div>
    </div>
    
    ${technical.battery ? `
    <div style="margin-top: 15px;">
      <h4 style="font-size: 13px; margin-bottom: 8px; color: #666;">Batteria</h4>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Marca</div>
          <div class="info-value">${technical.battery.brand}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Voltaggio</div>
          <div class="info-value">${technical.battery.voltage}V</div>
        </div>
        <div class="info-item">
          <div class="info-label">Amperaggio</div>
          <div class="info-value">${technical.battery.amperage}Ah</div>
        </div>
        <div class="info-item">
          <div class="info-label">Data Installazione</div>
          <div class="info-value">${formatDate(technical.battery.installDate)}</div>
        </div>
      </div>
    </div>
    ` : ''}
    
    ${technical.tire ? `
    <div style="margin-top: 15px;">
      <h4 style="font-size: 13px; margin-bottom: 8px; color: #666;">Pneumatici</h4>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Marca</div>
          <div class="info-value">${technical.tire.brand}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Modello</div>
          <div class="info-value">${technical.tire.model}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Tipo</div>
          <div class="info-value">${technical.tire.type.replace('_', ' ')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Data Montaggio</div>
          <div class="info-value">${formatDate(technical.tire.mountDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Misura Anteriore</div>
          <div class="info-value">${technical.tire.frontSize} (${technical.tire.frontPressure} bar)</div>
        </div>
        <div class="info-item">
          <div class="info-label">Misura Posteriore</div>
          <div class="info-value">${technical.tire.rearSize} (${technical.tire.rearPressure} bar)</div>
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  <!-- SEZIONE 5: STORICO MANUTENZIONE -->
  <div class="section">
    <div class="section-title">🔨 Storico Manutenzione</div>
    ${maintenance.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Km</th>
          <th>Tipo</th>
          <th>Officina</th>
          <th>Costo</th>
        </tr>
      </thead>
      <tbody>
        ${maintenance.map(m => `
        <tr>
          <td>${formatDate(m.date)}</td>
          <td>${m.km.toLocaleString('it-IT')}</td>
          <td>${m.type}</td>
          <td>${m.isDiy ? '🔧 Fai-da-te' : m.workshop}</td>
          <td>${formatCurrency(m.cost)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p style="color: #999; text-align: center; padding: 20px;">Nessun record di manutenzione</p>'}
  </div>

  <!-- SEZIONE 6: STORICO SPESE -->
  <div class="section">
    <div class="section-title">💰 Storico Spese</div>
    ${expenses.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Categoria</th>
          <th>Descrizione</th>
          <th>Importo</th>
        </tr>
      </thead>
      <tbody>
        ${expenses.map(e => `
        <tr>
          <td>${formatDate(e.date)}</td>
          <td>${e.category}</td>
          <td>${e.description || '-'}</td>
          <td>${formatCurrency(e.amount)}</td>
        </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">TOTALE SPESE</td>
          <td>${formatCurrency(totalCostOfOwnership)}</td>
        </tr>
      </tbody>
    </table>
    
    <div style="margin-top: 20px;">
      <h4 style="font-size: 13px; margin-bottom: 8px; color: #666;">Riepilogo per Categoria</h4>
      <div class="info-grid">
        ${Object.entries(expensesByCategory).map(([cat, amount]) => `
        <div class="info-item">
          <div class="info-label">${cat}</div>
          <div class="info-value">${formatCurrency(amount)}</div>
        </div>
        `).join('')}
      </div>
    </div>
    ` : '<p style="color: #999; text-align: center; padding: 20px;">Nessuna spesa registrata</p>'}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    Documento generato il ${new Date().toLocaleDateString('it-IT')} da Vehicle Manager Pro<br>
    Tutti i dati sono aggiornati alla data di generazione del report
  </div>
</body>
</html>
  `;
}

/**
 * Scarica il PDF del veicolo aprendo una finestra di stampa con il contenuto
 */
export async function downloadVehiclePDF(data: VehiclePDFData): Promise<void> {
  const htmlContent = generateVehiclePDFContent(data);
  
  // Apri una nuova finestra per la stampa
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Impossibile aprire la finestra di stampa. Controlla le impostazioni del browser.');
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Attendi che il contenuto sia caricato prima di stampare
  printWindow.onload = () => {
    printWindow.print();
  };
}
