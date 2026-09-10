# Clone EHR Appointments + Charting V2 into hackthon prototype

## Context

This is a prototype clone in this repo (Next.js 16 / React 19 / Tailwind v4 / pnpm) that visually and structurally mirrors two pages from an EHR app: the **Appointments list** and **Charting V2**. This is explicitly a UI prototype, not a functional port — no auth, no real API integration anywhere. All data is hardcoded/dummy, matching the *shape* of the real API responses so a later phase (outside this plan's scope) can wire in real data with minimal restructuring. Work proceeds in small, independently verifiable phases, executed one at a time.

Key scope decisions:
- **No drawer** on the appointments table — clicking a row navigates via Next.js routing straight to a fixed `/charting` route with **no appointment id in the URL**.
- Charting V2 clone only needs **Overview** (dummy face-sheet cards, **no weight/BP chart**) plus the **four SOAP sections** (Subjective/Objective/Assessment/Plan). Every other tab (Visits, Schedules, Lab, Order Hx, Documents, Flow Sheet, Specialty, Pre-visit Summary, Ask AI) is dropped.
- **Start Charting** opens a dialog with 5 hardcoded-option fields (Provider, Encounter Sheet, Canned Sheet, Location, DOS). Selections live in React state only — never persisted — but the **Encounter Sheet** choice must actually determine which dummy SOAP component-tree JSON renders.
- The **Preview Note** narrative logic (age/gender/pronoun token substitution + UOM substitution) must be faithfully reproduced as pure, portable TypeScript.
- The app needs a real app **shell** (collapsible left sidebar with nav items + active-state teal tint, mobile top bar, mobile bottom tab bar) wrapping both pages. No persistent global top navbar (source has none at shell level) — only a collapsible sidebar plus each page's own local header.
- Icon library: **lucide-react**.

Standing risk: this Next.js version (16.3.4) may treat dynamic route params / `searchParams` as `Promise`-based. Confirm against `node_modules/next/dist/docs/01-app/` before writing any page that reads params.

---

## Phase 0 — Write PLAN.md into the project ✅

Done — this file.

---

## Phase 1 — Tooling setup: shadcn/ui, Tailwind theme, utilities ✅

**Goal:** Get the blank scaffold ready for shadcn components styled to match a slate/teal palette.

**Packages:**
```
pnpm add class-variance-authority clsx tailwind-merge lucide-react date-fns
```

**shadcn init:**
```
pnpm dlx shadcn@latest init
```
Base color: Slate. CSS variables: yes. Path alias: keep existing `@/*`. Components dir `@/components`, utils `@/lib/utils`.

**shadcn add:**
```
pnpm dlx shadcn@latest add button input textarea checkbox radio-group select \
  tabs dropdown-menu popover command avatar calendar dialog sheet badge \
  table separator label skeleton tooltip accordion card
```

**Custom additions (author manually):**
- `components/ui/status-badge.tsx` — pill/dot badge, variants `default | success | warning | error | info | neutral`.
- `lib/date.ts` — `formatDate`/`formatTime` helpers via `date-fns`.
- Teal brand tokens in `app/globals.css` under `@theme inline` for sidebar active-state styling.

**Verify:** `pnpm dev`, visit `/`, confirm no build errors. `pnpm exec tsc --noEmit` passes.

---

## Phase 2 — App shell: sidebar, mobile top bar, bottom nav ✅

**Goal:** Collapsible left sidebar (desktop) / top bar + bottom tab bar (mobile) wrapping `/appointments` and `/charting`. No global top navbar.

**Files:**
- `app/(main)/layout.tsx`, `components/providers/sidebar-provider.tsx`, `components/ShellBody.tsx`
- `components/Sidebar.tsx`, `components/sidebar/SidebarLogo.tsx`, `SidebarNav.tsx`, `SidebarFooter.tsx`, `sidebar-data.ts`
- `components/MobileTopBar.tsx`, `components/BottomNav.tsx`, `components/Header.tsx`

Nav items: Dashboard (`/`), Appointments (`/appointments`), Patients (stub), Encounter Sheets (stub), Review Center (stub), Referral List (stub). Only Appointments and Charting need to actually work.

**Verify:** Sidebar renders with 6 items, collapse toggle works, active teal tint on current route, narrow viewport swaps to top bar + bottom tab bar.

---

## Phase 3 — Appointments list page (dummy data, static table) ✅

**Goal:** `/appointments` table matching source styling (sticky first two columns, zebra rows, status pills, toolbar, pagination) from static dummy data. Row click → `/charting`, no id in URL.

**Files:**
- `app/(main)/appointments/page.tsx`
- `features/appointments/types.ts`, `data/mock-appointments.ts` (~15–25 rows), `constants.ts`
- `components/AppointmentsTable.tsx`, `AppointmentsTableHeaderRow.tsx`, `AppointmentTableRow.tsx`, `Toolbar.tsx`, `Pagination.tsx`

**Verify:** Mock rows render with sticky columns, zebra striping, status pills; row click navigates to `/charting` with no id/query string. Pagination works.

---

## Phase 4 — Charting V2 shell: layout, nav rail, header, Overview (dummy) ✅

**Goal:** `/charting` renders header + left nav + Overview (vitals, allergies, medications, problems — **no weight/BP chart**) + "Start Charting" button.

**Files:**
- `app/(main)/charting/page.tsx`
- `features/charting/types.ts` (VisitSheetItem/Component/SoapGroup/Response)
- `components/ChartingV2View.tsx`, `ChartingV2Header.tsx`, `ChartingV2Nav.tsx`
- `data/mock-face-sheet.ts`
- `components/overview/ChartingV2FaceSheet.tsx`, `PatientVitalsCard.tsx`, `AllergiesCard.tsx`, `MedicationsCard.tsx`, `ProblemsCard.tsx`

**Verify:** Header + nav + Overview cards render with dummy data; SOAP nav items disabled until charting starts.

---

## Phase 5 — Start Charting dialog + encounter-sheet-driven SOAP dummy data ✅

**Goal:** Dialog with 5 hardcoded-option fields; submit stores selections in state and loads SOAP dataset matching chosen Encounter Sheet.

**Files:**
- `features/charting/components/StartChartingDialog.tsx`
- `data/dropdown-options.ts` (Provider/Encounter Sheet/Canned Sheet/Location options)
- `data/encounter-sheets/{annual-physical,follow-up-visit,new-patient-intake}.ts` + `index.ts` map

Each encounter sheet dataset must include: `itmTemplate` token syntax, UOM-dictionary `itmCode`s (HEIGHT/WEIGHT/BP), a null-template item (fallback path), and a patient-token item (`#@age#@`/`#@Gender#@`/`#@He_She#@`).

**Verify:** Canned Sheet options change with Encounter Sheet selection; submit enables SOAP nav and loads correct dataset per selection.

---

## Phase 6 — SOAP rendering (accordion cards) + Preview Note logic ✅

**Goal:** 4 SOAP tabs as nested accordion cards; Preview Note view reproducing token/UOM substitution.

**Files:**
- `features/charting/lib/note-utils.ts` — `UOM_DICTIONARY`, `resolveUom`, `renderItemTemplate`, `buildPatientNoteFacts`, `applyPatientNoteTokens`, `buildItemHtml`, `collectChildValues`
- `data/mock-patient-facts.ts`
- `components/soap/ChartingV2SoapSection.tsx`, `SoapSectionCard.tsx`, `ItemCard.tsx`
- `components/preview/NotePreviewContent.tsx`

**Verify:** Accordion cards + nested children render per SOAP tab. Preview Note resolves UOM tokens, substitutes age/gender/pronoun with capitalization, falls back correctly on null template, and reflects the chosen Encounter Sheet dataset.

---

## Phase 7 — Chart Details sidebar + polish ✅

**Goal:** Right-side Chart Details panel (desktop fixed column / mobile Sheet), static non-functional sections, final polish pass.

**Files:**
- `data/chart-details.ts` (Prescriptions, Lab Orders, Referrals, Documents, Images, Anatomy Images)
- `components/ChartDetailsSidebar.tsx`

**Verify:** Full click-through `/appointments` → row → `/charting` → Start Charting → SOAP tabs → Preview Note → Chart Details sidebar/sheet. No console errors; `pnpm exec tsc --noEmit` passes.

---

## Critical files

- `components/providers/sidebar-provider.tsx` — shell collapse state
- `features/appointments/components/AppointmentTableRow.tsx` — row-click nav contract
- `features/charting/components/ChartingV2View.tsx` — central state owner
- `features/charting/lib/note-utils.ts` — UOM/token substitution logic
- `features/charting/data/encounter-sheets/index.ts` — encounter-sheet → SOAP dataset mapping

---

## Phase 8 — UI fidelity pass: SOAP card restyle, Add Options drawer, Preview Note modal ✅

**Goal:** Match the real EHR's charting UI pixel-for-pixel where it matters: SOAP card visuals (icon badges, Add Options button, chevron, left-rail nesting), a working "Add Options" drawer per component (item catalog with unique `itmCode`s and dependent/nested items), and Preview Note as a modal instead of an inline view-swap.

**What changed:**
- `app/globals.css` — `--primary`/`--primary-foreground` now teal (`#00b0ca`/white) to match the EHR brand color across every shadcn primitive; added `--color-icon-badge` (`#F0FDFA`).
- `features/charting/components/soap/SoapSectionCard.tsx` + `ItemCard.tsx` — restyled to match source measurements exactly (rounded-xl card, icon badge, Add Options button, rotating chevron, `pl-3 border-l-2` nested indentation).
- `features/charting/types.ts` — added `ItemCatalogEntry`/`CatalogFieldType`.
- `features/charting/data/item-catalog.ts` (new) — per-component addable-item catalogs keyed by `compntCode`, covering all 4 field types (checkbox+values, text, number, richtext) and dependent items with their own unique `itmCode`s.
- `features/charting/components/soap/AddOptionsDrawer.tsx` (new) — right-floating Sheet, item catalog list with search, checkbox rows showing each item's `itmCode`, dependent items indented and revealed when their parent is checked, Cancel/Add footer.
- `features/charting/components/preview/PreviewNoteDialog.tsx` (new) — Preview Note is now a `Dialog` modal (`sm:max-w-4xl h-[90vh]`) with a teal icon badge header and Close/Print footer; SOAP accordion no longer gets replaced by the preview.
- `features/charting/components/ChartingV2View.tsx` — `soapGroups` lifted to mutable state (deep-cloned per chart session), wired to the Add Options drawer so added items render immediately.

**Verify:** `pnpm exec tsc --noEmit` and `pnpm lint` clean. All 11 `compntCode`s used across the three encounter-sheet datasets have matching catalog entries in `item-catalog.ts` (verified via grep diff). Manual click-through: Start Charting → open a SOAP tab → confirm restyled cards → "Add Options" opens the drawer with item codes visible and dependent items revealing on check → Add merges items into the card → "Preview Note" opens as a modal, not an inline swap.

---

## Phase 9 — Data-fidelity correction: match real EHR response shapes ✅

**Goal:** Correct the Add Options catalog data model to match the real EHR's `ComponentItemWrapper`/`ComponentItem`/`ComponentItemValue` shape (verified against actual EHR TypeScript source) instead of an invented shape, while keeping item codes as simple readable mnemonics (`HEIGHT`, `WEIGHT`, `BP_SYSTOLIC`, etc. — not literal LOINC codes, per explicit steer).

**What changed:**
- `features/charting/types.ts` — added missing FK/UK fields to `VisitSheetItem`/`VisitSheetComponent`; replaced the invented `ItemCatalogEntry` with real-shaped `ComponentItemWrapper`/`ComponentItem`/`ComponentItemValue` (`attribute1` = narrative template, `attribute11` = raw field-type string, `emrCompntItmValues` = value list, `dependentItems` kept as an explicit prototype-only augmentation).
- `features/charting/lib/item-type-utils.ts` (new) — ported the real `getItemFieldType()`/`isExParaOrRichText()`/`isOptionListField()` derivation logic (attribute11 → alias matching → itmCode fallback → `attribute1`-based EX-PARAGRAPH heuristic → default TEXT-AREA).
- `features/charting/data/item-catalog.ts` — rebuilt on the real wrapper shape; Blood Pressure split into separate Systolic/Diastolic entries (diastolic's template omits `#@UOM#@`, matching real EHR behavior) with simple mnemonic `itmCode`s.
- `features/charting/components/soap/AddOptionsDrawer.tsx` — now derives each row's widget from `getItemFieldType()`, pre-checks already-charted items on open (matched by `itmCode`), and copies the real `attribute1` template onto newly added items. Refactored into an outer `Sheet` wrapper + a `key`-remounted inner body component with lazy `useState` initializers, avoiding a `setState`-in-`useEffect` lint violation.
- `features/charting/lib/note-utils.ts` — `UOM_DICTIONARY` keys updated to match the (simple) codes now used.
- `features/charting/data/encounter-sheets/*.ts` — VITALS components updated to split Blood Pressure into two items with matching codes.

**Verify:** `pnpm exec tsc --noEmit` and `pnpm lint` both clean, dev server renders `/charting` without errors.
