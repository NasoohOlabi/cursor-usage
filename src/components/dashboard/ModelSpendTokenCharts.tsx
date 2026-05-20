import { useMemo } from "react";
import {
	CartesianGrid,
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useTheme } from "../ThemeContext";
import { ClientChartMount } from "./ClientChartMount";
import { getChartTheme } from "./chartTheme";
import {
	DAILY_STACK_CHART_HEIGHT_PX,
	DAILY_STACK_SYNC_ID,
	DAILY_STACK_Y_AXIS_WIDTH,
	dailyStackChartMargin,
	dailyStackMarginsBottom,
	dailyStackMarginsMiddle,
	dailyStackPaneTitleClass,
	dailyStackTooltipProps,
	dailyStackXAxisProps,
	DAILY_STACK_X_AXIS_RESERVE_PX,
	dailyStackYAxisTick,
	pickXAxisTicks,
} from "./chartLayout";
import { ModelTimeseriesSeries, TimeseriesData } from "./types";
import { COLORS } from "./utils";

interface ModelSpendTokenChartsProps {
	timeseries: TimeseriesData[];
	modelSeries: ModelTimeseriesSeries[];
	/** When true, omit outer card chrome (parent supplies one border/padding). */
	embedded?: boolean;
	stackMode?: boolean;
	syncId?: string;
	xTicks?: string[];
	chartHeight?: number;
	yAxisWidth?: number;
	part?: "full" | "charts" | "legend";
}

const shortModelName = (name: string) => name.split("/").pop() || name;

const formatYAxisTokens = (value: number) => {
	if (value >= 1_000_000)
		return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
	if (value >= 1_000)
		return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
	return value.toString();
};

const formatCostAxis = (value: number) => {
	if (value >= 1) return `$${value.toFixed(1)}`;
	if (value >= 0.01) return `$${value.toFixed(2)}`;
	return `$${value.toFixed(3)}`;
};

type TooltipPayloadEntry = {
	name?: string;
	value?: number | string;
	color?: string;
	dataKey?: string | number;
};

function ModelLineTooltip({
	active,
	payload,
	label,
	variant,
}: {
	active?: boolean;
	payload?: TooltipPayloadEntry[];
	label?: unknown;
	variant: "cost" | "tokens";
}) {
	const { isDark } = useTheme();
	const t = useMemo(() => getChartTheme(isDark), [isDark]);

	if (!active || !payload?.length) return null;

	const rows = payload
		.map((p) => ({
			...p,
			num: Number(p.value ?? 0),
		}))
		.filter((p) => p.num !== 0 && !Number.isNaN(p.num))
		.sort((a, b) => b.num - a.num);

	const labelText = label != null ? String(label) : "";

	return (
		<div
			className="rounded-lg border px-3 py-2 text-sm shadow-lg"
			style={{
				backgroundColor: t.tooltipBg,
				border: `1px solid ${t.tooltipBorder}`,
				borderRadius: "8px",
				boxShadow: t.tooltipShadow,
			}}
		>
			{labelText ? (
				<p className="mb-2 border-b border-slate-200 pb-1.5 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
					{labelText}
				</p>
			) : null}
			{rows.length === 0 ? (
				<p className="text-xs text-slate-500 dark:text-slate-500">No non-zero values</p>
			) : (
				<ul className="max-h-[min(240px,40vh)] space-y-1.5 overflow-y-auto pr-1">
					{rows.map((it, i) => (
						<li
							key={`${String(it.dataKey ?? "")}-${i}`}
							className="flex items-center justify-between gap-4 text-xs"
						>
							<span className="flex min-w-0 items-center gap-2">
								<span
									className="h-2 w-2 shrink-0 rounded-full border border-slate-300 dark:border-slate-600"
									style={{ backgroundColor: it.color ?? "#64748b" }}
								/>
								<span
									className="truncate text-slate-700 dark:text-slate-300"
									title={it.name}
								>
									{it.name}
								</span>
							</span>
							<span className="shrink-0 font-mono tabular-nums text-slate-900 dark:text-slate-100">
								{variant === "cost"
									? `$${it.num.toFixed(4)}`
									: it.num.toLocaleString()}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export const ModelSpendTokenCharts = ({
	timeseries,
	modelSeries,
	embedded = false,
	stackMode = false,
	syncId = DAILY_STACK_SYNC_ID,
	xTicks: xTicksProp,
	chartHeight = DAILY_STACK_CHART_HEIGHT_PX,
	yAxisWidth = DAILY_STACK_Y_AXIS_WIDTH,
	part = "full",
}: ModelSpendTokenChartsProps) => {
	const { isDark } = useTheme();
	const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);

	const xTicks = useMemo(
		() => xTicksProp ?? pickXAxisTicks(timeseries.map((d) => d.name)),
		[timeseries, xTicksProp],
	);

	if (!modelSeries.length || !timeseries.length) return null;

	const marginTopChart = stackMode
		? dailyStackChartMargin
		: dailyStackMarginsMiddle;
	const marginBottomChart = stackMode
		? dailyStackChartMargin
		: dailyStackMarginsBottom;

	const xAxisTickProps = {
		fill: chartTheme.tickFill,
		fontSize: 10,
	} as const;

	const shellClass =
		embedded || stackMode
			? "w-full"
			: "w-full rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700";

	const yAxisTick = {
		fill: chartTheme.tickFill,
		...dailyStackYAxisTick,
	};

	const showCharts = part === "full" || part === "charts";
	const showLegend = part === "full" || part === "legend";

	if (part === "legend") {
		return (
			<div>
				<span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
					Models
				</span>
				<ul className="mt-1.5 space-y-1 overflow-y-auto pr-1 text-xs">
					{modelSeries.map((series, index) => {
						const color = COLORS[index % COLORS.length];
						const label = shortModelName(series.name);
						return (
							<li
								key={series.costKey}
								className="flex min-w-0 items-center gap-2"
							>
								<span
									className="h-2 w-2 shrink-0 rounded-full border border-slate-300 dark:border-slate-600"
									style={{ backgroundColor: color }}
								/>
								<span
									className="min-w-0 truncate text-slate-700 dark:text-slate-300"
									title={series.name}
								>
									{label}
								</span>
							</li>
						);
					})}
				</ul>
			</div>
		);
	}

	return (
		<div className={shellClass}>
			<div
				className={
					part === "full"
						? "flex flex-col gap-2 min-[520px]:flex-row min-[520px]:items-stretch min-[520px]:gap-3"
						: "flex flex-col gap-2"
				}
			>
				{showCharts && (
				<div className="min-w-0 flex-1 flex flex-col gap-2">
					<div className="w-full min-w-0">
						<h3 className={dailyStackPaneTitleClass}>Spending by model</h3>
						<div
							className="w-full min-w-0 shrink-0 overflow-visible"
							style={{ height: chartHeight }}
						>
							<ClientChartMount className="h-full w-full min-w-0 overflow-visible">
								<ResponsiveContainer width="100%" height="100%" minWidth={0}>
									<AreaChart
										syncId={syncId}
										data={timeseries}
										margin={marginTopChart}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke={chartTheme.gridStroke}
										/>
										<XAxis
											dataKey="name"
											hide
											ticks={xTicks}
											stroke={chartTheme.axisStroke}
											tick={xAxisTickProps}
											{...dailyStackXAxisProps}
										/>
										<YAxis
											width={yAxisWidth}
											stroke={chartTheme.axisStroke}
											tick={yAxisTick}
											tickFormatter={formatCostAxis}
										/>
										<Tooltip
											{...(stackMode ? dailyStackTooltipProps : {})}
											content={(props) => (
												<ModelLineTooltip
													active={props.active}
													payload={props.payload as TooltipPayloadEntry[]}
													label={props.label}
													variant="cost"
												/>
											)}
										/>
										{modelSeries.map((series, index) => (
											<Area
												key={series.costKey}
												type="monotone"
												dataKey={series.costKey}
												name={shortModelName(series.name)}
												stroke={COLORS[index % COLORS.length]}
												fill={COLORS[index % COLORS.length]}
												fillOpacity={0.72}
												stackId="cost"
												strokeWidth={2}
												dot={false}
												activeDot={{ r: 4 }}
											/>
										))}
									</AreaChart>
								</ResponsiveContainer>
							</ClientChartMount>
						</div>
					</div>

					<div className="w-full min-w-0">
						<h3 className={dailyStackPaneTitleClass}>Token use by model</h3>
						<div
							className="w-full min-w-0 shrink-0 overflow-visible"
							style={{ height: chartHeight }}
						>
							<ClientChartMount className="h-full w-full min-w-0 overflow-visible">
								<ResponsiveContainer width="100%" height="100%" minWidth={0}>
									<AreaChart
										syncId={syncId}
										data={timeseries}
										margin={marginBottomChart}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke={chartTheme.gridStroke}
										/>
										<XAxis
											dataKey="name"
											stroke={chartTheme.axisStroke}
											tick={xAxisTickProps}
											angle={stackMode ? -45 : -40}
											textAnchor="end"
											height={
												stackMode ? DAILY_STACK_X_AXIS_RESERVE_PX : 60
											}
											ticks={xTicks}
											{...dailyStackXAxisProps}
										/>
										<YAxis
											width={yAxisWidth}
											stroke={chartTheme.axisStroke}
											tick={yAxisTick}
											tickFormatter={formatYAxisTokens}
										/>
										<Tooltip
											{...(stackMode ? dailyStackTooltipProps : {})}
											content={(props) => (
												<ModelLineTooltip
													active={props.active}
													payload={props.payload as TooltipPayloadEntry[]}
													label={props.label}
													variant="tokens"
												/>
											)}
										/>
										{modelSeries.map((series, index) => (
											<Area
												key={series.tokensKey}
												type="monotone"
												dataKey={series.tokensKey}
												name={shortModelName(series.name)}
												stroke={COLORS[index % COLORS.length]}
												fill={COLORS[index % COLORS.length]}
												fillOpacity={0.72}
												stackId="tokens"
												strokeWidth={2}
												dot={false}
												activeDot={{ r: 4 }}
											/>
										))}
									</AreaChart>
								</ResponsiveContainer>
							</ClientChartMount>
						</div>
					</div>
				</div>
				)}

				{part === "full" && showLegend && (
				<div className="shrink-0 border-t border-slate-200/80 pt-2 min-[520px]:w-48 min-[520px]:border-l min-[520px]:border-t-0 min-[520px]:pl-3 min-[520px]:pt-0 dark:border-slate-800">
					<span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
						Models
					</span>
					<ul
						className="mt-1.5 max-h-[min(460px,70vh)] space-y-1 overflow-y-auto pr-1 text-xs"
					>
						{modelSeries.map((series, index) => {
							const color = COLORS[index % COLORS.length];
							const label = shortModelName(series.name);
							return (
								<li key={series.costKey} className="flex min-w-0 items-center gap-2">
									<span
										className="h-2 w-2 shrink-0 rounded-full border border-slate-300 dark:border-slate-600"
										style={{ backgroundColor: color }}
									/>
									<span
										className="min-w-0 truncate text-slate-700 dark:text-slate-300"
										title={series.name}
									>
										{label}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
				)}
			</div>
		</div>
	);
};
