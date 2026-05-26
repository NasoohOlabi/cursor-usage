import { useCallback, useMemo, useState } from "react";
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

const PERCENTILE_SERIES: {
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

type CombinedPricePoint = {
	name: string;
	p50PricePer1M: number | null;
	p90PricePer1M: number | null;
	p99PricePer1M: number | null;
	pricedCost: number;
	totalTokens: number;
};

const buildCombinedSeries = (timeseries: TimeseriesData[]): CombinedPricePoint[] =>
	timeseries.map((d) => ({
		name: d.name,
		p50PricePer1M: d.p50PricePer1M,
		p90PricePer1M: d.p90PricePer1M,
		p99PricePer1M: d.p99PricePer1M,
		pricedCost: d.pricedCost,
		totalTokens: d.totalTokens,
	}));

function PercentileLegend({
	hidden,
	onToggle,
}: {
	hidden: ReadonlySet<PercentileKey>;
	onToggle: (key: PercentileKey) => void;
}) {
	return (
		<div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Percentiles">
			{PERCENTILE_SERIES.map(({ dataKey, percentile, color }) => {
				const isHidden = hidden.has(dataKey);
				return (
					<button
						key={dataKey}
						type="button"
						onClick={() => onToggle(dataKey)}
						className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${
							isHidden
								? "border-transparent text-slate-400 dark:text-slate-600"
								: "border-slate-200/80 text-slate-700 dark:border-slate-700 dark:text-slate-300"
						} hover:bg-slate-100 dark:hover:bg-slate-800`}
						aria-pressed={!isHidden}
					>
						<span
							className="h-2 w-2 shrink-0 rounded-full border border-slate-300/80 dark:border-slate-600"
							style={{
								backgroundColor: isHidden ? "transparent" : color,
								opacity: isHidden ? 0.35 : 1,
							}}
							aria-hidden
						/>
						P{percentile}
					</button>
				);
			})}
		</div>
	);
}

function CombinedPriceTooltip({
	active,
	payload,
	label,
	hidden,
}: {
	active?: boolean;
	payload?: { dataKey?: string; value?: number | null; payload: CombinedPricePoint }[];
	label?: string;
	hidden: ReadonlySet<PercentileKey>;
}) {
	if (!active || !payload?.length) return null;
	const point = payload[0].payload;
	const visible = PERCENTILE_SERIES.filter((s) => !hidden.has(s.dataKey));
	if (visible.length === 0) return null;

	return (
		<div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
			<p className="mb-1.5 font-semibold text-slate-900 dark:text-slate-100">{label}</p>
			<ul className="space-y-0.5">
				{visible.map(({ percentile, dataKey, color }) => {
					const value = point[dataKey];
					return (
						<li
							key={dataKey}
							className="flex items-center gap-2 tabular-nums text-slate-700 dark:text-slate-300"
						>
							<span
								className="h-1.5 w-1.5 shrink-0 rounded-full"
								style={{ backgroundColor: color }}
								aria-hidden
							/>
							P{percentile}:{" "}
							{value != null ? `${formatPrice(value)} / 1M` : "—"}
						</li>
					);
				})}
			</ul>
			<p className="mt-1.5 tabular-nums text-slate-500 dark:text-slate-400">
				{point.totalTokens.toLocaleString()} tokens · {formatPrice(point.pricedCost)}{" "}
				metered
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
	const [hidden, setHidden] = useState<Set<PercentileKey>>(() => new Set());

	const toggleSeries = useCallback((key: PercentileKey) => {
		setHidden((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	const xTicks = useMemo(
		() => xTicksProp ?? pickXAxisTicks(timeseries.map((d) => d.name)),
		[timeseries, xTicksProp],
	);

	const chartData = useMemo(() => buildCombinedSeries(timeseries), [timeseries]);

	const yDomain = useMemo(() => {
		const values: number[] = [];
		for (const point of chartData) {
			for (const { dataKey } of PERCENTILE_SERIES) {
				if (hidden.has(dataKey)) continue;
				const v = point[dataKey];
				if (v != null) values.push(v);
			}
		}
		if (periodAverage != null && periodAverage > 0) values.push(periodAverage);
		if (values.length === 0) return [0, 1] as [number, number];
		const min = Math.min(...values);
		const max = Math.max(...values);
		const pad = Math.max(0.05, (max - min) * 0.12);
		return [Math.max(0, min - pad), max + pad] as [number, number];
	}, [chartData, hidden, periodAverage]);

	const hasAnyPricedDay = timeseries.some(
		(d) => d.p50PricePer1M != null || d.p90PricePer1M != null || d.p99PricePer1M != null,
	);
	if (!hasAnyPricedDay) return null;

	const shellClass =
		embedded || stackMode
			? "w-full flex flex-col gap-2"
			: "rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700 flex flex-col gap-4";

	const visibleCount = PERCENTILE_SERIES.length - hidden.size;

	return (
		<div className={shellClass}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				{(stackMode || !embedded) && (
					<h3 className={dailyStackPaneTitleClass}>
						{stackMode ? "Token price" : "Average token price"}
					</h3>
				)}
				<PercentileLegend hidden={hidden} onToggle={toggleSeries} />
			</div>
			<div
				className="w-full min-w-0 shrink-0 overflow-visible"
				style={{ height: chartHeight }}
			>
				<ClientChartMount className="h-full w-full min-w-0 overflow-visible">
					<ResponsiveContainer width="100%" height="100%" minWidth={0}>
						<LineChart syncId={syncId} data={chartData} margin={dailyStackChartMargin}>
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
								content={
									<CombinedPriceTooltip hidden={hidden} />
								}
							/>
							{periodAverage != null && periodAverage > 0 && visibleCount > 0 && (
								<ReferenceLine
									y={periodAverage}
									stroke="#94a3b8"
									strokeDasharray="6 4"
								/>
							)}
							{PERCENTILE_SERIES.map(({ dataKey, percentile, color, activeColor }) => (
								<Line
									key={dataKey}
									type="monotone"
									dataKey={dataKey}
									name={`P${percentile}`}
									stroke={color}
									strokeWidth={2.5}
									connectNulls
									hide={hidden.has(dataKey)}
									dot={{ r: 3, fill: color, strokeWidth: 0 }}
									activeDot={{
										r: 5,
										fill: activeColor,
										stroke: color,
										strokeWidth: 2,
									}}
								/>
							))}
						</LineChart>
					</ResponsiveContainer>
				</ClientChartMount>
			</div>
		</div>
	);
};
