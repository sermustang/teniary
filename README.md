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
| `src/pages/` | List, form, note view, settings |

### Changing the note format later

Existing notes on the phone must keep working after an update:

- New fields: add them to `Note`, `emptyDraft()` and `normalizeNote()` with a
  default. Old notes get the default automatically.
- Renamed or restructured fields: convert them in `normalizeNote()`, and bump
  `SCHEMA_VERSION` in `backup.ts` if old app versions can't read the new files.
- Never change the GitHub username or repo name after your friend installs the
  app: the stored notes belong to that exact web address.

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

1. Abre el enlace de Teniary en **Safari**.
2. Toca el botón **Compartir** (el cuadrado con la flecha hacia arriba).
3. Elige **Añadir a pantalla de inicio** y toca **Añadir**.
4. A partir de ahora, abre Teniary **siempre desde el icono** de la pantalla de
   inicio, no desde Safari. Así tus notas quedan guardadas en el iPhone.

Teniary funciona sin conexión. Tus notas nunca salen del iPhone.

**Copia de seguridad:** de vez en cuando entra en Ajustes → **Exportar notas**
y elige **Guardar en Archivos** (por ejemplo, en iCloud Drive). Si cambias de
iPhone o borras el icono, podrás recuperarlas con **Importar copia**.

**Importante:** si borras el icono de Teniary de la pantalla de inicio, se
borran también las notas guardadas en él. Exporta una copia antes.
