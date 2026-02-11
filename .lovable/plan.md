
# 🚗 VehicleManager Pro - Gestione Veicoli Completa

App PWA professionale per la gestione completa di auto e moto, con interfaccia italiana, tema chiaro/scuro e funzionalità offline.

---

## 🏠 Dashboard Principale
La pagina iniziale mostrerà una panoramica completa:
- **Riepilogo veicoli** con card visive per ogni mezzo
- **Totale spese** e media mensile calcolata automaticamente
- **Avvisi rapidi** per scadenze imminenti (assicurazione, bollo, revisione)
- **Ultime operazioni** registrate
- **Veicolo più costoso** evidenziato
- Toggle tema chiaro/scuro nell'header

---

## 🚙 Gestione Veicoli
Sezione dedicata alla registrazione e modifica veicoli:
- Selezione tipo: **Auto** o **Moto**
- Campi dinamici in base al tipo selezionato
- Informazioni complete: marca, modello, versione, anno, colore, alimentazione, cilindrata, potenza kW, targa, VIN (obbligatorio), km attuali
- Lista veicoli con filtri e ricerca rapida
- Dettaglio singolo veicolo con storico completo

---

## ⚖️ Stato Legale & Scadenze
Gestione documenti obbligatori per ogni veicolo:
- **Assicurazione**: compagnia, periodo, importo, stato
- **Bollo**: anno, regione, importo, stato
- **Revisione**: data ultima, prossima scadenza, esito

Stato calcolato automaticamente:
- 🟢 OK (in regola)
- 🟡 In scadenza (entro 30 giorni)
- 🔴 Scaduto

---

## 🔧 Manutenzioni
Registro tecnico completo:
- Data e km intervento
- Tipo intervento (tagliando, freni, gomme, ecc.)
- Officina o fai-da-te
- Ricambi utilizzati
- Costo totale
- Note e suggerimento prossima manutenzione
- Storico filtrabile per veicolo

---

## 💰 Gestione Spese
Tracciamento di tutte le spese:
- Categorie predefinite (carburante, parcheggio, pedaggi, lavaggio, accessori, altro)
- Data, importo, metodo pagamento
- Km al momento della spesa
- Descrizione libera
- Vista mensile con totali

---

## 📊 Analisi & Grafici
Dashboard analitica con:
- **Grafici spese mensili** (barre/linee)
- **Distribuzione costi** per categoria (torta)
- **Andamento nel tempo** (trend)
- **Costo medio al km** per veicolo
- Filtri per veicolo, periodo, categoria
- Ricerca testuale e ordinamento

---

## 📜 Registro Storico
Log automatico delle attività:
- Aggiornamenti chilometrici
- Modifiche documenti legali
- Interventi importanti
- Data, ora e dettaglio modifica
- Storico consultabile per veicolo

---

## 🔌 OBD Ready (Diagnostica)
Sezione per dati diagnostici:
- Import manuale file CSV
- Storico letture OBD
- Visualizzazione codici errore
- Note e timestamp per ogni lettura

---

## 💾 Backup & Export
Funzionalità di sicurezza dati:
- **Export JSON** completo per backup
- **Import JSON** per ripristino
- **Export PDF** report stampabili (veicolo, spese, manutenzioni)
- Conferma prima di sovrascrivere dati

---

## 📱 PWA & Mobile First
Caratteristiche tecniche:
- Service worker per funzionamento offline completo
- Manifest.json con icone 192x512 px
- Installabile su smartphone come app nativa
- Navigazione a tab mobile-friendly
- Design responsive con Tailwind CSS
- Dati salvati esclusivamente in LocalStorage (chiave: `vehicleManagerData`)

---

## 🎨 Stile UI
- Design automotive sobrio e professionale
- Palette colori elegante con accenti blu/grigio
- Toggle tema chiaro ↔ scuro
- Icone Lucide per coerenza visiva
- Modali uniformi per tutte le azioni
- Feedback visivi per ogni operazione
