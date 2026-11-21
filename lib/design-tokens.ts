export interface ColorToken {
  name: string;
  cssVar: string;
  tailwind: string;
  hex: string;
  role: string;
  textOnSwatch: "light" | "dark";
}

export interface SpacingToken {
  token: string;
  cssVar: string;
  tailwind: string;
  value: string;
  px: string;
  usage: string;
}

export interface SemanticSpacingToken {
  name: string;
  cssVar: string;
  tailwind: string;
  formula: string;
  range: string;
  usage: string;
}

export interface ContainerToken {
  name: string;
  cssVar: string;
  width: string;
  usage: string;
}

export interface RadiusToken {
  name: string;
  cssVar: string;
  tailwind: string;
  value: string;
  usage: string;
}

export interface ShadowToken {
  name: string;
  cssVar: string;
  tailwind: string;
  usage: string;
}

export const BRAND_COLOR_TOKENS: readonly ColorToken[] = [
  {
    name: "CEDA Burgundy",
    cssVar: "--ceda-burgundy",
    tailwind: "bg-ceda-burgundy",
    hex: "#7A1F14",
    role: "Primary brand action, active links, authority headers",
    textOnSwatch: "light",
  },
  {
    name: "Burgundy Dark",
    cssVar: "--ceda-burgundy-dark",
    tailwind: "bg-ceda-burgundy-dark",
    hex: "#5C150D",
    role: "Primary hover & pressed states, deep brand gradients",
    textOnSwatch: "light",
  },
  {
    name: "Burgundy Light",
    cssVar: "--ceda-burgundy-light",
    tailwind: "bg-ceda-burgundy-light",
    hex: "#94291D",
    role: "Subtle highlight strokes and active brand tints",
    textOnSwatch: "light",
  },
  {
    name: "CEDA Orange",
    cssVar: "--ceda-orange",
    tailwind: "bg-ceda-orange",
    hex: "#E8710A",
    role: "Secondary accent, eyebrow labels, focus rings, milestones",
    textOnSwatch: "light",
  },
  {
    name: "Orange Glow",
    cssVar: "--ceda-orange-glow",
    tailwind: "bg-ceda-orange-glow",
    hex: "#F38C30",
    role: "Ambient glow accents and warm active highlights",
    textOnSwatch: "dark",
  },
  {
    name: "Warm Peach",
    cssVar: "--ceda-peach",
    tailwind: "bg-ceda-peach",
    hex: "#F4B58A",
    role: "Timeline borders, dark-surface eyebrows, decorative accents",
    textOnSwatch: "dark",
  },
  {
    name: "Peach Light",
    cssVar: "--ceda-peach-light",
    tailwind: "bg-ceda-peach-light",
    hex: "#FCEBDD",
    role: "Warm illustration backdrops and soft highlight surfaces",
    textOnSwatch: "dark",
  },
  {
    name: "Cream Start",
    cssVar: "--ceda-cream-start",
    tailwind: "bg-ceda-cream",
    hex: "#FFF9F4",
    role: "Warm card surfaces, callouts, hover fills, table headers",
    textOnSwatch: "dark",
  },
  {
    name: "Cream Mid",
    cssVar: "--ceda-cream-mid",
    tailwind: "bg-ceda-cream-mid",
    hex: "#FFF1E4",
    role: "Icon tiles, status pills, hero mid-stop gradient",
    textOnSwatch: "dark",
  },
  {
    name: "Cream End",
    cssVar: "--ceda-cream-end",
    tailwind: "bg-ceda-cream-end",
    hex: "#F6DCCB",
    role: "Hero lower gradient stop and rich warm framing",
    textOnSwatch: "dark",
  },
  {
    name: "Surface Muted",
    cssVar: "--surface-muted",
    tailwind: "bg-surface-muted",
    hex: "#F8F9FA",
    role: "Workspace canvas, alternating bands, neutral control hovers",
    textOnSwatch: "dark",
  },
  {
    name: "Ink Main",
    cssVar: "--ceda-text-main",
    tailwind: "text-ceda-ink",
    hex: "#331F17",
    role: "Headings, KPI figures, table row headers, form labels",
    textOnSwatch: "light",
  },
  {
    name: "Body Copy",
    cssVar: "--ceda-text-body",
    tailwind: "text-ceda-body",
    hex: "#573E32",
    role: "Primary prose, form descriptions, dialog body text",
    textOnSwatch: "light",
  },
  {
    name: "Muted Text",
    cssVar: "--ceda-text-muted",
    tailwind: "text-ceda-muted",
    hex: "#7F5E4E",
    role: "Metadata, timestamps, format hints, secondary captions",
    textOnSwatch: "light",
  },
];

export const BASE_SPACING_TOKENS: readonly SpacingToken[] = [
  { token: "ds-1", cssVar: "--space-1", tailwind: "p-ds-1 / gap-ds-1", value: "0.25rem", px: "4px", usage: "Hairline gaps, badge icon spacing, compact label offsets" },
  { token: "ds-2", cssVar: "--space-2", tailwind: "p-ds-2 / gap-ds-2", value: "0.5rem", px: "8px", usage: "Inline icon-text gaps, tight pill clusters, helper spacing" },
  { token: "ds-3", cssVar: "--space-3", tailwind: "p-ds-3 / gap-ds-3", value: "0.75rem", px: "12px", usage: "Button groups, compact card gaps, form control padding" },
  { token: "ds-4", cssVar: "--space-4", tailwind: "p-ds-4 / gap-ds-4", value: "1rem", px: "16px", usage: "Default component rhythm, grid gutters on mobile, list padding" },
  { token: "ds-5", cssVar: "--space-5", tailwind: "p-ds-5 / gap-ds-5", value: "1.25rem", px: "20px", usage: "Form field vertical stack, card internal sections" },
  { token: "ds-6", cssVar: "--space-6", tailwind: "p-ds-6 / gap-ds-6", value: "1.5rem", px: "24px", usage: "Standard card padding, dashboard column separation" },
  { token: "ds-8", cssVar: "--space-8", tailwind: "p-ds-8 / gap-ds-8", value: "2rem", px: "32px", usage: "Major block separation, modal spacing, feature grids" },
  { token: "ds-10", cssVar: "--space-10", tailwind: "p-ds-10 / gap-ds-10", value: "2.5rem", px: "40px", usage: "Page header breathing room, spacious feature cards" },
  { token: "ds-12", cssVar: "--space-12", tailwind: "p-ds-12 / gap-ds-12", value: "3rem", px: "48px", usage: "Compact section vertical rhythm, hero content splits" },
  { token: "ds-16", cssVar: "--space-16", tailwind: "p-ds-16 / gap-ds-16", value: "4rem", px: "64px", usage: "Editorial section separation, footer padding" },
  { token: "ds-20", cssVar: "--space-20", tailwind: "p-ds-20 / gap-ds-20", value: "5rem", px: "80px", usage: "Flagship landing band separation on wide screens" },
];

export const SEMANTIC_SPACING_TOKENS: readonly SemanticSpacingToken[] = [
  {
    name: "Page Gutter",
    cssVar: "--space-gutter",
    tailwind: "px-gutter",
    formula: "clamp(1rem, 2.5vw, 2rem)",
    range: "16px → 32px",
    usage: "Consistent horizontal inset for every Container & page shell",
  },
  {
    name: "Section Small",
    cssVar: "--space-section-sm",
    tailwind: "py-section-sm",
    formula: "clamp(2rem, 4vw, 3rem)",
    range: "32px → 48px",
    usage: "Workspace headers, compact admin & dashboard bands",
  },
  {
    name: "Section Default",
    cssVar: "--space-section",
    tailwind: "py-section",
    formula: "clamp(3rem, 5vw, 5rem)",
    range: "48px → 80px",
    usage: "Standard public & informational vertical section rhythm",
  },
  {
    name: "Section Large",
    cssVar: "--space-section-lg",
    tailwind: "py-section-lg",
    formula: "clamp(3.75rem, 6.5vw, 6.25rem)",
    range: "60px → 100px",
    usage: "Hero showcases and primary editorial transitions",
  },
  {
    name: "Card Small",
    cssVar: "--space-card-sm",
    tailwind: "p-card-sm",
    formula: "clamp(0.875rem, 1.8vw, 1.25rem)",
    range: "14px → 20px",
    usage: "Compact list cards, sidebar widgets, dense KPI tiles",
  },
  {
    name: "Card Default",
    cssVar: "--space-card",
    tailwind: "p-card",
    formula: "clamp(1.25rem, 2.5vw, 1.75rem)",
    range: "20px → 28px",
    usage: "Default card bodies, forms, submission summaries",
  },
  {
    name: "Card Large",
    cssVar: "--space-card-lg",
    tailwind: "p-card-lg",
    formula: "clamp(1.5rem, 3vw, 2.5rem)",
    range: "24px → 40px",
    usage: "Feature spotlights, modals, auth containers, hero frames",
  },
  {
    name: "Stack Default",
    cssVar: "--space-stack",
    tailwind: "gap-stack",
    formula: "1.25rem",
    range: "20px fixed",
    usage: "Standard vertical flow between sibling blocks & form fields",
  },
  {
    name: "Cluster Default",
    cssVar: "--space-cluster",
    tailwind: "gap-cluster",
    formula: "0.75rem",
    range: "12px fixed",
    usage: "Wrapping rows of buttons, filter chips, and status badges",
  },
  {
    name: "Field Gap",
    cssVar: "--space-field",
    tailwind: "gap-field",
    formula: "0.375rem",
    range: "6px fixed",
    usage: "Tight association between label, hint, input, and error text",
  },
];

export const CONTAINER_TOKENS: readonly ContainerToken[] = [
  { name: "Narrow", cssVar: "--container-narrow", width: "44rem (704px)", usage: "Authentication flows, legal prose, focused single-column reading" },
  { name: "Content", cssVar: "--container-content", width: "68.75rem (1100px)", usage: "Admin panels, submission forms, audit & reports tables" },
  { name: "Shell", cssVar: "--container-shell", width: "86.25rem (1380px)", usage: "Public landing pages, navbar, footer, FAQ & support portals" },
  { name: "Workspace", cssVar: "--container-workspace", width: "90rem (1440px)", usage: "Multi-column submitter, evaluator & adjudicator dashboards" },
];

export const RADIUS_TOKENS: readonly RadiusToken[] = [
  { name: "Control", cssVar: "--radius-control", tailwind: "rounded-control", value: "0.625rem (10px)", usage: "Text inputs, selects, checkboxes, compact alerts" },
  { name: "Card", cssVar: "--radius-card", tailwind: "rounded-card", value: "1rem (16px)", usage: "Standard cards, KPI tiles, data tables, accordions" },
  { name: "Panel", cssVar: "--radius-panel", tailwind: "rounded-panel", value: "1.5rem (24px)", usage: "Modal dialogs, hero containers, featured banners" },
  { name: "Pill", cssVar: "--radius-pill", tailwind: "rounded-full", value: "9999px", usage: "Primary/secondary buttons, status badges, filter chips" },
];

export const SHADOW_TOKENS: readonly ShadowToken[] = [
  { name: "Subtle (xs)", cssVar: "--shadow-xs", tailwind: "shadow-xs", usage: "Inputs, secondary pill buttons, subtle chips" },
  { name: "Card", cssVar: "--shadow-card", tailwind: "shadow-card", usage: "Interactive cards, dashboard panels, feature grids" },
  { name: "Elevated", cssVar: "--shadow-elevated", tailwind: "shadow-elevated", usage: "Auth cards, dropdown flyouts, sticky bars" },
  { name: "Modal", cssVar: "--shadow-modal", tailwind: "shadow-modal", usage: "Native top-layer dialogs and confirmation sheets" },
  { name: "Brand", cssVar: "--shadow-brand", tailwind: "shadow-brand", usage: "Deep burgundy banners and featured announcements" },
];
