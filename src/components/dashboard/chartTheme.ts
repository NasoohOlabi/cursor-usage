/** Recharts inline styles; separate from Tailwind. */
export type ChartTheme = {
	gridStroke: string;
	axisStroke: string;
	axisLabelFill: string;
	tickFill: string;
	tooltipBg: string;
	tooltipBorder: string;
	tooltipLabel: string;
	tooltipRow: string;
	tooltipShadow: string;
	/** Cell stroke in bar chart outlines */
	cellStroke: string;
};

export function getChartTheme(isDark: boolean): ChartTheme {
	if (isDark) {
		return {
			gridStroke: "#1e293b",
			axisStroke: "#94a3b8",
			axisLabelFill: "#64748b",
			tickFill: "#94a3b8",
			tooltipBg: "#0f172a",
			tooltipBorder: "#1e293b",
			tooltipLabel: "#e2e8f0",
			tooltipRow: "#cbd5e1",
			tooltipShadow: "0 8px 24px rgba(0,0,0,0.35)",
			cellStroke: "#020617",
		};
	}
	return {
		gridStroke: "#e2e8f0",
		axisStroke: "#94a3b8",
		axisLabelFill: "#64748b",
		tickFill: "#64748b",
		tooltipBg: "#ffffff",
		tooltipBorder: "#e2e8f0",
		tooltipLabel: "#0f172a",
		tooltipRow: "#334155",
		tooltipShadow: "0 8px 24px rgba(15,23,42,0.12)",
		cellStroke: "#f1f5f9",
	};
}
