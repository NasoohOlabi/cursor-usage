import { Coins } from "lucide-react";
import { useMemo } from "react";
import { useTheme } from "../ThemeContext";
import { BillingCycleReferenceLines } from "./BillingCycleReferenceLines";
import { ClientChartMount } from "./ClientChartMount";
import { getChartTheme } from "./chartTheme";
import {
	DAILY_STACK_CHART_HEIGHT_PX,
	DAILY_STACK_SYNC_ID,
	DAILY_STACK_Y_AXIS_WIDTH,
	dailyStackChartMargin,
	dailyStackMarginsMiddle,
	dailyStackPaneTitleClass,
	dailyStackTooltipProps,
	dailyStackXAxisProps,
	dailyStackYAxisTick,
	pickXAxisTicks,
} from "./chartLayout";
import type { TimeseriesData } from "./types";
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
	/** Blended average for the filtered range (sum cost ÷ sum tokens). */
	periodAverage?: number;
	embedded?: boolean;
	stackMode?: boolean;
	syncId?: string;
	xTicks?: string[];
	chartHeight?: number;
	yAxisWidth?: number;
}

const formatPrice = (value: number) => `$${value.toFixed(2)}`;
const ROLLING_DAYS = 7;

type PriceChartPoint = {
	name: string;
	pricePer1M: number | null;
	dailyPricePer1M: number | null;
	cost: number;
	pricedCost: number;
	totalTokens: number;
};

const buildRollingPriceSeries = (
	timeseries: TimeseriesData[],
	windowDays: number,
): PriceChartPoint[] =>
	timeseries.map((d, index) => {
		const dailyPricePer1M =
			d.totalTokens > 0 ? (d.pricedCost / d.totalTokens) * 1_000_000 : null;
		const window = timeseries.slice(
			Math.max(0, index - windowDays + 1),
			index + 1,
		);
		const pricedCost = window.reduce((sum, row) => sum + row.pricedCost, 0);
		const totalTokens = window.reduce((sum, row) => sum + row.totalTokens, 0);
		const pricePer1M =
			totalTokens > 0 ? (pricedCost / totalTokens) * 1_000_000 : null;
		return {
			name: d.name,
			pricePer1M,
			dailyPricePer1M,
			cost: d.cost,
			pricedCost: d.pricedCost,
			totalTokens: d.totalTokens,
		};
	});

function PriceTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: { payload: PriceChartPoint }[];
	label?: string;
}) {
	if (!active || !payload?.[0]) return null;
	const point = payload[0].payload;
	return (
		<div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
			<p className="mb-1.5 font-semibold text-slate-900 dark:text-slate-100">
				{label}
			</p>
			<p className="tabular-nums text-slate-700 dark:text-slate-300">
				{ROLLING_DAYS}-day avg:{" "}
				{point.pricePer1M != null ? formatPrice(point.pricePer1M) : "—"} / 1M
			</p>
			<p className="tabular-nums text-slate-500 dark:text-slate-400">
				This day:{" "}
				{point.dailyPricePer1M != null
					? formatPrice(point.dailyPricePer1M)
					: "—"}{" "}
				/ 1M
			</p>
			<p className="mt-1 tabular-nums text-slate-500 dark:text-slate-400">
				{point.totalTokens.toLocaleString()} tokens ·{" "}
				{formatPrice(point.pricedCost)} metered
			</p>
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

	const chartData = useMemo(
		() => buildRollingPriceSeries(timeseries, ROLLING_DAYS),
		[timeseries],
	);

	const xTicks = useMemo(
		() => xTicksProp ?? pickXAxisTicks(chartData.map((d) => d.name)),
		[chartData, xTicksProp],
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

	const shellClass =
		embedded || stackMode
			? "w-full"
			: "rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700";

	return (
		<div className={shellClass}>
			{stackMode ? (
				<h3 className={dailyStackPaneTitleClass}>
					Avg token price ({ROLLING_DAYS}-day blend)
				</h3>
			) : (
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-start gap-3">
						<div className="shrink-0 rounded-lg bg-amber-500/10 p-2">
							<Coins className="h-6 w-6 text-amber-500 dark:text-amber-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-slate-900 dark:text-white">
								Average token price ({ROLLING_DAYS}-day blend)
							</h2>
							<p className="text-sm text-slate-700 dark:text-slate-300">
								Trailing {ROLLING_DAYS}-day sum of metered cost ÷ tokens ($/1M).
								Low-volume days (e.g. on-demand at $0.04/event) spike the
								single-day rate; the rolling line matches typical spend better.
							</p>
							{periodAverage != null && periodAverage > 0 && (
								<p className="mt-1 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
									Period average: {formatPrice(periodAverage)} / 1M tokens
								</p>
							)}
						</div>
					</div>
				</div>
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
							margin={
								stackMode ? dailyStackChartMargin : dailyStackMarginsMiddle
							}
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
								label={
									stackMode
										? undefined
										: {
												value: "$ / 1M tokens",
												angle: -90,
												position: "insideLeft",
												fill: chartTheme.axisLabelFill,
												fontSize: 11,
												dx: -4,
											}
								}
							/>
							<Tooltip
								{...(stackMode ? dailyStackTooltipProps : {})}
								content={<PriceTooltip />}
							/>
							{periodAverage != null && periodAverage > 0 && (
								<ReferenceLine
									y={periodAverage}
									stroke="#94a3b8"
									strokeDasharray="6 4"
									label={
										stackMode
											? undefined
											: {
													value: "Period avg",
													position: "insideTopRight",
													fill: chartTheme.axisLabelFill,
													fontSize: 10,
												}
									}
								/>
							)}
							<Line
								type="monotone"
								dataKey="pricePer1M"
								stroke="#f59e0b"
								strokeWidth={2.5}
								connectNulls
								dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
								activeDot={{
									r: 5,
									fill: "#fbbf24",
									stroke: "#f59e0b",
									strokeWidth: 2,
								}}
							/>
						</LineChart>
					</ResponsiveContainer>
				</ClientChartMount>
			</div>
		</div>
	);
};
