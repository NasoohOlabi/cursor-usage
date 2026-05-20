import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { getChartTheme } from "./chartTheme";
import {
	CartesianGrid,
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ClientChartMount } from "./ClientChartMount";
import {
	DAILY_STACK_CHART_HEIGHT_PX,
	DAILY_STACK_SYNC_ID,
	DAILY_STACK_Y_AXIS_WIDTH,
	dailyStackChartMargin,
	dailyStackMarginsMiddle,
	dailyStackPaneTitleClass,
	dailyStackTooltipProps,
	dailyStackXAxisProps,
	DAILY_STACK_X_AXIS_RESERVE_PX,
	dailyStackYAxisTick,
	pickXAxisTicks,
} from "./chartLayout";
import { COLORS } from "./utils";
import { TimeseriesData, TimeseriesSeriesMeta } from "./types";

interface UsageTrendsChartProps {
	timeseries: TimeseriesData[];
	seriesMeta: TimeseriesSeriesMeta[];
	/** When true, omit outer card chrome (parent supplies one border/padding). */
	embedded?: boolean;
	stackMode?: boolean;
	syncId?: string;
	xTicks?: string[];
	chartHeight?: number;
	yAxisWidth?: number;
	/** Split layout for aligned daily stack (header / charts / legend). */
	part?: "full" | "header" | "charts" | "legend";
	hiddenKeys?: string[];
	onHiddenKeysChange?: (keys: string[]) => void;
	viewMode?: "totals" | "breakdown";
	onViewModeChange?: (mode: "totals" | "breakdown") => void;
}

const formatYAxis = (value: number) => {
	if (value >= 1_000_000)
		return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
	if (value >= 1_000)
		return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
	return value.toString();
};

const formatCurrency = (value: number) => {
	return `$${value.toFixed(2)}`;
};

type LegendItem = {
	key: string;
	label: string;
	color: string;
	metric: string;
};

export const UsageTrendsChart = ({
	timeseries,
	seriesMeta,
	embedded = false,
	stackMode = false,
	syncId = DAILY_STACK_SYNC_ID,
	xTicks: xTicksProp,
	chartHeight = DAILY_STACK_CHART_HEIGHT_PX,
	yAxisWidth = DAILY_STACK_Y_AXIS_WIDTH,
	part = "full",
	hiddenKeys: hiddenKeysProp,
	onHiddenKeysChange,
	viewMode: viewModeProp,
	onViewModeChange,
}: UsageTrendsChartProps) => {
	const { isDark } = useTheme();
	const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);
	const [hiddenKeysInternal, setHiddenKeysInternal] = useState<string[]>([]);
	const [viewModeInternal, setViewModeInternal] = useState<
		"totals" | "breakdown"
	>("totals");

	const hiddenKeys = hiddenKeysProp ?? hiddenKeysInternal;
	const setHiddenKeys = onHiddenKeysChange ?? setHiddenKeysInternal;
	const viewMode = viewModeProp ?? viewModeInternal;
	const setViewMode = onViewModeChange ?? setViewModeInternal;

	const xTicks = useMemo(
		() => xTicksProp ?? pickXAxisTicks(timeseries.map((d) => d.name)),
		[timeseries, xTicksProp],
	);

	const baseSeries = useMemo(
		() => [
			{
				key: "totalTokens",
				label: "Total Tokens",
				metric: "tokens",
				color: "#8b5cf6",
				strokeWidth: 3,
				strokeDasharray: "0",
			},
			{
				key: "inputWithCacheWrite",
				label: "Input (w/ Cache Write)",
				metric: "tokens",
				color: "#38bdf8",
				strokeWidth: 2,
				strokeDasharray: "6 4",
			},
			{
				key: "outputTokens",
				label: "Output Tokens",
				metric: "tokens",
				color: "#22d3ee",
				strokeWidth: 2,
				strokeDasharray: "6 4",
			},
			{
				key: "cost",
				label: "Daily Cost ($)",
				metric: "cost",
				color: "#f43f5e",
				strokeWidth: 3,
				strokeDasharray: "0",
			},
		],
		[]
	);

	const dynamicSeries = useMemo(() => {
		const providerColors = new Map<string, string>();
		const userColors = new Map<string, string>();
		let providerIndex = 0;
		let userIndex = 0;

		return seriesMeta.map((series) => {
			const baseLabel = series.label.replace(/ (Tokens|Cost)$/, "");
			if (series.kind === "provider") {
				if (!providerColors.has(baseLabel)) {
					providerColors.set(
						baseLabel,
						COLORS[providerIndex % COLORS.length]
					);
					providerIndex += 1;
				}
				const color = providerColors.get(baseLabel) || COLORS[0];
				return {
					...series,
					color,
				};
			}
			if (!userColors.has(baseLabel)) {
				userColors.set(baseLabel, COLORS[(userIndex + 3) % COLORS.length]);
				userIndex += 1;
			}
			const color = userColors.get(baseLabel) || COLORS[0];
			return {
				...series,
				color,
			};
		});
	}, [seriesMeta]);

	const dynamicTokenSeries = useMemo(
		() => dynamicSeries.filter((s) => s.metric !== "cost"),
		[dynamicSeries]
	);
	const dynamicCostSeries = useMemo(
		() => dynamicSeries.filter((s) => s.metric === "cost"),
		[dynamicSeries]
	);

	const legendItems = useMemo(
		() => [
			...baseSeries.map((series) => ({
				key: series.key,
				label: series.label,
				color: series.color,
				metric: series.metric,
			})),
			...dynamicSeries.map((series) => ({
				key: series.key,
				label: series.label,
				color: series.color,
				metric: series.metric,
			})),
		],
		[baseSeries, dynamicSeries]
	);

	const isTotalsMode = viewMode === "totals";

	const visibleLegendItems = useMemo(() => {
		if (isTotalsMode) {
			return legendItems.filter(
				(item) => item.key === "totalTokens" || item.key === "cost"
			);
		}
		return legendItems.filter(
			(item) => item.key !== "totalTokens" && item.key !== "cost"
		);
	}, [isTotalsMode, legendItems]);

	const groupedLegendItems = useMemo(() => {
		const tokens = visibleLegendItems.filter((item) => item.metric === "tokens");
		const cost = visibleLegendItems.filter((item) => item.metric === "cost");
		return { tokens, cost };
	}, [visibleLegendItems]);

	const isSeriesVisible = (key: string) => {
		const isTotalSeries = key === "totalTokens" || key === "cost";
		if (isTotalsMode && !isTotalSeries) return false;
		if (!isTotalsMode && isTotalSeries) return false;
		return !hiddenKeys.includes(key);
	};

	const toggleSeries = (key: string) => {
		const next = hiddenKeys.includes(key)
			? hiddenKeys.filter((item) => item !== key)
			: [...hiddenKeys, key];
		setHiddenKeys(next);
	};

	const renderLegendButtons = (items: LegendItem[], title: string) => (
		<div className="flex flex-col gap-2">
			<span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-500">
				{title}
			</span>
			<div className="flex flex-col gap-1.5">
				{items.map((item) => {
					const isHidden = hiddenKeys.includes(item.key);
					return (
						<button
							key={item.key}
							type="button"
							onClick={() => toggleSeries(item.key)}
							className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-left text-xs transition-colors ${
								isHidden
									? "border-slate-200 text-slate-500 bg-slate-100/80 dark:border-slate-800 dark:text-slate-500 dark:bg-slate-900/50"
									: "border-slate-200 text-slate-800 hover:border-slate-300 bg-white/80 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:bg-slate-800/50"
							}`}
						>
							<span
								className="h-1.5 w-1.5 shrink-0 rounded-full"
								style={{ backgroundColor: item.color }}
							/>
							<span className={`min-w-0 truncate ${isHidden ? "line-through" : ""}`}>
								{item.label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);

	const marginShared = stackMode
		? dailyStackChartMargin
		: dailyStackMarginsMiddle;

	const tooltipEscape = stackMode ? dailyStackTooltipProps : {};

	const tokenTooltip = (
		<Tooltip
			{...tooltipEscape}
			contentStyle={{
				backgroundColor: chartTheme.tooltipBg,
				border: `1px solid ${chartTheme.tooltipBorder}`,
				borderRadius: "8px",
				boxShadow: chartTheme.tooltipShadow,
			}}
			itemStyle={{ color: chartTheme.tooltipRow }}
			labelStyle={{ color: chartTheme.tooltipLabel }}
			formatter={(value) =>
				value != null ? Number(value).toLocaleString() : ""
			}
		/>
	);

	const costTooltip = (
		<Tooltip
			{...tooltipEscape}
			contentStyle={{
				backgroundColor: chartTheme.tooltipBg,
				border: `1px solid ${chartTheme.tooltipBorder}`,
				borderRadius: "8px",
				boxShadow: chartTheme.tooltipShadow,
			}}
			itemStyle={{ color: chartTheme.tooltipRow }}
			labelStyle={{ color: chartTheme.tooltipLabel }}
			formatter={(value) =>
				value != null ? formatCurrency(Number(value)) : ""
			}
		/>
	);

	const xAxisTickProps = {
		fill: chartTheme.tickFill,
		fontSize: 10,
	} as const;

	const shellClass =
		embedded || stackMode
			? "w-full"
			: "w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700";

	const yAxisTick = {
		fill: chartTheme.tickFill,
		...dailyStackYAxisTick,
	};

	const showHeader = part === "full" || part === "header";
	const showCharts = part === "full" || part === "charts";
	const showLegend = part === "full" || part === "legend";

	if (part === "legend") {
		return (
			<div className="space-y-4">
				{renderLegendButtons(groupedLegendItems.tokens, "Tokens")}
				{renderLegendButtons(groupedLegendItems.cost, "Cost")}
			</div>
		);
	}

	return (
		<div className={shellClass}>
			{showHeader && (
			<div
				className={`flex items-center gap-3 ${part === "header" ? "mb-0" : "mb-6"}`}
			>
				<div className="p-1.5 bg-violet-500/10 rounded-md">
					<TrendingUp className="h-6 w-6 text-violet-500 dark:text-violet-400" />
				</div>
				<div className="flex-1">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						Usage Trends (Daily)
					</h2>
				</div>
				<div className="inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
					<button
						type="button"
						onClick={() => setViewMode("totals")}
						className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
							isTotalsMode
								? "bg-violet-500 text-white"
								: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
						}`}
					>
						Totals
					</button>
					<button
						type="button"
						onClick={() => setViewMode("breakdown")}
						className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
							!isTotalsMode
								? "bg-violet-500 text-white"
								: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
						}`}
					>
						Breakdown
					</button>
				</div>
			</div>
			)}

			{showCharts && (
			<div
				className={
					part === "full"
						? "flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-stretch min-[520px]:gap-4"
						: "flex flex-col gap-2"
				}
			>
				<div className="min-w-0 flex-1 flex flex-col gap-2">
					<div className="w-full min-w-0">
						<h3 className={dailyStackPaneTitleClass}>Tokens per day</h3>
						<div
							className="w-full min-w-0 shrink-0 overflow-visible"
							style={{ height: chartHeight }}
						>
							<ClientChartMount className="h-full w-full min-w-0 overflow-visible">
								<ResponsiveContainer width="100%" height="100%" minWidth={0}>
									<AreaChart
										syncId={syncId}
										data={timeseries}
										margin={marginShared}
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
											tickFormatter={formatYAxis}
										/>
										{tokenTooltip}
										<Area
											type="monotone"
											dataKey="totalTokens"
											name="Total Tokens"
											stroke={baseSeries[0].color}
											fill={baseSeries[0].color}
											fillOpacity={0.35}
											strokeWidth={baseSeries[0].strokeWidth}
											dot={false}
											activeDot={{ r: 6 }}
											hide={!isSeriesVisible("totalTokens")}
										/>
										<Area
											type="monotone"
											dataKey="inputWithCacheWrite"
											name="Input (w/ Cache Write)"
											stroke={baseSeries[1].color}
											fill={baseSeries[1].color}
											fillOpacity={0.65}
											strokeWidth={baseSeries[1].strokeWidth}
											stackId="tokens"
											dot={false}
											activeDot={{ r: 5 }}
											hide={!isSeriesVisible("inputWithCacheWrite")}
										/>
										<Area
											type="monotone"
											dataKey="outputTokens"
											name="Output Tokens"
											stroke={baseSeries[2].color}
											fill={baseSeries[2].color}
											fillOpacity={0.65}
											strokeWidth={baseSeries[2].strokeWidth}
											stackId="tokens"
											dot={false}
											activeDot={{ r: 5 }}
											hide={!isSeriesVisible("outputTokens")}
										/>
										{dynamicTokenSeries.map((series) => (
											<Area
												key={series.key}
												type="monotone"
												dataKey={series.key}
												name={series.label}
												stroke={series.color}
												fill={series.color}
												fillOpacity={0.65}
												strokeWidth={2}
												stackId="tokens"
												dot={false}
												activeDot={{ r: 4 }}
												hide={!isSeriesVisible(series.key)}
											/>
										))}
									</AreaChart>
								</ResponsiveContainer>
							</ClientChartMount>
						</div>
					</div>

					<div className="w-full min-w-0">
						<h3 className={dailyStackPaneTitleClass}>Cost per day</h3>
						<div
							className="w-full min-w-0 shrink-0 overflow-visible"
							style={{ height: chartHeight }}
						>
							<ClientChartMount className="h-full w-full min-w-0 overflow-visible">
								<ResponsiveContainer width="100%" height="100%" minWidth={0}>
									<AreaChart
										syncId={syncId}
										data={timeseries}
										margin={marginShared}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke={chartTheme.gridStroke}
										/>
										<XAxis
											dataKey="name"
											hide={stackMode}
											stroke={chartTheme.axisStroke}
											tick={xAxisTickProps}
											angle={-45}
											textAnchor="end"
											height={
												stackMode ? DAILY_STACK_X_AXIS_RESERVE_PX : 72
											}
											ticks={xTicks}
											{...dailyStackXAxisProps}
										/>
										<YAxis
											width={yAxisWidth}
											stroke={chartTheme.axisStroke}
											tick={yAxisTick}
											tickFormatter={formatCurrency}
										/>
										{costTooltip}
										<Area
											type="monotone"
											dataKey="cost"
											name="Daily Cost ($)"
											stroke={baseSeries[3].color}
											fill={baseSeries[3].color}
											fillOpacity={0.35}
											strokeWidth={baseSeries[3].strokeWidth}
											dot={false}
											activeDot={{ r: 6 }}
											hide={!isSeriesVisible("cost")}
										/>
										{dynamicCostSeries.map((series) => (
											<Area
												key={series.key}
												type="monotone"
												dataKey={series.key}
												name={series.label}
												stroke={series.color}
												fill={series.color}
												fillOpacity={0.65}
												strokeWidth={2}
												stackId="cost"
												dot={false}
												activeDot={{ r: 4 }}
												hide={!isSeriesVisible(series.key)}
											/>
										))}
									</AreaChart>
								</ResponsiveContainer>
							</ClientChartMount>
						</div>
					</div>
				</div>

				{part === "full" && showLegend && (
				<div className="shrink-0 border-t border-slate-200/80 pt-3 min-[520px]:w-52 min-[520px]:border-l min-[520px]:border-t-0 min-[520px]:pl-4 min-[520px]:pt-0 dark:border-slate-800">
					<div
						className="space-y-4 overflow-y-auto pr-1"
						style={{
							maxHeight: `min(${chartHeight * 2}px, 70vh)`,
						}}
					>
						{renderLegendButtons(groupedLegendItems.tokens, "Tokens")}
						{renderLegendButtons(groupedLegendItems.cost, "Cost")}
					</div>
				</div>
				)}
			</div>
			)}
		</div>
	);
};
