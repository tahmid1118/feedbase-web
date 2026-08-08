# Migrate all icons from lucide-react to coolicons

## Context

The project currently uses `lucide-react` throughout — 85 distinct icons across 84
files, including both app-authored components and the icons baked into shadcn/ui
primitives (`components/ui/dialog.tsx`, `checkbox.tsx`, `select.tsx`,
`dropdown-menu.tsx`, `calendar.tsx`, `command.tsx`, `pagination.tsx`,
`input-otp.tsx`, `navigation-menu.tsx`, `toast.tsx`, `sonner.tsx`, `accordion.tsx`,
`sheet.tsx`).

The request: replace every icon in the project with icons from
[coolicons](https://coolicons.cool/), hand-drawing anything missing in the same
style.

**What coolicons actually is**, confirmed by pulling the real repo/catalog rather
than assuming from the marketing site:

- The **free tier** (440+ icons, what's actually usable here) is distributed as
  raw SVG files on GitHub (`krystonschwarze/coolicons`), **CC BY 4.0** licensed
  (attribution required).
- The **PRO tier** ($24, 1,320+ icons) is **Figma-Community-only** — there is no
  bulk SVG/API access to it, so it isn't something I can pull programmatically at
  all. This isn't a real option for an automated integration regardless of the
  license question, so the free tier is the only practical source.
- Every free SVG uses the exact same visual contract as lucide: `viewBox="0 0 24
  24"`, `stroke="currentColor"`, `stroke-width="2"`, round line caps/joins, no
  fill. That's what makes a like-for-like swap feasible — sizing, color
  inheritance, and Tailwind utility classes (`className="h-4 w-4"` etc.) all keep
  working unchanged.
- Icons are organized into 14 category folders (Arrow, Calendar, Communication,
  Edit, Environment, File, Interface, Media, Menu, Navigation, Shape, System,
  User, Warning), one SVG per icon, named `Pascal_Snake_Case.svg`.

## Decisions (confirmed)

1. **Attribution**: code-only. A root `NOTICE`/`ATTRIBUTION.md` crediting
   coolicons (CC BY 4.0) + coolicons.cool, referenced from a header comment in
   `components/icons/index.ts`. Not surfaced anywhere in the UI.
2. **Scope**: everywhere, including the icons inside shadcn/ui primitive
   components — not just app-authored feature icons. Full visual consistency
   over keeping those files stock. `CLAUDE.md` gets a note that these primitives
   now diverge from vanilla shadcn, so re-running `pnpm dlx shadcn add
   <component>` on any of them later would silently reintroduce lucide icons and
   needs re-patching by hand.
3. **Integration shape**: one React component per icon under `components/icons/`
   (e.g. `Trash.tsx`, `Chat.tsx`, `ChevronDown.tsx`), each accepting the same
   prop shape lucide's icon components do (`size?: number`, `className?:
   string`, `strokeWidth?: number`, plus standard SVG props via
   `React.SVGProps<SVGSVGElement>` spread) so call sites change minimally — swap
   the import source and the tag name, keep the same `className`/`size` usage.
   Re-exported from `components/icons/index.ts`.
4. **Out of scope**: the FeedBoard brand mark itself (`components/ui/logo.tsx`,
   `public/icon.svg`, `public/logo.svg`, `logo-120.png`, `logo-512.png`,
   `public/favicon.ico`, backend's `assets/app-icon.svg`) — CLAUDE.md is explicit
   these five/six places must stay in lockstep and are the product's identity,
   not a UI icon from a shared library. Untouched by this change.
5. Once nothing imports `lucide-react`, remove it from `package.json` /
   `pnpm-lock.yaml`.

## The mapping (85 icons)

Format: `lucide name → coolicons source` (category/file, no `.svg`), or
`→ CUSTOM` for hand-drawn.

### Direct 1:1 matches (73)

```
AlertCircle        → Warning/Circle_Warning
AlertTriangle      → Warning/Triangle_Warning
ArrowLeft          → Arrow/Arrow_Left_LG
ArrowRight         → Arrow/Arrow_Right_LG
ArrowUpDown        → Arrow/Arrow_Down_Up
ArrowUpRight       → Arrow/Arrow_Up_Right_LG
BadgeCheck         → Warning/Octagon_Check      (scalloped badge shape = verified tick)
Ban                → Warning/Stop_Sign
BarChart3          → Interface/Chart_Bar_Vertical_01
Bell               → Communication/Bell
Building2          → Navigation/Building_02
Calendar           → Calendar/Calendar
Camera             → System/Camera
Check              → Interface/Check
CheckCircle2       → Warning/Circle_Check
CheckIcon          → Interface/Check             (shadcn: checkbox, select, dropdown, command)
ChevronDownIcon    → Arrow/Chevron_Down
ChevronLeftIcon    → Arrow/Chevron_Left
ChevronRightIcon   → Arrow/Chevron_Right
ChevronUpIcon      → Arrow/Chevron_Up
CircleCheckIcon    → Warning/Circle_Check         (sonner; same source as CheckCircle2)
Clock              → Calendar/Clock
Copy               → Edit/Copy
CornerDownRight    → Arrow/Arrow_Sub_Down_Right
CreditCard         → Interface/Credit_Card_01
ExternalLink       → Interface/External_Link
Eye                → Edit/Show
EyeOff             → Edit/Hide
FileText           → File/File_Document
Globe              → Navigation/Globe
GripVertical       → Interface/Drag_Vertical
ImageIcon          → Media/Image_01
InfoIcon           → Warning/Info
LayoutDashboard    → System/Window_Sidebar
Link2              → Interface/Link
Loader2            → Interface/Loading            (Tailwind's existing animate-spin keeps working)
Loader2Icon        → Interface/Loading
Lock               → Interface/Lock
LogOut             → Interface/Log_Out
Mail               → Communication/Mail
MailCheck          → Communication/Mail_Open
Menu               → Menu/Hamburger_MD
MessageCircle      → Communication/Chat_Circle
MessageCirclePlus  → Communication/Chat_Circle_Add
MessageSquare      → Communication/Chat
MessagesSquare     → Communication/Chat_Conversation
MinusIcon          → Edit/Remove_Minus            (OTP separator)
MonitorSmartphone  → System/Devices
MoreHorizontalIcon → Menu/More_Horizontal
OctagonXIcon       → Warning/Octagon_Warning       (sonner error toast)
Palette            → Edit/Swatches_Palette
Paperclip          → Edit/Paperclip_Attechment_Horizontal
Pencil             → Edit/Edit_Pencil_01
Pin                → Navigation/Map_Pin
Plus               → Edit/Add_Plus
RotateCcw          → Arrow/Arrow_Reload_02
Search             → Interface/Search_Magnifying_Glass
SearchIcon         → Interface/Search_Magnifying_Glass
Send               → Communication/Paper_Plane
Settings           → Interface/Settings
Share2             → Communication/Share_Android
ShieldAlert        → Warning/Shield_Warning
ShieldCheck        → Warning/Shield_Check
Tag                → Interface/Tag
Ticket             → Interface/Ticket_Voucher
Trash2             → Interface/Trash_Empty
TriangleAlertIcon  → Warning/Triangle_Warning     (same source as AlertTriangle)
Upload             → File/File_Upload
User               → User/User_01
UserPlus           → User/User_Add
Users              → User/Users
X                  → Menu/Close_MD
XIcon              → Menu/Close_MD                (shadcn: dialog, sheet, toast)
```

### Composed from existing coolicons paths (3)

```
ChevronsUpDown  → stack Arrow/Chevron_Up above Arrow/Chevron_Down in one viewBox
LogIn           → Interface/Log_Out, mirrored horizontally (scale(-1,1) transform)
MailX           → Communication/Mail + a small X mark composited in the corner
```

### Hand-drawn, no free coolicons equivalent (8 new glyphs, covering 9 icon names)

Same contract as every other icon: `viewBox="0 0 24 24"`, `stroke="currentColor"`,
`stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"`.

```
Bug       → simple insect glyph (oval body, center line, three leg-pairs, two antennae)
Film      → film-strip rectangle with perforation ticks down both edges
GitBranch → three circles (nodes) joined by two branch lines, matching lucide's layout
Headset   → arc headband + two ear-cup ovals
KeyRound  → circular bow + a small offset shaft with 1-2 teeth notches
Sparkles  → 4-point sparkle burst (large + small diamond/star shapes), landing/marketing use
ThumbsUp  → hand + raised thumb outline
Zap       → classic lightning-bolt zigzag
```

`Vote` (the 9th name) is not a separate hand-drawn icon — it's aliased to the
`ThumbsUp` component (both represent "voting" in this app; drawing a second,
different glyph for the same concept would read as inconsistent).

**Tally check**: 73 direct + 3 composed + 8 hand-drawn components (9 names, via
the `Vote`→`ThumbsUp` alias) = 85 lucide names covered.

## Verification

- `pnpm exec tsc --noEmit` and `pnpm lint` clean.
- `grep -r "lucide-react"` returns nothing in the repo (excluding
  `pnpm-lock.yaml` history) once `lucide-react` is removed from `package.json`.
- Visual pass via the existing Puppeteer setup: screenshot a representative page
  from each major surface (landing, login, dashboard sidebar + a feedback list
  with status/warning icons, a dialog with a close X, the OTP/reset-password
  flow, an admin page with the search/badge icons, the public portal board with
  vote/comment/share icons) and eyeball that nothing renders as a missing/broken
  icon box.
- Spot-check that `animate-spin` and other existing Tailwind classes applied to
  icon components still animate/size correctly (the `Loading` glyph in
  particular, since it's used everywhere `Loader2` was).
