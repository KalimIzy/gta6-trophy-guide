// Leonida Platinum Guide: the entry program for gta6-trophy-guide-01.
//
// The guide itself is plain static files in app/ (index.html, style.css, app.js,
// views.js and data/trophies.json), made to open in a desktop browser with the
// network off. This program hands the guide in: it copies app/ and screenshots/
// from beside this file into the output directory and writes dossier.json there,
// the summary the judge reads, built with the vendored make.fun library.
//
// Node 22, standard library only. Outside the grader, MAKEFUN_OUTPUT_DIR stands
// in for /output, so a local run looks like:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps match the competition gate: at most 4 screenshots of at most 256 KiB,
// app/ at most 993 files and directories and 48 MiB, and the dossier text at most
// 160 KiB. Anything past those limits is refused here, as the scorer would refuse it.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
