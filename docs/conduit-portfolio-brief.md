# Conduit homepage refresh

Proposed direction: a founder's engineering portfolio, with Conduit as the umbrella and Praxis as one of the products. Audience: a prospective development client, technical collaborator or employer following an email conversation. Primary outcome: understand the work, inspect public code, and contact Luis.

Visual idea: a working project index. Large editorial typography, ink and warm paper, the existing cyan Conduit mark, ruled project rows and a technical capability rail. Reuse the installed Geist and Fraunces fonts. No stock photography or invented product screenshots. Original CSS and native HTML; no new dependencies.

Content hierarchy: founder introduction → selected work → engineering capabilities → contact. Public repositories demonstrate implementation; development status is not a claim of customer adoption, revenue, certification or production availability. Keep existing product, pricing and sign-in routes intact.

Source evidence: code in conduit-nextjs, conduit-mobile and conduit-hq-3d; Lunaro's jonathan-demo repository reviewed in the parent conversation. Do not publish private repository links, customer records, invented metrics or testimonials. Company mark sourced from wpbluiss/conduit-portal/public/icon.svg.

Acceptance: semantic server-rendered homepage; working contact and public source links; existing sign-in path retained; no horizontal overflow at 375/768/1440; visible keyboard focus; content available without animation; relevant lint and production build checked. Browser screenshots must be visually inspected. Record any environment failures honestly.

Work-history synchronization: not performed. Automatic approval review rejected creating temporary API credentials; no alternate credential path was attempted.

## Verification checkpoint

- Production compilation, TypeScript and generation of 107 static routes passed. Local build temporarily disabled Sentry telemetry, source maps and its build integration; next.config.ts restored afterward.
- ESLint passed for the homepage and social preview. git diff --check passed.
- Local production server reached HTTP 200 using explicitly synthetic Supabase public configuration; no customer account or production data was used.
- Automated local Chromium could not launch: sandbox disallowed its process-singleton socket. No OS restrictions were changed. Responsive and visual acceptance remains pending until a supported preview is inspected.
- Code review found mobile navigation hidden at narrow widths. Corrected it to retain selected-work, about and product-sign-in links on mobile. Browser retest pending.
- Existing application, billing, authentication and product routes are unchanged. Other legacy marketing pages are outside this homepage refresh and may still need a separate truthfulness review.
