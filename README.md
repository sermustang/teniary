# Teniary

Offline iPhone web app for post-match tennis notes: the digital version of the
paper "Formulario de rendimiento del partido". The interface is in Spanish.

- Notes are stored only on the device, in IndexedDB. Nothing is sent anywhere.
- Installed from Safari with "Añadir a pantalla de inicio"; after the first
  visit it works without internet (service worker).
- Backup: Ajustes → Exportar (JSON file via the iOS share sheet) / Importar.

## Development

Requires Node 20.19+.

```sh
npm install
npm run dev        # dev server at http://localhost:5173/teniary/
npm test           # unit tests (Vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173/teniary/
```

To try the UI on an iPhone on the same Wi-Fi: `npm run dev -- --host` and open
the "Network" address. Offline mode needs HTTPS, so test it on the deployed site.

### Icons

The app icon comes from `public/icon-source.png`. After replacing it, run
`npm run icons` to regenerate the favicon, the Home Screen icon (flattened on
lime `#BEFF00`) and the manifest icons.

### Project layout

| Path | What it is |
|---|---|
| `src/model/note.ts` | Note type, Spanish labels, `normalizeNote()` (defaults and migration) |
| `src/model/clean.ts` | Drops empty list rows before saving |
| `src/model/filter.ts` | Search, filters, sorting, month grouping, suggestions |
| `src/model/format.ts` | Spanish date formatting |
| `src/db/db.ts` | IndexedDB storage (`teniary` database) |
| `src/backup/backup.ts` | Export/import file format and merge |
| `src/state.tsx` | App state shared by all screens |
| `src/theme.ts` | Light/dark theme: system setting or the user's choice (stored in `localStorage`) |
| `src/pages/` | List, form, note view, settings |

### Changing the note format later

Existing notes on the phone must keep working after an update:

- New fields: add them to `Note`, `emptyDraft()` and `normalizeNote()` with a
  default. Old notes get the default automatically.
- Renamed or restructured fields: convert them in `normalizeNote()`, and bump
  `SCHEMA_VERSION` in `backup.ts` if old app versions can't read the new files.
- Never rename the IndexedDB database (`teniary`), the `notes` store or its
  `keyPath`: the app would open an empty database and the old notes would be
  unreachable.

## When notes can be lost on the iPhone

Notes exist only in the storage iOS gives the Home Screen app for this exact web
address. Nothing is synced anywhere, so the exported file (Ajustes → Exportar
notas) is the only backup.

| Case | What happens |
|---|---|
| The Teniary icon is deleted from the Home Screen | iOS deletes the app's storage along with the icon. Adding the icon again gives an empty app. |
| The iPhone is erased, restored or replaced | Don't count on iCloud Backup or a transfer to a new iPhone carrying the notes over: Apple doesn't document it for Home Screen web apps. Import the exported file instead. |
| Notes were written outside the Home Screen app | A Safari tab, a private tab, another browser and the browser built into apps like WhatsApp each have their own separate storage. Notes saved there don't appear in the Home Screen app. Private tabs lose them when closed, and Safari may delete a site's storage after 7 days of Safari use without visiting it. The Home Screen app counts only its own days of use, so this rule doesn't affect it in practice. |
| The iPhone runs out of space | iOS may delete website storage to free space unless the app was granted persistent storage. Ajustes shows this as "Almacenamiento persistente": "Activado" is protected, "No confirmado" isn't. iOS decides by its own rules; being on the Home Screen helps. |
| Safari's website data is cleared | Settings → Safari (iOS 18 and later: Settings → Apps → Safari) → Clear History and Website Data. Apple doesn't say whether this also clears Home Screen web apps, so assume it might. |
| The app's address changes | The notes belong to `https://sermustang.github.io/teniary/`. Renaming the repo or the GitHub account, or moving to a custom domain, opens an empty app at the new address. The old icon keeps its notes until it is deleted, so export there and import at the new address. |
| An update breaks the stored data | Renaming the database or store (see above), or a bug in `normalizeNote()` that rejects old notes. Unit tests cover the current format; test old notes before releasing a format change. |

Things that don't delete notes:
- Tapping "Actualizar".
- Updating iOS.
- Closing the app or restarting the phone.
- Being offline.
- The GitHub site going down: the installed app keeps running from its offline cache.

Sources:
- WebKit, [Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/): quotas, eviction, `persist()`.
- WebKit, [Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/): the 7-day cap and Home Screen apps.

## Deploying to GitHub Pages

1. Create a GitHub repository (it must be public on a free account; only the
   code is published, never the notes) and push the `main` branch.
2. In the repository: Settings → Pages → Source: **GitHub Actions**.
3. Every push to `main` runs the tests, builds and publishes to
   `https://<user>.github.io/<repo>/`. `BASE_PATH` is set from the repo name.

Updates reach the phone automatically: the next time the app is opened with
internet, it downloads the new version and shows "Hay una nueva versión —
Actualizar". The notes are not affected.

---

## Instrucciones para instalar Teniary (iPhone)

1. Abre https://sermustang.github.io/teniary/ en **Safari**. Si el enlace se
   abre dentro de WhatsApp u otra app, elige **Abrir en Safari**.
2. Toca el botón **Compartir** (el cuadrado con la flecha hacia arriba).
3. Elige **Añadir a pantalla de inicio** y toca **Añadir**.
4. A partir de ahora, abre Teniary **siempre desde el icono** de la pantalla de
   inicio, no desde Safari. Así tus notas quedan guardadas en el iPhone.

Teniary funciona sin conexión. Tus notas nunca salen del iPhone.

**Copia de seguridad:** cada pocos partidos entra en Ajustes → **Exportar
notas** y elige **Guardar en Archivos** (por ejemplo, en iCloud Drive). Con
**Importar copia** las recuperas en cualquier iPhone.

### ¿Cuándo se pueden perder las notas?

Las notas solo están guardadas dentro del icono de Teniary. Se pierden, o no
aparecen, si:

- **Borras el icono** de la pantalla de inicio. Si lo vuelves a añadir, estará
  vacío.
- **Cambias de iPhone, o lo borras o restauras.** No cuentes con que la copia de
  iCloud las traiga: importa tu copia.
- **Las escribes fuera del icono:** en una pestaña de Safari, en navegación
  privada, en otro navegador o en un enlace abierto dentro de WhatsApp. Esas
  notas no aparecen en el Teniary de la pantalla de inicio y pueden borrarse
  solas.
- **El iPhone se queda sin espacio** y en los Ajustes de Teniary pone
  «Almacenamiento persistente: No confirmado». iOS puede borrar datos para
  liberar espacio.
- **Borras los datos de Safari** (Ajustes → Safari, o en iOS 18 y posteriores
  Ajustes → Apps → Safari → «Borrar historial y datos de sitios web»). Puede que
  también borre las notas de Teniary.

No se pierden al tocar «Actualizar», al actualizar iOS, al cerrar la app o
reiniciar el iPhone, ni al usarla sin conexión.
