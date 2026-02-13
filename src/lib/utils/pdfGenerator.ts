import { Vehicle, Maintenance, Expense, Battery, Tire, LegalDocument, Insurance, Tax, Inspection } from '@/types/vehicle';
import { 
  calculateVehicleAge, 
  calculateRoadTaxStatus, 
  calculateEfficiencyIndex,
  VehicleAgeResult,
  EfficiencyIndexResult,
  RoadTaxStatus
} from './vehicleCalculations';
import { estimateEuroClass } from './vehicleCalculations';

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
  
  // Calcola totali annuali (spese + manutenzioni)
  const totalsByYear = [...expenses.map(e => ({ date: e.date, amount: e.amount })), ...maintenance.map(m => ({ date: m.date, amount: m.cost }))].reduce((acc, item) => {
    const y = new Date(item.date).getFullYear();
    acc[y] = (acc[y] || 0) + item.amount;
    return acc;
  }, {} as Record<number, number>);
  const totalsByYearRows = Object.keys(totalsByYear)
    .sort((a, b) => Number(a) - Number(b))
    .map(y => `<tr><td style="width:120px">${y}</td><td>${formatCurrency(totalsByYear[Number(y)])}</td></tr>`)
    .join('');
  
  // Costo medio per km
  const costPerKm = vehicle.currentKm > 0 ? (totalCostOfOwnership / vehicle.currentKm) : 0;
  
  // Stato assicurazione / revisione
  const insuranceStatus = legal.insurance?.endDate ? (new Date(legal.insurance.endDate).getTime() - new Date().getTime() < 0 ? 'Scaduto' : ((new Date(legal.insurance.endDate).getTime() - new Date().getTime()) / (1000*60*60*24) <= 30 ? 'In Scadenza' : 'OK')) : 'N/D';
  const inspectionStatus = legal.inspection?.nextDate ? (new Date(legal.inspection.nextDate).getTime() - new Date().getTime() < 0 ? 'Scaduto' : ((new Date(legal.inspection.nextDate).getTime() - new Date().getTime()) / (1000*60*60*24) <= 30 ? 'In Scadenza' : 'OK')) : 'N/D';
  
  // Stato tagliando
  const lastService = maintenance
    .filter(m => m.vehicleId === vehicle.id && m.type === 'tagliando')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const tagliandoNextDate = lastService?.nextMaintenanceDate || null;
  let tagliandoStatus = 'N/D';
  if (tagliandoNextDate) {
    const diffDays = (new Date(tagliandoNextDate).getTime() - new Date().getTime()) / (1000*60*60*24);
    tagliandoStatus = diffDays < 0 ? 'Scaduto' : (diffDays <= 30 ? 'In Scadenza' : 'OK');
  }
  
  // Motivazione bollo
  const roadTaxReason = (() => {
    switch (roadTaxStatus) {
      case 'Exempt (Law 104/Disability)': return 'Esenzione Legge 104/Disabilità';
      case 'Exempt (Historic Vehicle)': return 'Veicolo storico (≥30 anni)';
      case 'Exempt (Electric < 5y)': return 'Elettrico con età ≤ 5 anni';
      case 'Exempt/Check Region (Hybrid)': return 'Ibrido (verifica regole regionali)';
      default: return 'Dovuto';
    }
  })();
  
  // Traduzione stato bollo per UI
  const roadTaxStatusLabel = (() => {
    if (roadTaxStatus === 'Payable') return 'Da Pagare';
    if (roadTaxStatus === 'Paid') return 'Pagato';
    return 'Esente';
  })();

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
      line-height: 1.4;
      color: #1a1a1a;
      background: #fff;
      padding: 12px;
      font-size: 11px;
    }
    
    .header {
      border-bottom: 2px solid #8b5cf6;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    
    .header h1 {
      color: #8b5cf6;
      font-size: 20px;
      margin-bottom: 4px;
    }
    
    .header .subtitle {
      color: #666;
      font-size: 11px;
    }
    
    .section {
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    
    .section-title {
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
      color: white;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      border-radius: 6px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      margin-bottom: 8px;
    }
    
    .info-item {
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }
    
    .info-label {
      font-weight: 600;
      color: #666;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }
    
    .info-value {
      font-size: 11px;
      color: #1a1a1a;
      font-weight: 500;
    }
    
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 9px;
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
      border-left: 3px solid #8b5cf6;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 6px;
    }
    
    .index-card h3 {
      font-size: 12px;
      color: #8b5cf6;
      margin-bottom: 6px;
    }
    
    .index-score {
      font-size: 22px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 10px;
    }
    
    table thead {
      background: #f8f9fa;
    }
    
    table th {
      padding: 6px;
      text-align: left;
      font-weight: 600;
      color: #666;
      border-bottom: 1px solid #e5e5e5;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.5px;
    }
    
    table td {
      padding: 6px;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .total-row {
      background: #f8f9fa;
      font-weight: 600;
      border-top: 1px solid #8b5cf6;
    }
    
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      color: #999;
      font-size: 9px;
    }
    
    @media print {
      body {
        padding: 8px;
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
        <div class="info-label">Tipo Veicolo</div>
        <div class="info-value">${vehicle.type.toUpperCase()}</div>
      </div>
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
        <div class="info-label">Km Attuali</div>
        <div class="info-value">${vehicle.currentKm.toLocaleString('it-IT')} km</div>
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
        <div class="info-label">Classe Ambientale</div>
        <div class="info-value">Euro ${estimateEuroClass(vehicle)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Esenzione Bollo</div>
        <div class="info-value">${vehicle.disabilityExemption ? 'Si (Legge 104)' : 'No'}</div>
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
      <div class="info-item">
        <div class="info-label">Stato Assicurazione</div>
        <div class="info-value">${insuranceStatus}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Stato Bollo</div>
        <div class="info-value">${roadTaxStatusLabel}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Stato Revisione</div>
        <div class="info-value">${inspectionStatus}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Costo Medio per Km</div>
        <div class="info-value">${formatCurrency(costPerKm)}</div>
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
      <div class="info-item">
        <div class="info-label">Motivazione</div>
        <div class="info-value">${roadTaxReason}</div>
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
        <div class="info-label">Stato Assicurazione</div>
        <div class="info-value">${insuranceStatus}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Scadenza Revisione</div>
        <div class="info-value">${legal.inspection ? formatDate(legal.inspection.nextDate) : 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Stato Revisione</div>
        <div class="info-value">${inspectionStatus}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Stato Tagliando</div>
        <div class="info-value">${tagliandoStatus}${tagliandoNextDate ? ` (prox: ${formatDate(tagliandoNextDate)})` : ''}</div>
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
          <th>Chilometri</th>
          <th>Tipo Intervento</th>
          <th>Fai da te</th>
          <th>Officina/Meccanico</th>
          <th>Ricambi</th>
          <th>Note</th>
          <th>Prossima Manutenzione</th>
          <th>Costo</th>
        </tr>
      </thead>
      <tbody>
        ${maintenance.map(m => `
        <tr>
          <td>${formatDate(m.date)}</td>
          <td>${m.km.toLocaleString('it-IT')}</td>
          <td>${m.type}</td>
          <td>${m.isDiy ? 'SI' : 'NO'}</td>
          <td>${m.isDiy ? '-' : (m.workshop || '-')}</td>
          <td>${m.spareParts || '-'}</td>
          <td>${m.notes || '-'}</td>
          <td>${m.nextMaintenanceKm ? (m.nextMaintenanceKm.toLocaleString('it-IT') + ' km') : (m.nextMaintenanceDate ? formatDate(m.nextMaintenanceDate) : '-')}</td>
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
  
  <!-- SEZIONE 7: TOTALI ANNUALI -->
  <div class="section">
    <div class="section-title">📅 Totali Annuali</div>
    ${totalsByYearRows ? `
    <table>
      <thead>
        <tr>
          <th>Anno</th>
          <th>Totale</th>
        </tr>
      </thead>
      <tbody>
        ${totalsByYearRows}
        <tr class="total-row">
          <td style="text-align: right;">Totale Complessivo</td>
          <td>${formatCurrency(totalCostOfOwnership)}</td>
        </tr>
      </tbody>
    </table>
    ` : '<p style="color: #999; text-align: center; padding: 20px;">Nessun dato annuale</p>'}
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
