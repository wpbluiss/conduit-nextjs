# Slice 0 — Validation Punch-List (2026-05-23)

Slice 0 deployed + walked on /app/pdl-scratch. Validated with notes below.

## VALIDATED — do not touch
- HoverReveal: Connect button on hover. Liked. P2 working.
- Canvas + Node + Edge (memory preview): glowing node, dashed edges, colors,
  hover. Liked. This is the proof-point — node-graph aesthetic translates to
  Praxis. Slice 1 builds on this.

## FIX (real bugs)
- Tooltip + Popover: nothing happens on click; hover state blended/invisible.
  Likely z-index/portal or contrast. Broken.
- Modal: low contrast / muddy against scrim. Tune glass recipe.

## ASSET SWAP (not design work)
- 10 brand marks are placeholders (letter-in-shape). Swap to official SVGs from
  each brand's press kit. Zero code change — one file each. GitHub octocat,
  real Gmail, real Drive, etc.

## DESIGN EXPLORATION (own focused session — needs references)
- Employee avatars: thin Lucide outline icons feel generic. These are the FACE
  of Praxis (9 employees, appear everywhere). Needs a real identity exploration
  with references + judged options. NOT a "make it better" prompt. Highest-value
  visual decision in the app.

## Sequencing held from before
- Slice 1 = Memory canvas (real /app/memory built on the validated preview)
- Then: avatar identity, brand-SVG swap, tooltip/modal fixes
- Still parked: MCP connector system (re-architected Slice 2), worker token-stream
  PR → code-stream panel
