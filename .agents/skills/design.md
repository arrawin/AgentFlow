# AI Workflow Orchestration Platform — UI Spec (Premium Dark Mode)

## Objective

Build a **clean, modern, aesthetic dark UI** that feels premium and intentional.

The UI should feel like:

* Linear (clean & sharp)
* Vercel (dark & elegant)
* Notion (structured & readable)

Avoid anything that looks generic or auto-generated.

---

## 🎨 Design Principles

* Minimal, not empty
* Soft contrast (no harsh black/white)
* Subtle depth (layers, not shadows everywhere)
* Consistent spacing
* Smooth alignment
* Typography > decoration

---

## 🌑 Color System

### Backgrounds

* Primary: #0b1020 (deep navy black)
* Secondary: #111827 (main panels)
* Tertiary: #1f2937 (hover / cards)

### Text

* Primary: #e5e7eb (soft white)
* Secondary: #9ca3af (muted gray)

### Accent

* Primary accent: #6366f1 (indigo)
* Hover: #4f46e5

### Status

* Success: #22c55e
* Warning: #f59e0b
* Error: #ef4444

### Borders

* #1f2937 (subtle, not strong)

---

## 🔤 Typography

Font:

* Primary: Inter
* Fallback: system-ui

Style:

* Headings → semi-bold
* Body → regular
* Small text → muted gray

Spacing:

* Line height slightly relaxed
* Avoid cramped layouts

---

## 🧱 Layout System

### App Layout

Left Sidebar (fixed)
Right Content Area (scrollable)

No top navbar needed.

---

## 🧭 Sidebar Design

* Background: slightly darker than main
* Items:

  * Dashboard
  * Agents
  * Tasks
  * Run History
  * Scheduler
  * Tools
  * LLM Settings

### Interaction

* Hover → subtle bg change (#1f2937)
* Active → accent highlight (indigo bar or bg)

---

## 🧾 Card Design

* Background: #111827
* Border: 1px solid #1f2937
* Border-radius: 12px
* Padding: 16px–20px

No heavy shadows.

---

## 🔘 Buttons

Primary:

* Indigo background
* White text
* Rounded (8px)
* Slight hover darkening

Secondary:

* Dark background
* Border + subtle hover

Danger:

* Red tone (for failures)

---

## 🧾 Inputs

* Background: slightly darker (#020617)
* Border: subtle gray
* Text: light
* Placeholder: muted

Focus:

* Border turns indigo

---

## 📊 Status Styling

Use color + label (not color alone):

* Completed → green + "Completed"
* Running → blue + "In Progress"
* Failed → red + "Failed"

---

## 📄 Pages

---

### 1. Dashboard (Minimal)

* 3 stat cards (Agents / Tasks / Runs)
* Recent runs table

Keep it clean. No charts.

---

### 2. Agent Management

Layout:

* Left: agent list (grouped)
* Center: form
* Right: dry run panel

Make it feel like a dev tool — not a form-heavy page.

---

### 3. Task Management (MOST IMPORTANT)

This is your hero page.

Layout:

* Top → Task input
* Middle → Agent selection / workflow
* Bottom → actions

### Workflow Display

* Show as clean vertical steps:

  1. Research Agent
  2. Analyst
  3. Writer

No graph UI.

---

### 4. Run History

Table:

* Run ID
* Task
* Status
* Time

---

### Trace Drawer (KEY FEATURE)

When clicking a run:

Slide-in panel from right.

Each step:

* Agent name
* Status
* Duration
* Output snippet

Expandable for full logs.

This is the MOST important visual in the app.

---

### 5. Scheduler

Keep simple:

* Cron input
* Task selection

If not implemented:

* Show "Coming soon"

---

### 6. Tools

Minimal list:

* web_search
* file_reader

---

### 7. LLM Settings

Simple form. No design complexity.

---

## ✨ Micro-Interactions

* Hover states everywhere (subtle)
* Smooth transitions (150–200ms)
* No flashy animations

---

## ❌ Strictly Avoid

* Neon/glow effects
* Gradient overload
* Glassmorphism
* Complex shadows
* Drag-and-drop builders
* Overcrowded UI

---

## 🧠 UX Goal

User should be able to:

1. Create agent
2. Create task
3. Run task
4. See execution trace

Without confusion.

---

## 🎯 Final Feel

The UI should feel like:

* A tool built by engineers
* Clean, focused, efficient
* Quietly impressive

NOT:

* A design showcase
* A template UI
* A flashy AI demo

---

## Priority

1. Task Page
2. Run History + Trace
3. Agent Page
4. Everything else

---

## Final Rule

If something does not improve clarity → remove it.
