# American Museum of Natural History — walkable 3D simulation

A first-person, in-browser walk through the AMNH in New York: five levels, 45 halls and 346 labelled
exhibits, laid out from the museum's floor plans. Everything (architecture, skeletons, taxidermy,
dioramas, textures) is generated procedurally at load time; there are no downloaded assets.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
# or
npm run build && npm run preview
```

## Controls

| | |
|---|---|
| Move | `W A S D` or arrow keys, `Shift` to run, `Space` to jump |
| Look | click the view to capture the mouse (or drag); `Esc` releases it |
| Museum map / teleport menu | `M` or `Tab` — Halls, Highlights and All exhibits tabs, search, floor plan |
| Read a label / call an elevator | look at it and press `E` |
| This hall / connections | `H` / `C` |
| Photograph | `P` |
| Fly (no collision) | `Shift+F` |

Stairs and four elevator banks connect the floors. The front doors of the Rotunda open onto the
Central Park West steps.

## Layout

- `src/world/plan.js` — rooms, doorways and elevators for every floor
- `src/world/halls/` — the contents of each hall
- `src/models/` — procedural skeletons, animals, sea life and rocks
- `src/engine/` — geometry builder, materials, physics, player, lighting, placards
- `tools/shot.mjs` — headless screenshots: `node tools/shot.mjs out name=goto:trex`
- `viewer.html` — model viewer for the libraries (dev server only)
