# CountryLife – La casa europea della Line Dance

## 🎯 Obiettivo del Progetto
Piattaforma europea dedicata alla Line Dance: eventi, community, scuole, academy, marketplace, recruiting e travel.

---

## ✅ Funzionalità Implementate (MVP v0.1)

### HOME – Single Page
- **Navbar** fissa con scroll-effect, menu ancorato, hamburger mobile, switch lingua IT/EN
- **Hero Section** con logo testuale, payoff, 3 CTA principali (Trova Eventi / Unisciti / Cerca Scuola)
- **Statistiche Community** dinamiche via API tabella `stats` con animazione contatore
- **Sezione Eventi** con filtri interattivi (Festival / Competizioni / Workshop / Raduni), cards evento
- **Sezione Travel** con grid Hotel / Camping / Camper / Pacchetti Weekend
- **Sezione Scuole** con barra di ricerca live, cards con rating a stelle
- **Sezione Academy** con 3 livelli (Beginner / Intermediate / Advanced+Certificazioni)
- **Sezione Marketplace** con categorie cliccabili + product cards
- **Sezione Recruiting** con panel Trova Insegnante / Bacheca Opportunità
- **Sezione Premium** €9,90/mese con features grid
- **Area Organizzatore** con 6 feature cards
- **Sezione Community** preview con 6 funzioni
- **Footer** completo con colonne link + copyright

### UX/UI
- Scroll reveal animazioni su tutte le cards
- Lingua IT/EN persistita in localStorage
- Menu mobile hamburger animato
- Active nav link via IntersectionObserver
- Ricerca scuole live client-side
- Filtro eventi per categoria
- Design palette: Midnight Black / Saddle Brown / Sand Beige / Warm White / Burnt Orange
- Tipografia: Playfair Display (heading) + Inter (body)
- Font Awesome 6.5 icons
- Fully responsive (1200px / 1024px / 768px / 480px breakpoints)

---

## 📡 Entry Points

| Percorso | Descrizione |
|----------|-------------|
| `index.html` | Pagina unica – landing completa |

---

## 🗄️ Struttura Dati (Table API)

### Tabella: `stats`
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | text | Identificatore univoco |
| `label` | text | Etichetta italiana |
| `label_en` | text | Etichetta inglese |
| `value` | text | Valore mostrato (es. "1.250+") |
| `icon` | text | Classe Font Awesome (es. "fa-users") |
| `sort_order` | number | Ordine di visualizzazione |

---

## 🔧 Funzionalità NON ancora Implementate

- Login / Registrazione utenti
- Profilo ballerino completo (foto, badge, portfolio)
- Feed social / post / commenti / messaggi privati
- Calendario eventi completo con filtri avanzati (nazione, regione, data)
- Scheda evento dettagliata (programma, ticketing, hotel abbinati)
- Ticketing con pagamento
- Profilo scuola completo
- Recensioni scuole
- Lead generation scuola
- Corsi Academy con video reali
- Pagina Marketplace completa con carrello
- Sistema recruiting funzionante
- Abbonamento Premium con paywall
- Dashboard Organizzatore
- Analytics

---

## 📋 Prossimi Passi Consigliati

1. **Domande su AREA MEMBRO** – Gestione profilo, badge, portfolio
2. **Domande su EVENTI** – Calendario dettagliato, scheda evento, ticketing
3. **Domande su TRAVEL** – Come gestire hotel/camping partner
4. **Domande su SCUOLE** – Profilo scuola dettagliato, recensioni
5. **Integrazione dati reali** – Popolare tabella `stats` con valori aggiornabili

---

## 🎨 Palette Colori

| Nome | Hex | Utilizzo |
|------|-----|---------|
| Midnight Black | `#1B1B1B` | Testi, Hero bg, navbar |
| Saddle Brown | `#8B5E3C` | Elementi premium, accenti |
| Sand Beige | `#E8DCC8` | Sfondi secondari, tags |
| Warm White | `#F7F5F2` | Sfondo principale |
| Burnt Orange | `#D96C2D` | CTA, accenti, logo |
