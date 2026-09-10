# Clone EHR Appointments + Charting V2 into hackthon prototype

## Context

We're building a prototype in `/home/logidots/hackthon` (a blank Next.js 16 / React 19 / Tailwind v4 / pnpm scaffold — no shadcn/ui, no routes beyond the default landing page, no shared layout) that visually and structurally mirrors two pages from the EHR app at `/home/logidots/Work/EHR`: the **Appointments list** and **Charting V2**. This is explicitly a UI prototype, not a functional port — no auth, no real API integration anywhere. All data is hardcoded/dummy, matching the *shape* of the real API responses so that a later phase (outside this plan's scope) can wire in real data with minimal restructuring. Work proceeds in small, independently verifiable phases, executed one at a time, starting from a from-scratch environment.

Key scope decisions (confirmed with the user):
- **No drawer** on the appointments table — clicking a row navigates via Next.js routing straight to a fixed `/charting` route with **no appointment id in the URL** (deliberate simplification vs. the source app's drawer + `[apptScheduleId]/charting-v2` route).
- Charting V2 clone only needs **Overview** (dummy face-sheet cards, **no weight/BP chart** — skip it entirely, not even a placeholder) plus the **four SOAP sections** (Subjective/Objective/Assessment/Plan). Every other source nav tab (Visits, Schedules, Lab, Order Hx, Documents, Flow Sheet, Specialty, Pre-visit Summary, Ask AI) is dropped.
- **Start Charting** opens a dialog with 5 hardcoded-option fields (Provider, Encounter Sheet, Canned Sheet, Location, DOS). Selections live in React state only — never persisted — but the **Encounter Sheet** choice must actually determine which dummy SOAP component-tree JSON renders, so it needs to be functionally wired, not just cosmetic.
- The **Preview Note** narrative logic (age/gender/pronoun token substitution + UOM substitution) must be faithfully reproduced as pure, portable TypeScript ported from the source — this is the one piece of business logic the user explicitly called out as needing to work correctly, not just look right.
- The app needs the EHR's actual **shell** (collapsible left sidebar with nav items + active-state teal tint, mobile top bar, mobile bottom tab bar) wrapping both pages — not a from-scratch generic navbar. Note: the source EHR has **no persistent global top navbar** (no search/notifications/avatar menu at shell level) — only a collapsible sidebar plus each page's own local header. The clone should match this reality rather than inventing a top navbar that doesn't exist in the source.
- Icon library: **lucide-react** (shadcn default), not the source's `@hugeicons/react` — confirmed acceptable since exact icon glyphs aren't required for a prototype.

Standing risk to re-check during implementation: this Next.js version (16.3.4) may treat dynamic route params / `searchParams` as `Promise`-based. Our `/appointments` and `/charting` routes take no dynamic params, so risk is low, but confirm against `/home/logidots/hackthon/node_modules/next/dist/docs/01-app/` before writing any page that reads params, rather than relying on older Next.js conventions from training data.

All file paths below are relative to `/home/logidots/hackthon` unless stated otherwise.

---

## Phase 0 — Write PLAN.md into the hackthon project

**Goal:** Persist this phased plan inside the target repo (not the EHR repo) so this and future sessions can execute one phase at a time without re-deriving it.

**Action:** As the literal first executable step, create `/home/logidots/hackthon/PLAN.md` containing all phases below (goal, files, verification per phase). (This file, under `.claude/plans/`, is the planning-tool copy; `PLAN.md` at the repo root is the human-facing working copy referenced during execution.)

**Verify:** `cat /home/logidots/hackthon/PLAN.md` shows all phases.

---

## Phase 1 — Tooling setup: shadcn/ui, Tailwind theme, utilities

**Goal:** Get the blank scaffold ready for shadcn components styled to match the source app's slate/teal palette.

**Packages:**
```
pnpm add class-variance-authority clsx tailwind-merge lucide-react date-fns
```
(Radix primitives are added automatically by the shadcn CLI per component — let it manage those versions.)

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
- `components/ui/status-badge.tsx` — pill/dot badge (`rounded-full px-2.5 py-0.5 text-xs font-medium border` + colored dot), variants `default | success | warning | error | info | neutral` with slate/emerald/amber/red/blue color pairs matching the source's status-badge component.
- `lib/date.ts` — small `formatDate`/`formatTime` helpers via `date-fns`.
- Add teal brand tokens to `app/globals.css` under `@theme inline` (e.g. `--color-brand-teal`, `--color-teal-tint`) for sidebar active-state styling in Phase 2.

**Verify:** `pnpm dev`, visit `/`, confirm no build errors. `pnpm exec tsc --noEmit` passes.

---

## Phase 2 — App shell: sidebar, mobile top bar, bottom nav

**Goal:** Reproduce the EHR's actual shell structure — a collapsible left sidebar (desktop) / top bar + bottom tab bar (mobile) — wrapping `/appointments` and `/charting`. No global top navbar (the source has none at shell level).

**Files to create:**
- `app/(main)/layout.tsx` — wraps children with a sidebar context provider + `ShellBody`.
- `components/providers/sidebar-provider.tsx` — React context `{ isCollapsed, setIsCollapsed }`, default collapsed = `true` (matches source).
- `components/ShellBody.tsx` — flex row: `Sidebar` (desktop) + main column (`MobileTopBar` + scrollable page content) + `BottomNav` (mobile), gated on a simple `lg:` breakpoint (source's custom pointer/hover media query is unnecessary complexity for a prototype — plain `lg:` is fine).
- `components/Sidebar.tsx` — composes `SidebarLogo` + `SidebarNav` + `SidebarFooter`; width toggles between collapsed/expanded (`w-20`/`w-64`).
- `components/sidebar/SidebarLogo.tsx` — placeholder logo/wordmark + collapse toggle button (lucide `Menu` icon).
- `components/sidebar/SidebarNav.tsx` — nav item list from `sidebar-data.ts`, active state via `usePathname()` — active item gets teal tint background + teal text/icon, inactive gets slate hover states; collapsed state shows icon-only with `Tooltip`.
- `components/sidebar/SidebarFooter.tsx` — dummy user avatar (initials) + name/email, static data.
- `components/sidebar/sidebar-data.ts` — static nav items: Dashboard (`/`), Appointments (`/appointments`), Patients (`/patients`, can 404/stub), Encounter Sheets (`/templates`, stub), Review Center (`/review-center`, stub), Referral List (`/referrals`, stub) — use lucide icons (`LayoutDashboard`, `BookUser`, `Users`, `FileText`, `ClipboardList`, `Share2`). Only Appointments and Charting need to actually work; others can be placeholder links.
- `components/MobileTopBar.tsx` — logo-only bar, `lg:hidden`.
- `components/BottomNav.tsx` — tab bar reusing `sidebar-data.ts` items, icon + label, active = teal, `lg:hidden`.
- `components/Header.tsx` — generic reusable per-page title/description/action-slot bar (not a global navbar) for use atop the appointments page.

**Verify:** `pnpm dev`, visit `/` under `(main)`, confirm sidebar renders with 6 nav items, collapse toggle works, active-state teal tint shows on the current route, and narrowing the viewport below `lg` swaps to top bar + bottom tab bar.

---

## Phase 3 — Appointments list page (dummy data, static table)

**Goal:** `/appointments` renders a table visually matching the source (sticky first two columns, zebra rows, status pills, toolbar, pagination) from static dummy data. Row click navigates to `/charting` with no id in the URL.

**Files to create:**
- `app/(main)/appointments/page.tsx` — renders `<AppointmentsTable />`.
- `features/appointments/types.ts` — `Appointment` interface: `id`, `patientFirstName`, `patientLastName`, `age`, `timeStart`, `durationMinutes`, `reason`, `status`, `type`, `checkedIn`, `examRoom`, `caseName`, `legalEntityProvider`, `renderingProvider`, `hasSuperBill`, `chartingStatus`.
- `features/appointments/data/mock-appointments.ts` — ~15–25 dummy `Appointment` rows spanning varied statuses/types.
- `features/appointments/constants.ts` — column header config mirroring source's sticky-column classes (Patient Name: `sticky left-0 bg-slate-100 z-20 min-w-[150px] max-w-[150px]`; Time & Duration: `sticky left-[150px] bg-slate-100 z-20 shadow-[1px_0_0_0_#e2e8f0]`).
- `features/appointments/components/AppointmentsTable.tsx` — client component owning search/filter/pagination state over the mock array.
- `features/appointments/components/AppointmentsTableHeaderRow.tsx` — `bg-slate-100 h-11 text-xs font-semibold text-slate-500` header cells.
- `features/appointments/components/AppointmentTableRow.tsx` — renders each column per spec (Patient Name = "Last, First" + age subline; Status/Charting via `StatusBadge` neutral variant); row styled `odd:bg-white even:bg-slate-50 hover:bg-slate-100 border-b border-slate-200 cursor-pointer`; `onClick` calls `router.push("/charting")` (row wrapped with a click handler, not `<Link>`, since `<Link>` can't wrap `<tr>`; add `role="link"` + Enter-key handler for basic a11y).
- `features/appointments/components/Toolbar.tsx` — search `Input` + status/type filter `Select`s, all client-side over the mock array. Column-toggle and date-range are nice-to-have — skip unless time permits.
- `features/appointments/components/Pagination.tsx` — First/Prev/numbered/Next/Last using shadcn `Button` (`outline` for current page, `ghost` for others).

**Verify:** `pnpm dev`, visit `/appointments`, confirm mock rows render with sticky columns, zebra striping, colored status pills, and clicking any row navigates to `/charting` with no id/query string in the URL bar. Pagination changes the visible slice.

---

## Phase 4 — Charting V2 shell: layout, nav rail, header, Overview (dummy)

**Goal:** `/charting` renders header + left nav + center pane defaulting to Overview with dummy face-sheet cards (vitals, allergies, medications, problems — **no weight/BP chart**), plus a "Start Charting" button (dialog wired in Phase 5).

**Files to create:**
- `app/(main)/charting/page.tsx` — renders `<ChartingV2View />`.
- `features/charting/types.ts` — `VisitSheetItem`, `VisitSheetComponent`, `VisitSheetSoapGroup`, `VisitSheetResponse` interfaces (fields: `itmName`, `itmCode`, `generatedText`, `itmTemplate`, `itmBeginText`, `itmEndText`, `attribute1`, and component fields `compntName`, `compntDescription`, `listOrder`, `compntCode`, `soap`, `items`, `children`).
- `features/charting/components/ChartingV2View.tsx` — owns `activeSection: "overview"|"subjective"|"objective"|"assessment"|"plan"`, `hasChart: boolean`, `chartSession` state; renders header, nav, center content switch.
- `features/charting/components/ChartingV2Header.tsx` — dummy patient name/mrn/age + "Start Charting" button (visible when `!hasChart`).
- `features/charting/components/ChartingV2Nav.tsx` — 5 items (Overview, Subjective, Objective, Assessment, Plan), lucide icons; SOAP items disabled until `hasChart`.
- `features/charting/data/mock-face-sheet.ts` — dummy vitals `{bp, hr, temp, height, weight, bmi, recordedAt}`, allergies `[{substance, reaction, severity}]`, medications `[{name, dose, frequency, prescriber}]`, problems `[{name, icdCode, status, onsetDate}]`.
- `features/charting/components/overview/ChartingV2FaceSheet.tsx` — `xl:grid-cols-3` grid composing the cards below.
- `features/charting/components/overview/PatientVitalsCard.tsx`, `AllergiesCard.tsx`, `MedicationsCard.tsx`, `ProblemsCard.tsx` — shadcn `Card`-based panels fed from mock data. (No weight/BP chart component at all.)

**Verify:** `pnpm dev`, visit `/charting`, confirm header + nav + Overview cards render with dummy data, SOAP nav items appear disabled, "Start Charting" button is visible.

---

## Phase 5 — Start Charting dialog + encounter-sheet-driven SOAP dummy data

**Goal:** "Start Charting" opens a dialog with 5 hardcoded-option fields; submitting stores selections in state and loads the SOAP dataset matching the chosen Encounter Sheet.

**Files to create:**
- `features/charting/components/StartChartingDialog.tsx` — shadcn `Dialog` (`sm:max-w-[600px]`): Provider `Select` (4 options), Encounter Sheet `Select` (3–4 options, drives dataset), Canned Sheet `Select` (options filtered by chosen Encounter Sheet), Location `Select` (3–4 options), DOS via `Calendar`+`Popover` defaulted to today. On submit, calls `onBeginCharting({providerId, encounterSheetId, cannedSheetId, locationId, dos})`.
- `features/charting/data/dropdown-options.ts` — `PROVIDER_OPTIONS`, `ENCOUNTER_SHEET_OPTIONS` (e.g. "Annual Physical", "Follow-Up Visit", "New Patient Intake"), `CANNED_SHEET_OPTIONS` (keyed by encounter sheet id), `LOCATION_OPTIONS`.
- `features/charting/data/encounter-sheets/{annual-physical,follow-up-visit,new-patient-intake}.ts` — each exports `VisitSheetSoapGroup[]` (4 SOAP groups, 1–3 components each, 1–4 items, at least one level of `children` to exercise nested rendering). Include: items with real `itmTemplate` token syntax (`"#@ItemName#@: #@GeneratedText#@ #@UOM#@"`), items using `itmCode`s present in the UOM dictionary (`HEIGHT`, `WEIGHT`, `BP`), one item with `itmTemplate: null` (fallback path), and one item with `#@age#@`/`#@Gender#@`/`#@He_She#@` tokens (patient-token path).
- `features/charting/data/encounter-sheets/index.ts` — `ENCOUNTER_SHEET_DATA: Record<string, VisitSheetSoapGroup[]>`.
- Update `ChartingV2View.tsx` — on dialog submit: set `chartSession`, `hasChart = true`, `activeSection = "subjective"`, derive `soapGroups = ENCOUNTER_SHEET_DATA[chartSession.encounterSheetId]`.

**Verify:** Fill and submit the dialog with each Encounter Sheet option in turn; confirm Canned Sheet options change with Encounter Sheet selection, dialog closes, SOAP nav enables, and (temporarily via `<pre>{JSON.stringify(soapGroups)}</pre>` if Phase 6 isn't built yet) the correct dataset loads per selection.

---

## Phase 6 — SOAP rendering (accordion cards) + Preview Note logic

**Goal:** Render the 4 SOAP tabs as nested accordion cards, and add a Preview Note view reproducing the token/UOM substitution logic.

**Files to create:**
- `features/charting/lib/note-utils.ts` — ported pure functions: `UOM_DICTIONARY`, `resolveUom(itmCode)`, `renderItemTemplate(item)` (substitutes `#@ItemName#@`/`#@GeneratedText#@`/`#@UOM#@`, returns `null` if no template), `PatientNoteFacts` type, `buildPatientNoteFacts(age, extSex)` → `{age, gender, pronoun}`, `applyPatientNoteTokens(text, facts)` (case-insensitive `#@age#@`/`#@Gender#@`/`#@He_She#@` substitution + sentence capitalization), `buildItemHtml(item, facts)` (patient tokens first, then item template, then bare `generatedText` fallback), `collectChildValues` (recursive comma-joined child summary).
- `features/charting/data/mock-patient-facts.ts` — dummy `{age: 34, extSex: "F"}` → `MOCK_PATIENT_FACTS` via `buildPatientNoteFacts`.
- `features/charting/components/soap/ChartingV2SoapSection.tsx` — renders one `SoapSectionCard` per top-level component for the active SOAP letter.
- `features/charting/components/soap/SoapSectionCard.tsx` — bordered card, collapsible header (icon + `compntName` + chevron, shadcn `Accordion` or local `useState`), body lists `ItemCard`s, recursively renders `children` as nested cards.
- `features/charting/components/soap/ItemCard.tsx` — static label/value display of one `VisitSheetItem`.
- `features/charting/components/preview/NotePreviewContent.tsx` — `SOAP_ORDER` (S→O→A→P), `ComponentParagraph`, `SoapSection`; renders full note using `buildItemHtml`/`collectChildValues` against `soapGroups` + `MOCK_PATIENT_FACTS` (uses `dangerouslySetInnerHTML` for item lines since templates may carry inline `<b>`/`<br>`).
- Update `ChartingV2View.tsx` — add a "Preview Note" toggle rendering `NotePreviewContent` in place of the accordion view.

**Verify:** With the "Annual Physical" dataset loaded, open each SOAP tab and confirm accordion cards + nested children render correctly. Open Preview Note and confirm: UOM substitution resolves (e.g. "72 in", not literal token text), age/gender/pronoun tokens substitute and capitalize correctly, the null-template item falls back to bare `generatedText`, and switching Encounter Sheet selection changes the rendered structure.

---

## Phase 7 — Chart Details sidebar + polish

**Goal:** Add the right-side Chart Details panel (desktop fixed column / mobile Sheet drawer) with static non-functional sections, then a final responsive/visual polish pass.

**Files to create:**
- `features/charting/data/chart-details.ts` — `CHART_DETAILS_DATA` (Prescriptions, Lab Orders, Referrals, Documents, Images — each with an icon, empty or 1–2 dummy items, a non-functional "+ Add"/"Upload" action) + `ANATOMY_IMAGES_SECTION`.
- `features/charting/components/ChartDetailsSidebar.tsx` — desktop: `w-[300px] hidden lg:block` fixed column, shown when `activeSection !== "overview"`; mobile/tablet: same content inside a shadcn `Sheet` triggered by a header icon button.
- Update `ChartingV2View.tsx` to render the sidebar/sheet trigger conditionally alongside the SOAP pane.
- Polish pass: verify sticky-column z-index stacking on the appointments table, table horizontal scroll container, sidebar/nav responsive collapse, consistent text sizing (`text-[13px]`/`text-xs`) across both pages.

**Verify:** Full click-through: `/appointments` → click a row → `/charting` → Start Charting → fill form → view all 4 SOAP tabs → Preview Note → toggle Chart Details sidebar (desktop) and Sheet (narrow viewport). No console errors; `pnpm exec tsc --noEmit` passes.

---

## Critical files

- `/home/logidots/hackthon/PLAN.md` — persisted plan, drives all later sessions (Phase 0).
- `/home/logidots/hackthon/components/providers/sidebar-provider.tsx` — shell collapse state (Phase 2).
- `/home/logidots/hackthon/features/appointments/components/AppointmentTableRow.tsx` — row-click nav contract: `router.push("/charting")`, no id (Phase 3).
- `/home/logidots/hackthon/features/charting/components/ChartingV2View.tsx` — central state owner: `activeSection`, `hasChart`, `chartSession`, `soapGroups` (Phases 4–7).
- `/home/logidots/hackthon/features/charting/lib/note-utils.ts` — highest-fidelity port target, the UOM/token substitution logic explicitly required to work correctly (Phase 6).
- `/home/logidots/hackthon/features/charting/data/encounter-sheets/index.ts` — encounter-sheet → SOAP dummy dataset mapping that makes the Start Charting dialog functionally meaningful (Phase 5).
