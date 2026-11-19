# Leonida Platinum Guide: GTA 6 Trophies

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy is shown with its official name, description and grade, plus a guide in our own words, a kind, a PSN progress target where PSNProfiles lists one, and a missable flag with its reason. The app also gives an 8-stage roadmap to the platinum, a missables page, a checklist that saves in the browser, filters, a spoiler setting, and progress export and import.

## How to open it

Serve the app folder, then open it in a desktop browser:

```sh
node serve.ts
```

Then open http://localhost:8080

Or open `app/index.html` directly from the files. It works with the network off: it loads nothing from outside its own folder.

## Features

- Checklist of all 55 trophies, with earned ticking saved in localStorage, plus earned count, points, and per-grade counts
- Filters by kind and grade, text search, and show earned, remaining, or all
- Spoiler setting (on by default) that hides story trophies until they are earned
- A guide pane for every trophy with its full guide and its Sources line
- Roadmap page: 8 ordered stages to the platinum, with per-stage trophy lists and progress
- Missables page: every trophy flagged possibly missable, with its note and the warning that no flag is confirmed in the game yet
- Export progress as JSON, import it back, reset, and a note box per trophy
- Keyboard shortcuts: `/` to search, `1` checklist, `2` roadmap, `3` missables, `Esc` to close the guide pane

## Sources

Official trophy names, descriptions and grades come from the Exophase trophy list for Grand Theft Auto VI on PS5. PSN progress targets come from the PSNProfiles trophy list for the same game. Every guide is written in our own words from the official description. Where a place or step is not pinned down by a source we checked, the guide says so plainly instead of inventing it. Nothing here is official Rockstar artwork, and there is no Rockstar logo.

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT, see LICENSE.
