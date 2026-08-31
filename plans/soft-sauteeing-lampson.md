# Plan: 9-Item Feature Sprint

## Context
A batch of UX and data improvements across Scene2 (激活场景) and Scene3 (管理场景), covering data desensitization, role renaming, new dashboard pages, expanded process-param/trend views, a new config field, per-step operator tracking, a toggle-switch column + history sub-page, plan descriptions in the slide-in drawer, and a wider alarm priority matrix.

---

## Files to modify
- `src/scenes/Scene3.tsx` — primary (tasks 1, 2, 3, 5, 6, 7, 9)
- `src/scenes/Scene2.tsx` — task 4
- `src/scenes/Scene1.tsx` — task 8 (ViewDrawer + SHARED_PLANS_DATA description)

---

## Task 1 — Customer desensitization
**Two string replacements in Scene3.tsx:**
- Line ~1289: `name: '宁夏化工有限公司'` → `name: 'XX化工有限公司'`
- Line ~1347: `最近 30 天 · 宁夏化工有限公司` → `最近 30 天 · XX化工有限公司`

---

## Task 2 — Rename "管理人员" → "装置经理"
Three locations in Scene3.tsx:
- Role switcher button label (header): `管理人员` → `装置经理`
- `ManagerView` → `SceneSidebar roleLabel="管理人员工作台"` → `"装置经理工作台"`
- `MGR_NAV` sub-text for existing items where it says `管理人员` (if any)

---

## Task 3 — 总览 Dashboard for all three roles
**Each role gets a `{ key: 'overview', label: '总览', ... }` added as the FIRST item in its nav array**, and each view's default page state becomes `'overview'`。

Add a single `OverviewPage` component parameterized by `role: 'engineer' | 'supervisor' | 'manager'`:
- **工程师总览**: stat cards: 已编制预案数, 启用预案数, 本月知识库新增, 本月报警优先级变更; quick-links grid to each page
- **班长总览**: stat cards: 本月操作记录, 正常完成率, 平均操作时长, 待复位预案; latest 5 op-record rows
- **装置经理总览**: stat cards re-used from DeviceMonitorPage (monthly triggers, avg duration, overtime rate, active plans); mini device-trigger bar chart or text summary

Use the same card/stat style already in `KpiCard` (line 1313) and `DeviceMonitorPage` card row.

Nav icon: use an existing grid/home-like SVG (consistent with other nav icons in Scene3).

---

## Task 4 — Scene2: 16 process params + 16 scrollable trends
**`src/scenes/Scene2.tsx`**

### Process params (关键工艺参数)
- Expand `PROCESS_PARAMS` from 6 → 16 items (add 10 plausible DCS params: feed coal pressure, O2 flow, slurry pump speed, flash drum level, etc.)
- Change the params section from `flexShrink: 0` fixed-height to `flex: 0 0 auto; maxHeight: ~220px; overflowY: auto` so users scroll within it
- Keep the `1fr 1fr 1fr` 3-column grid (rows naturally grow as items are added)

### Historical trends (历史趋势)
- Expand `ALL_TRENDS` to 16 entries (same IDs as the 16 PROCESS_PARAMS)
- Increase hard cap: change `if (prev.length >= 4)` → `if (prev.length >= 16)`, update picker label `最多选 4 个` → `最多选 16 个`, update `DEFAULT_SELECTED` to pick first 4 (unchanged behaviour at start)
- Chart grid: keep `1fr 1fr` two-column layout, change chart container to `flex: 1; overflowY: auto` so charts scroll
- Adjust chart grid rows: `Math.ceil(selectedTrends.length / 2)` rows of fixed height (~200px each) so all selected charts are reachable by scrolling

---

## Task 5 — ConfigPanel 工艺卡片: add 分组 field
**`src/scenes/Scene3.tsx` — `ConfigPanel` (line 186)**

In the `工艺卡片` tab:
- Add `分组` as the **first data column** (after `序号`): header cell + data cell
- The cell renders a `<select>` populated by the group names from `SHARED_PROC_ROWS` (unique `groupTitle` values, filtered from rows of type `组标题`)
- Add `group` field to the local card-row state interface; default value `''`
- The toolbar already handles row operations — no toolbar changes needed

---

## Task 6 — Per-step operator in operation records
**`src/scenes/Scene3.tsx`**

- Add `operator?: string` to the `OpStep` interface (line ~612)
- Populate mock data in `BASE_STEPS`: assign plausible operator names (e.g. `张工`, `李班长`, `王操`) to each step
- In `OpRecordDetail` step row rendering: add a small `操作人` chip after the `完成时刻` cell (or as a sub-line under the step content) — show operator name when present, dash when absent
- Column header: add `操作人` header label in the grid

---

## Task 7 — Plan management: toggle switch + 历史详情 sub-page
**`src/scenes/Scene3.tsx` — `PlanManagementPanel`**

### Toggle switch column
- Add a new `启用状态` column (before `操作`) to the plan table
- Render a custom CSS toggle switch: a pill-shaped `<label>` wrapping a hidden `<input type="checkbox">` + a sliding thumb `<span>`, styled with inline styles matching the existing design language (green = enabled, gray = disabled)
- Remove the `禁用`/`启用`/`关闭`/`开启` `ActionBtn` from the `操作` cell (both engineer and supervisor branches)

### 历史详情 sub-page
- Add `PlanHistoryPage` component: accepts `planName: string`, `onBack: () => void`
- Shows a header with back arrow + plan name
- Lists all `OP_RECORDS` where `record.plan === planName` (or substring match for demo); renders as a table with columns: `执行时间`, `执行人`, `耗时`, `状态`
- Each row is expandable (or has a `偏差分析` button) opening an inline accordion or modal with:
  - Step deviation table: for each step, shows `步序`, `操作内容`, `实际耗时` vs `标准耗时`, deviation badge (green/yellow/red)
  - Auto-generated summary text block: "本次执行共X步，正常完成Y步，偏差Z步"
- Wire into `PlanManagementPanel`: add `viewHistory: string | null` state; clicking `历史详情` ActionBtn sets it; the component renders `PlanHistoryPage` when non-null instead of the normal panel

---

## Task 8 — ViewDrawer: plan description at top
**`src/scenes/Scene1.tsx` and `src/scenes/Scene3.tsx`**

### Data
- Add a `PLAN_DESCRIPTIONS: Record<string, string>` map in Scene1.tsx (or export from Scene3) covering the plan names that appear in `SHARED_PLANS_DATA`. Example:
  ```ts
  const PLAN_DESCRIPTIONS: Record<string, string> = {
    '01 气化冷态开车': '气化炉从冷态启动至正常运行的全流程操作预案，适用于计划停车后的开车工况。',
    ...
  }
  ```
- Keyed by plan name string (the same string passed as `plan` prop to `ViewDrawer`)

### ViewDrawer rendering
- After the header (plan name + legend badges), add a description block:
  - Light gray background card with left-border accent
  - Shows `PLAN_DESCRIPTIONS[plan] ?? '暂无预案描述'`
  - Font: 12–13px, color `#515760`, line-height 1.6
- Insert before the step list

---

## Task 9 — AlarmPriorityMatrixPage: widen
**`src/scenes/Scene3.tsx` — `AlarmPriorityMatrixPage` (line ~2022)**

- Remove or increase `maxWidth: 680` on the table container → set to `maxWidth: 960` (or remove entirely to let it fill the panel)
- Adjust grid columns from `'48px 1fr 1fr 140px 48px'` to `'48px 2fr 2fr 200px 80px'` so name/color columns get more space
- Ensure the color-picker expanded row (preset swatches) has enough room

---

## Verification
1. Scene3 loads without errors — check all three role views render, each has a 总览 page
2. Scene2: process params shows 16 cards, scrollable; trend picker shows 16 options; charts scroll when many are selected
3. ConfigPanel 工艺卡片 tab: 分组 column appears with working dropdown
4. OpRecordDetail: each step row shows an operator name
5. PlanManagementPanel: toggle switch works (click toggles enabled/disabled), 历史详情 opens sub-page with op records + deviation data
6. ViewDrawer (from Scene1 PlanPanel "查看预案" and Scene3 "查看"): description block appears above step list
7. AlarmPriorityMatrixPage: table fills the panel width with no clipping
8. No TypeScript errors: `npx tsc --noEmit`
