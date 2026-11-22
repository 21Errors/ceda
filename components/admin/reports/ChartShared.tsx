export const CEDA_PALETTE = [
  "#7A1F14", // CEDA burgundy
  "#E8710A", // CEDA orange
  "#A93B2B", // warm brick
  "#D4914A", // warm gold
  "#5C150D", // deep burgundy
  "#7F5E4E", // warm muted
];

export const FUNNEL_COLORS = [
  "#7A1F14",
  "#9B2C1E",
  "#C64E18",
  "#E8710A",
  "#16803C",
];

export const CHART_TOOLTIP_STYLE = {
  borderRadius: "12px",
  borderColor: "#E5CFC3",
  fontSize: "12px",
} as const;

export function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-ceda-line bg-[#FFFDFC] px-6 text-center text-sm text-ceda-muted">
      {message}
    </div>
  );
}
