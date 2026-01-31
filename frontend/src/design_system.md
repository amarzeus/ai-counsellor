# AI Counsellor Design System

**Objective:** Unify the application under a "Calm, Premium SaaS" aesthetic.

## 1. Core Tokens

### Typography
- **Font**: Geist Sans (`var(--font-sans)`).
- **Scale**:
  - `h1`: `text-4xl md:text-5xl font-bold tracking-tight`
  - `h2`: `text-2xl font-semibold tracking-tight`
  - `h3`: `text-lg font-medium`
  - `body`: `text-sm text-slate-600 dark:text-slate-400 leading-relaxed`
  - `caption`: `text-xs text-slate-500`

### Spacing & Grid
- **Base Unit**: 4px (Tailwind standard).
- **Container**: `max-w-7xl mx-auto px-6`.
- **Section Padding**: `py-16` or `py-20` (Generous whitespace).
- **Card Padding**: `p-6` or `p-8`.

### Colors (Semantic)
Using `oklch` palette from `globals.css`.
- **Background**: `bg-slate-50` (Light) / `bg-[#0B1120]` (Dark Premium).
- **Surface (Cards)**: `bg-white` / `bg-slate-900`.
- **Primary**: `text-blue-600` / `bg-blue-600` (Trust/Calm).
- **Text**:
  - Primary: `text-slate-900` / `text-white`
  - Secondary: `text-slate-600` / `text-slate-400`
  - Muted: `text-slate-400` / `text-slate-600`

### Radius & Borders
- **Radius**: `rounded-2xl` (Cards), `rounded-xl` (Buttons/Inputs).
- **Borders**: Thin, subtle. `border-slate-200` / `border-slate-800`.

### Shadows & Depth
- **Card Shadow**: `shadow-sm hover:shadow-md transition-shadow`.
- **Premium Glow**: `shadow-[0_0_40px_-10px_rgba(37,99,235,0.1)]`.

---

## 2. Components

### Buttons
- **Primary**: `bg-blue-600 text-white hover:bg-blue-700 shadow-sm`.
- **Secondary**: `bg-white text-slate-700 border border-slate-200 hover:bg-slate-50`.
- **Ghost**: `text-slate-600 hover:bg-slate-100 hover:text-slate-900`.
- **Size**: `h-10 px-4 py-2` (Standard), `h-12 px-6` (Hero/CTA).

### Cards
- **Standard**: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6`.
- **Interactive**: Add `hover:border-blue-500/50 transition-colors cursor-pointer`.

### Inputs
- **Style**: `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20`.

---

## 3. Motion
- **Transition**: `transition-all duration-300 ease-in-out`.
- **Hover**: `hover:translate-y-[-2px]`.
- **Page Load**: Fade in `opacity-0 animate-in fade-in duration-500`.

## 4. Porting Checklist
1. Dashboard
2. Chat UI
3. University Cards
4. Tasks
5. Pricing (Done)
