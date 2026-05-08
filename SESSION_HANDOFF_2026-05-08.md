# Session Handoff — Round Brand-5 (Visual Overhaul v2)

## Where we are
- Branch `feat/conduit-visual-overhaul-2026-05-08` is clean, 9
  per-phase commits ahead of `main`. `npm run build` is green.
- The Praxis Console (`/app/*`) is untouched; only marketing
  surfaces were rebuilt.
- Quality bar: "would Geist Studio (Anthropic) or Rauno Freiberg
  (Linear) ship this." Each section can be traced back to a
  benchmark in `docs/conduit-visual-references.md`.

## Marketing surfaces in this round
- `/` — homepage, 8 sections.
- `/about` — company position. No founder bio anywhere.
- `/approach` — new long-form thesis (Linear /method energy).
- `/customers` — hub.
- `/customers/lunaro` — case study.
- `/pricing` — dedicated page (was hash anchor only).
- `/products` — hub.
- `/products/praxis-console`, `/praxis-mobile`, `/praxis-hq` — all
  three rebuilt.

## Per-phase commits
- `8e4df3f` feat(design): visual references study
- `1513f21` feat(design): conduit token system v2 + dark mode
- `417b72f` feat(shell): nav + footer rebuild
- `bd67cd6` feat(home): homepage rebuild — hero + sections 1-8
- `cb03cf6` feat(products): all 4 product pages rebuild
- `0444578` feat(about): /about company-energy rewrite
- `1d6fdf5` feat(approach): /approach page (Linear /method energy)
- `a9f016f` feat(customers): /customers + /customers/lunaro
- `d037367` feat(pricing): dedicated /pricing page
- (Phase 9 polish + this handoff coming on the next commit.)

## Token system
- TS source of truth: `src/lib/design-system/conduit-tokens.ts`.
- CSS counterparts in `src/app/globals.css` (additive — every
  `/app/*` Console token preserved unchanged).
- Scales: ink, cream, edge, ember (the signature warm-amber
  accent), semantic. Type pairing Fraunces × Inter × JetBrains
  Mono.
- Easing: `cubic-bezier(0.25, 1, 0.5, 1)` for everything. No bounce.
- Phosphor (1.5 stroke) installed; Lucide is no longer imported on
  any marketing surface.

## Pending external work for Luis
1. **Push the branch.** `git push -u origin
   feat/conduit-visual-overhaul-2026-05-08` triggers a Vercel
   preview deploy. Verify the new design on conduitai.io's preview
   URL on iPhone (375/390) + desktop.
2. **Lunaro quote.** `/customers/lunaro` ships with a placeholder
   ("Quote pending Jonathan review"). Replace with a real one when
   Jonathan signs off.
3. **HQ cinematic video.** `/public/videos/praxis-hq-preview.mp4`
   doesn't exist; both the homepage cinematic section and the
   `/products/praxis-hq` hero render static fallbacks (Buildings
   duotone + ember pulse). The `<video>` block is commented in
   the source — uncomment and drop the file in to swap.
4. **Newsletter backend.** The footer's newsletter form is
   presentation-only (success state on submit, no API call). If
   you want it to capture, point it at a Supabase table or an
   ESP webhook.
5. **Press inbox.** `press@conduitai.io` is referenced on /about
   contact; create the alias when you want press to land somewhere
   real.

## Locked principles (unchanged)
- Brevity over preamble.
- Console users never see "Claude," "Anthropic," "Vercel."
- Multi-tenant: every query scoped by account_id.
- Internal_account = Luis bypasses tier gates.
- Memory: Atlas is the only writer; everyone else reads.
- /app/* tokens stay where they are. Marketing tokens are additive.

## Next-round queue
- R14: Mobile app (Expo) — still queued from earlier.
- R15.5: Engineering hardening — iptables egress allowlist, abort
  path, live token streaming.
- R15.6: Public Engineering for Pro tier with the spend cap from
  R15.5.
- Brand-6 (optional): real Lunaro quote, HQ cinematic video, press
  inbox routing.

## What I would verify before merging Brand-5 to main
1. Open the preview URL on iPhone (375 + 390). Hero typography,
   nav drawer, product cards stacking, code preview horizontal
   scroll all read clean.
2. Tab through the homepage from address bar — first focus lands
   on "Skip to content," visible.
3. Check the homepage's six employee dots in the Console preview
   look right (Atlas active, others muted).
4. Anchor links from the nav (e.g. `/#pricing` if it shows up
   anywhere) jump cleanly with the 96px scroll-padding-top
   accounting for the sticky nav.
5. `/about` reads as a company. Read it cold and see if a stranger
   would guess this is a 100-person company or a solo build —
   they should not be able to tell.
