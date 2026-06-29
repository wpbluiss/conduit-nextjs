# Multi-Tenancy Roadmap — Cadence

Cadence already supports multiple households at the data layer (households,
members, join codes, RLS scoping all exist). What's not yet generic is the
**presentation and persona layer**, which still assumes the seed household
(Luis & Delia, a daughter's custodial bucket, a $75K property goal). To become a
real product with open sign-ups, those assumptions need to be data-driven.

## Done in this PR (first slice)

- **Dynamic greeting** — the home page greeted "Hey, Luis & Delia" literally; it
  now reads the household's actual members from `fin_people`
  (`src/app/finance/(app)/page.tsx`).
- **Activity feed names** — `recentActivity()` resolved person tags via a
  hardcoded Luis/Delia map; it now looks names up from the household's people and
  title-cases anything else (`src/lib/finance/compute.ts`).
- **`personLabel()`** — unknown person tags were mislabeled "Shared"; they're now
  title-cased, so a custom member tag renders correctly
  (`src/lib/finance/constants.ts`).

These are safe because person tags are already the lowercased member name (see
`payFrequencyMap`), so resolving against `fin_people` is correct for any household.

## Remaining work (staged, not yet done)

### 1. Person tags become real members
`PERSON_TAGS = ["shared", "luis", "delia"]` and `INVESTMENT_BUCKETS = ["luis",
"delia", "daughter"]` in `constants.ts` are hardcoded. Owner/person selects in
the forms (`addAccount`, `addPaycheck`, `addExpense`, investments) should be
populated from `fin_people` for the current household, with "Shared" as the
constant option. `updatePayFrequency` in `actions.ts` (hardcoded `luis_freq` /
`delia_freq`) should iterate over `fin_people` instead.

### 2. Generalize the AI advisor persona
`src/app/api/finance/advisor/route.ts` `SYSTEM_BASE` is written entirely around
Luis & Delia, a $750K fourplex, and a child-support obligation. Move the
household specifics into the dynamic context block (member names, goal, any
obligations) and make the base prompt generic ("You are the private wealth team
for {members}…"). The context builder already has `snap.people` and the goal.

### 3. Onboarding captures members
`createHousehold` sets a name + goal but no people. Onboarding should let a user
add household members (names → tags) and their pay cadence, so a new household
starts fully populated instead of inheriting seed assumptions.

### 4. De-hardcode the goal/property framing
The "$75K down payment / fourplex" language is baked into copy
(`fourplex` page, advisor prompt, allocation labels in `compute.ts`
`planAllocation`). Drive these from `fin_household.savings_goal` + a configurable
goal label/type.

### 5. Daughter / custodial bucket
The third investment bucket is hardcoded. Generalize to N buckets per household.

## Suggested order
1 (forms + pay frequency) → 3 (onboarding) → 2 (advisor) → 4 (goal copy) → 5.
Each is independently shippable and testable.
