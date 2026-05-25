import { useMemo } from "react";
import { BillingCycleReferenceLines } from "./BillingCycleReferenceLines";
import { ClientChartMount } from "./ClientChartMount";
import { getChartTheme } from "./chartTheme";
import {
	DAILY_STACK_CHART_HEIGHT_PX,
	DAILY_STACK_SYNC_ID,
	DAILY_STACK_Y_AXIS_WIDTH,
	dailyStackChartMargin,
	dailyStackPaneTitleClass,
	dailyStackTooltipProps,
	dailyStackXAxisProps,
	dailyStackYAxisTick,
	pickXAxisTicks,
} from "./chartLayout";
import type { TimeseriesData } from "./types";
import { useTheme } from "../ThemeContext";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface AverageTokenPriceChartProps {
	timeseries: TimeseriesData[];
	periodAverage?: number;
	embedded?: boolean;
	stackMode?: boolean;
	syncId?: string;
	xTicks?: string[];
	chartHeight?: number;
	yAxisWidth?: number;
}

const formatPrice = (value: number) => `$${value.toFixed(2)}`;

type PercentileKey = "p50PricePer1M" | "p90PricePer1M" | "p99PricePer1M";

const PERCENTILE_PANES: {
	percentile: 50 | 90 | 99;
	dataKey: PercentileKey;
	color: string;
	activeColor: string;
}[] = [
	{
		percentile: 50,
		dataKey: "p50PricePer1M",
		color: "#f59e0b",
		activeColor: "#fbbf24",
	},
	{
		percentile: 90,
		dataKey: "p90PricePer1M",
		color: "#f97316",
		activeColor: "#fb923c",
	},
	{
		percentile: 99,
		dataKey: "p99PricePer1M",
		color: "#ef4444",
		activeColor: "#f87171",
	},
];

type PriceChartPoint = {
	name: string;
	pricePer1M: number | null;
	pricedCost: number;
	totalTokens: number;
};

const buildPercentileSeries = (
	timeseries: TimeseriesData[],
	dataKey: PercentileKey,
): PriceChartPoint[] =>
	timeseries.map((d) => ({
		name: d.name,
		pricePer1M: d[dataKey],
		pricedCost: d.pricedCost,
		totalTokens: d.totalTokens,
	}));

function PriceTooltip({
	active,
	payload,
	label,
	percentile,
}: {
	active?: boolean;
	payload?: { payload: PriceChartPoint }[];
	label?: string;
	percentile: number;
}) {
	if (!active || !payload?.[0]) return null;
	const point = payload[0].payload;
	return (
		<div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
			<p className="mb-1.5 font-semibold text-slate-900 dark:text-slate-100">
				{label}
			</p>
			<p className="tabular-nums text-slate-700 dark:text-slate-300">
				P{percentile}:{" "}
				{point.pricePer1M != null ? formatPrice(point.pricePer1M) : "—"} / 1M
			</p>
			<p className="mt-1 tabular-nums text-slate-500 dark:text-slate-400">
				{point.totalTokens.toLocaleString()} tokens ·{" "}
				{formatPrice(point.pricedCost)} metered
			</p>
		</div>
	);
}

function PercentilePricePane({
	percentile,
	dataKey,
	color,
	activeColor,
	timeseries,
	periodAverage,
	stackMode,
	syncId,
	xTicks,
	chartHeight,
	yAxisWidth,
	chartTheme,
}: {
	percentile: 50 | 90 | 99;
	dataKey: PercentileKey;
	color: string;
	activeColor: string;
	timeseries: TimeseriesData[];
	periodAverage?: number;
	stackMode: boolean;
	syncId: string;
	xTicks: string[];
	chartHeight: number;
	yAxisWidth: number;
	chartTheme: ReturnType<typeof getChartTheme>;
}) {
	const chartData = useMemo(
		() => buildPercentileSeries(timeseries, dataKey),
		[timeseries, dataKey],
	);

	const yDomain = useMemo(() => {
		const priced = chartData.filter(
			(d): d is typeof d & { pricePer1M: number } => d.pricePer1M != null,
		);
		if (priced.length === 0) return [0, 1] as [number, number];
		const values = priced.map((d) => d.pricePer1M);
		if (periodAverage != null && periodAverage > 0) values.push(periodAverage);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const pad = Math.max(0.05, (max - min) * 0.12);
		return [Math.max(0, min - pad), max + pad] as [number, number];
	}, [chartData, periodAverage]);

	const hasPricedDay = chartData.some((d) => d.pricePer1M != null);
	if (!hasPricedDay) return null;

	return (
		<div className="w-full">
			{stackMode && (
				<h3 className={dailyStackPaneTitleClass}>
					Token price P{percentile}
				</h3>
			)}
			<div
				className="w-full min-w-0 shrink-0 overflow-visible"
				style={{ height: chartHeight }}
			>
				<ClientChartMount className="h-full w-full min-w-0 overflow-visible">
					<ResponsiveContainer width="100%" height="100%" minWidth={0}>
						<LineChart
							syncId={syncId}
							data={chartData}
							margin={dailyStackChartMargin}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke={chartTheme.gridStroke}
								vertical={false}
							/>
							<BillingCycleReferenceLines
								names={chartData.map((d) => d.name)}
								stroke={chartTheme.axisStroke}
							/>
							<XAxis
								dataKey="name"
								hide={stackMode}
								ticks={xTicks}
								stroke={chartTheme.axisStroke}
								tick={{ fill: chartTheme.tickFill, fontSize: 11 }}
								tickLine={false}
								axisLine={{ stroke: chartTheme.axisStroke }}
								{...dailyStackXAxisProps}
							/>
							<YAxis
								domain={yDomain}
								width={yAxisWidth}
								stroke={chartTheme.axisStroke}
								tick={{
									fill: chartTheme.tickFill,
									...dailyStackYAxisTick,
								}}
								tickLine={false}
								axisLine={false}
								tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
							/>
							<Tooltip
								{...(stackMode ? dailyStackTooltipProps : {})}
								content={<PriceTooltip percentile={percentile} />}
							/>
							{periodAverage != null && periodAverage > 0 && (
								<ReferenceLine
									y={periodAverage}
									stroke="#94a3b8"
									strokeDasharray="6 4"
								/>
							)}
							<Line
								type="monotone"
								dataKey="pricePer1M"
								stroke={color}
								strokeWidth={2.5}
								connectNulls
								dot={{ r: 3, fill: color, strokeWidth: 0 }}
								activeDot={{
									r: 5,
									fill: activeColor,
									stroke: color,
									strokeWidth: 2,
								}}
							/>
						</LineChart>
					</ResponsiveContainer>
				</ClientChartMount>
			</div>
		</div>
	);
}

export const AverageTokenPriceChart = ({
	timeseries,
	periodAverage,
	embedded = false,
	stackMode = false,
	syncId = DAILY_STACK_SYNC_ID,
	xTicks: xTicksProp,
	chartHeight = DAILY_STACK_CHART_HEIGHT_PX,
	yAxisWidth = DAILY_STACK_Y_AXIS_WIDTH,
}: AverageTokenPriceChartProps) => {
	const { isDark } = useTheme();
	const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);

	const xTicks = useMemo(
		() => xTicksProp ?? pickXAxisTicks(timeseries.map((d) => d.name)),
		[timeseries, xTicksProp],
	);

	const hasAnyPricedDay = timeseries.some(
		(d) => d.p50PricePer1M != null || d.p90PricePer1M != null || d.p99PricePer1M != null,
	);
	if (!hasAnyPricedDay) return null;

	const shellClass =
		embedded || stackMode
			? "w-full flex flex-col gap-2"
			: "rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700 flex flex-col gap-4";

	return (
		<div className={shellClass}>
			{PERCENTILE_PANES.map((pane, index) => (
				<div key={pane.dataKey} className="w-full">
					{index > 0 && stackMode && (
						<div
							className="mb-2 border-t border-slate-200/80 dark:border-slate-800"
							aria-hidden
						/>
					)}
					<PercentilePricePane
						{...pane}
						timeseries={timeseries}
						periodAverage={periodAverage}
						stackMode={stackMode}
						syncId={syncId}
						xTicks={xTicks}
						chartHeight={chartHeight}
						yAxisWidth={yAxisWidth}
						chartTheme={chartTheme}
					/>
				</div>
			))}
		</div>
	);
};
