export const DAILY_STACK_SYNC_ID = "daily-usage-stack";
/** Outer height of every chart pane in the daily stack (plot + reserved axis band). */
export const DAILY_STACK_CHART_HEIGHT_PX = 140;
/** Bottom margin reserved on all panes so plot areas share the same height. */
export const DAILY_STACK_X_AXIS_RESERVE_PX = 40;
/** Fixed width reserved for Y-axis ticks so plot areas line up. */
export const DAILY_STACK_Y_AXIS_WIDTH = 68;
/** Right column width for legends (must match Tailwind w-52). */
export const DAILY_STACK_LEGEND_WIDTH_PX = 208;

export const dailyStackYAxisTick = {
	fontSize: 10,
	fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

export const dailyStackPaneTitleClass =
	"mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300";

export function dailyStackPlotMargin(bottom: number) {
	return {
		left: 0,
		right: 8,
		top: 8,
		bottom,
	} as const;
}

/** Same margins on every stacked chart — hidden X-axes still reserve the bottom band. */
export const dailyStackChartMargin = dailyStackPlotMargin(
	DAILY_STACK_X_AXIS_RESERVE_PX,
);

/** @deprecated Use dailyStackChartMargin for stacked charts. */
export const dailyStackMarginsMiddle = dailyStackPlotMargin(2);
/** @deprecated Use dailyStackChartMargin for stacked charts. */
export const dailyStackMarginsBottom = dailyStackPlotMargin(56);

/** Keeps categorical X positions consistent across synced charts. */
export const dailyStackXAxisProps = {
	type: "category" as const,
	padding: { left: 0, right: 0 },
};

/** Let tooltips extend outside the short chart panes without being clipped. */
export const dailyStackTooltipProps = {
	allowEscapeViewBox: { x: true, y: true },
	wrapperStyle: { zIndex: 60, outline: "none" },
} as const;

export function pickXAxisTicks(names: string[]): string[] {
	if (names.length === 0) return [];
	if (names.length <= 12) return names;
	const maxTicks = 10;
	const step = Math.max(1, Math.floor((names.length - 1) / (maxTicks - 1)));
	const out: string[] = [];
	for (let i = 0; i < names.length; i += step) {
		out.push(names[i]);
	}
	const last = names[names.length - 1];
	if (out[out.length - 1] !== last) out.push(last);
	return out;
}

