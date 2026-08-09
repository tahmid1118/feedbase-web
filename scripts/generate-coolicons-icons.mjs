// One-time / re-runnable codegen: fetches coolicons SVG source (free tier,
// CC BY 4.0 — see ATTRIBUTION.md) and writes a thin React wrapper component
// per icon into components/icons/. Re-run after editing ICONS below to add
// or update a direct coolicons-sourced icon. Does NOT touch the composed
// (ChevronsUpDown/LogIn/MailX) or hand-drawn icons — those are hand-authored
// files, not generated.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "components", "icons");
const BASE =
  "https://raw.githubusercontent.com/krystonschwarze/coolicons/master/coolicons%20SVG";

// [ComponentName, coolicons category folder, coolicons file name (no .svg)]
const ICONS = [
  ["AlertCircle", "Warning", "Circle_Warning"],
  ["AlertTriangle", "Warning", "Triangle_Warning"],
  ["ArrowLeft", "Arrow", "Arrow_Left_LG"],
  ["ArrowRight", "Arrow", "Arrow_Right_LG"],
  ["ArrowUpDown", "Arrow", "Arrow_Down_Up"],
  ["ArrowUpRight", "Arrow", "Arrow_Up_Right_LG"],
  ["BadgeCheck", "Warning", "Octagon_Check"],
  ["Ban", "Warning", "Stop_Sign"],
  ["BarChart3", "Interface", "Chart_Bar_Vertical_01"],
  ["Bell", "Communication", "Bell"],
  ["Building2", "Navigation", "Building_02"],
  ["Calendar", "Calendar", "Calendar"],
  ["Camera", "System", "Camera"],
  ["Check", "Interface", "Check"],
  ["CheckCircle2", "Warning", "Circle_Check"],
  ["ChevronDownIcon", "Arrow", "Chevron_Down"],
  ["ChevronLeftIcon", "Arrow", "Chevron_Left"],
  ["ChevronRightIcon", "Arrow", "Chevron_Right"],
  ["ChevronUpIcon", "Arrow", "Chevron_Up"],
  ["Clock", "Calendar", "Clock"],
  ["Copy", "Edit", "Copy"],
  ["CornerDownRight", "Arrow", "Arrow_Sub_Down_Right"],
  ["CreditCard", "Interface", "Credit_Card_01"],
  ["ExternalLink", "Interface", "External_Link"],
  ["Eye", "Edit", "Show"],
  ["EyeOff", "Edit", "Hide"],
  ["FileText", "File", "File_Document"],
  ["Globe", "Navigation", "Globe"],
  ["GripVertical", "Interface", "Drag_Vertical"],
  ["ImageIcon", "Media", "Image_01"],
  ["InfoIcon", "Warning", "Info"],
  ["LayoutDashboard", "System", "Window_Sidebar"],
  ["Link2", "Interface", "Link"],
  ["Loader2", "Interface", "Loading"],
  ["Lock", "Interface", "Lock"],
  ["LogOut", "Interface", "Log_Out"],
  ["Mail", "Communication", "Mail"],
  ["MailCheck", "Communication", "Mail_Open"],
  ["Menu", "Menu", "Hamburger_MD"],
  ["MessageCircle", "Communication", "Chat_Circle"],
  ["MessageCirclePlus", "Communication", "Chat_Circle_Add"],
  ["MessageSquare", "Communication", "Chat"],
  ["MessagesSquare", "Communication", "Chat_Conversation"],
  ["MinusIcon", "Edit", "Remove_Minus"],
  ["MonitorSmartphone", "System", "Devices"],
  ["MoreHorizontalIcon", "Menu", "More_Horizontal"],
  ["OctagonXIcon", "Warning", "Octagon_Warning"],
  ["Palette", "Edit", "Swatches_Palette"],
  ["Paperclip", "Edit", "Paperclip_Attechment_Horizontal"],
  ["Pencil", "Edit", "Edit_Pencil_01"],
  ["Pin", "Navigation", "Map_Pin"],
  ["Plus", "Edit", "Add_Plus"],
  ["RotateCcw", "Arrow", "Arrow_Reload_02"],
  ["Search", "Interface", "Search_Magnifying_Glass"],
  ["Send", "Communication", "Paper_Plane"],
  ["Settings", "Interface", "Settings"],
  ["Share2", "Communication", "Share_Android"],
  ["ShieldAlert", "Warning", "Shield_Warning"],
  ["ShieldCheck", "Warning", "Shield_Check"],
  ["Tag", "Interface", "Tag"],
  ["Ticket", "Interface", "Ticket_Voucher"],
  ["Trash2", "Interface", "Trash_Empty"],
  ["Upload", "File", "File_Upload"],
  ["User", "User", "User_01"],
  ["UserPlus", "User", "User_Add"],
  ["Users", "User", "Users"],
  ["X", "Menu", "Close_MD"],
];

function extractPaths(svg) {
  const paths = [...svg.matchAll(/<path[^>]*\bd="([^"]+)"/g)].map((m) => m[1]);
  if (paths.length === 0) {
    throw new Error("no <path d=\"...\"> elements found in SVG source");
  }
  return paths;
}

function componentSource(name, paths) {
  const pathTags = paths.map((d) => `      <path d="${d}" />`).join("\n");
  return `import type { IconProps } from "./types";

export function ${name}({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
${pathTags}
    </svg>
  );
}
`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const [name, category, file] of ICONS) {
    const url = `${BASE}/${category}/${encodeURIComponent(file)}.svg`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`fetch failed (${res.status}) for ${name}: ${url}`);
    }
    const svg = await res.text();
    const paths = extractPaths(svg);
    const source = componentSource(name, paths);
    const outPath = path.join(OUT_DIR, `${name}.tsx`);
    await writeFile(outPath, source, "utf8");
    console.log(`wrote ${name}.tsx (${paths.length} path${paths.length > 1 ? "s" : ""})`);
  }
  console.log(`done: ${ICONS.length} icons generated`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
