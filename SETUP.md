# CountryLife App — Guida operativa (Fase 0 + Fase 1)

Tutto ciò che serve per passare da "file sul computer" a "app usabile".
Tempo stimato: 1–2 ore, quasi tutte su siti web (Firebase, Netlify),
pochissimo codice.

---

## 0. Prova locale (subito, gratis, 2 minuti)

L'app funziona anche **senza Firebase**, in modalità ospite con i dati
locali di `js/data.js`. Per provarla serve un server locale (il service
worker non parte da `file://`):

```sh
cd /Users/romanobenazzi/Downloads/_web_countrylife
python3 -m http.server 8000
```

Poi apri:

- Sito → http://localhost:8000/
- Eventi → http://localhost:8000/eventi.html
- **App → http://localhost:8000/app/**

In modalità ospite vedi eventi e scuole; login e preferiti mostrano un
messaggio che rimanda a questa guida (punto 2).

> Su Chrome desktop puoi simulare il telefono con F12 → icona telefono.
> Per il test vero su telefono, il deploy Netlify (punto 7) è più comodo.

---

## 1. Rinomina già fatta

Il file si chiamava `index-2.html` ma tutti i link puntavano a
`index.html` (che non esisteva). Ora il file **è** `index.html`.
Se hai segnalibri o link esterni a `index-2.html`, aggiornali.

---

## 2. Crea il progetto Firebase (5 minuti, piano gratuito)

1. Vai su https://console.firebase.google.com → **Crea un progetto**
   (nome es. `countrylife`, Google Analytics: disattivalo, non serve).
2. Nel progetto → **Compila** (icona `</>`) → registra l'app (nome
   `CountryLife Web`, hosting: NO) → copia l'oggetto `firebaseConfig`.
3. Incollalo in `app/js/config.js` al posto di `FIREBASE_CONFIG = null`.
4. Menu **Authentication** → **Sign-in method** → attiva
   **Email/password** (solo quella: niente Google per ora, un login
   in meno = una pagina di privacy in meno).
5. Sempre in Authentication → **Templates** → personalizza l'email di
   verifica (oggetto: "Conferma il tuo account CountryLife").
6. Menu **Firestore Database** → **Crea database** → **production mode**
   → zona `eur3` (Europa: i dati restano in UE, meglio per il GDPR).

Costo: piano **Spark (gratis)**. Limiti mensili: 50.000 letture,
20.000 scritture, 1 GB. Per 100 utenti beta è larghissimo.
**Non serve carta di credito** (hai scelto link esterni per foto/video,
quindi niente Storage e niente piano Blaze).

---

## 3. Security Rules: il cancello anti-GDPR (fondamentale)

Menu Firestore → **Rules** → incolla queste, poi **Pubblica**:

```
rules_version = '2';
service firebase.storage {
  match /databases/{database}/documents {

    // Helper: l'utente è loggato E ha verificato l'email
    function verificato() {
      return request.auth != null
          && request.auth.token.email_verified == true;
    }
    function proprietario(uid) {
      return verificato() && request.auth.uid == uid;
    }

    // EVENTI e SCUOLE: chiunque li legge (anche ospiti),
    // solo tu (da console) li scrivi
    match /eventi/{id} {
      allow read: if true;
      allow write: if false;
    }
    match /scuole/{id} {
      allow read: if true;
      allow write: if false;
    }

    // PROFILI: ognuno legge/scrive SOLO il proprio.
    // Niente lettura in elenco = niente email esposte (GDPR).
    // La scrittura richiede email verificata: i falsi restano
    // fuori dal conteggio dei 100.
    match /users/{uid} {
      allow read: if proprietario(uid);
      allow create: if verificato()
          && request.resource.data.keys().hasOnly([
            'nome','ruoli','livello','citta','paeseCodice',
            'bio','fotoUrl','videoUrl','emailVerificata',
            'premium','creatoIl'])
          && request.resource.data.nome is string
          && request.resource.data.nome.size() > 0
          && request.resource.data.nome.size() <= 60;
      allow update: if proprietario(uid)
          && request.resource.data.diff(resource.data)
              .affectedKeys().hasOnly([
            'nome','ruoli','livello','citta','paeseCodice',
            'bio','fotoUrl','videoUrl','emailVerificata'])
          && request.resource.data.nome.size() <= 60;
      allow delete: if proprietario(uid);
    }

    // PREFERITI: privati come i profili
    match /preferiti/{uid}/{doc=**} {
      allow read, write: if proprietario(uid);
    }

    // CONTATORE BETA: pubblico in lettura, scritto solo da te
    // (da console o, in Fase 3, da Cloud Function)
    match /config/beta {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

Cosa impediscono, in pratica:

| Attacco | Bloccato da |
|---|---|
| Leggere le email degli altri utenti | `users`: solo il proprio doc |
| Registrare 100 account falsi per la beta | scrittura solo con `email_verified` |
| Farsi premium da soli (`premium: true`) | `premium` non è nella lista scrivibile |
| Cancellare gli eventi | `eventi`: scrittura vietata |

---

## 4. Contatore beta (2 minuti)

In Firestore → **Avvia collection** → ID `config` → documento ID `beta`:

| Campo | Tipo | Valore |
|---|---|---|
| `verificati` | number | `0` |
| `maxPosti` | number | `100` |

L'app lo mostra in automatico ("37 posti rimasti su 100").
Aggiorna `verificati` a mano da console una volta a settimana, oppure
conta gli utenti con `emailVerificata == true` (tabella users → filtra).

> Fase 3: una Cloud Function aggiornerà il contatore da sola a ogni
> verifica email. Per ora il conteggio manuale basta.

---

## 5. Seed: eventi e scuole su Firestore (10 minuti)

I dati vivono già in `js/data.js`. Per copiarli su Firestore:

1. Apri l'app deployata (o localhost), F12 → tab **Console**.
2. Incolla questo snippet (funziona solo se sei loggato con un
   account qualsiasi — serve giusto per l'autenticazione SDK):

```js
(async () => {
  const db = firebase.firestore();
  for (const ev of CL_EVENTI) {
    await db.collection('eventi').doc(ev.id).set({ ...ev });
  }
  for (const s of CL_SCUOLE) {
    await db.collection('scuole').doc(s.id).set({ ...s });
  }
  console.log('Seed completato:', CL_EVENTI.length, 'eventi,', CL_SCUOLE.length, 'scuole.');
})();
```

3. Ricarica: l'app ora legge da Firestore (lo Store usa i locali solo
   se le collection sono vuote o offline).

Quando aggiungi un evento: aggiungilo in `js/data.js` (resta il
ripiego offline) **e** crea il documento in Firestore con lo stesso `id`.
**Non cambiare mai un `id` esistente**: i preferiti salvati dagli
utenti puntano a quell'id.

---

## 6. Test di accettazione (15 minuti, prima del lancio)

- [ ] `python3 -m http.server` → sito, eventi, app si aprono senza errori in console
- [ ] Filtri eventi + calendario + modale dettaglio funzionano
- [ ] Registrazione → arriva l'email di verifica (controlla lo spam)
- [ ] Senza verifica: profilo visibile, banner "verifica email" presente
- [ ] Dopo verifica ("Ho verificato, aggiorna"): spunta verde
- [ ] Salva un preferito → ricarica → è ancora lì
- [ ] Modalità ospite: eventi visibili, cuore → "Accedi per salvare"
- [ ] Compila il profilo multi-ruolo (es. ballerino + insegnante) → salva → ricarica
- [ ] Link foto/video non validi → errore leggibile, non crash
- [ ] Elimina account → chiede 2 conferme → i dati spariscono da Firestore
- [ ] Chrome → F12 → Application → Manifest/Service Workers: nessun errore
- [ ] Lighthouse (F12 → Lighthouse → solo PWA): installabile ✓

---

## 7. Deploy Netlify (10 minuti, gratis)

1. Comprimi la cartella in ZIP **oppure** (meglio) inizializza git e
   pusha su GitHub:

```sh
cd /Users/romanobenazzi/Downloads/_web_countrylife
git init && git add -A && git commit -m "CountryLife Fase 0+1"
```

2. Su https://app.netlify.com → **Add new site** → trascina lo ZIP
   (o collega il repo GitHub).
3. Il file `netlify.toml` è già pronto: pubblica la root, imposta gli
   header anti-cache per `sw.js` e gli script.
4. Verifica: `https://TUO-SITO.netlify.app/app/` → installabile.
5. Dominio vero (consigliato prima del lancio): Netlify → Domain
   settings → circa 10–15 €/anno per un `.it`/`.eu`.

---

## 8. GDPR: checklist minima prima dei primi iscritti

- [ ] Pagina **Privacy Policy** reale (il footer punta a `#`:
      usa un generatore come iubenda, ~30 €/anno, o scrivila con un
      professionista — con profili e dati personali non improvvisare)
- [ ] Nelle regole Firestore i dati personali non sono mai leggibili
      in elenco (già così: verifica punto 3)
- [ ] Cancellazione account funzionante dall'app (già così: profilo →
      Modifica → Elimina account e dati)
- [ ] Email di verifica attiva (punto 2.5): è anche la prova del
      consenso al trattamento
- [ ] Regione Firestore `eur3` (punto 2.6)

---

## 9. Cosa NON fare ancora (Fase 2/3)

- Feed, post, commenti, connessioni → Fase 2, quando la rete ha massa
- Stripe / paywall premium → Fase 3, dopo i 100 (il gating va fatto
  nelle Rules con `get(...).data.premium`, mai in JS)
- Notifiche push remote → servono Cloud Functions (Fase 2)
- Foto/video caricati direttamente → richiedono piano Blaze (carta);
  resta sui link esterni finché non serve davvero
