import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { getChartTheme } from "./chartTheme";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ClientChartMount } from "./ClientChartMount";
import { COLORS } from "./utils";
import { TimeseriesData, TimeseriesSeriesMeta } from "./types";

interface UsageTrendsChartProps {
	timeseries: TimeseriesData[];
	seriesMeta: TimeseriesSeriesMeta[];
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

export const UsageTrendsChart = ({
	timeseries,
	seriesMeta,
}: UsageTrendsChartProps) => {
	const { isDark } = useTheme();
	const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);
	const [hiddenKeys, setHiddenKeys] = useState<string[]>([
		"inputWithCacheWrite",
		"outputTokens",
	]);

	const processedSeriesKeys = useRef<Set<string>>(new Set());

	useEffect(() => {
		const newHiddenKeys: string[] = [];
		seriesMeta.forEach((series) => {
			if (!processedSeriesKeys.current.has(series.key)) {
				newHiddenKeys.push(series.key);
				processedSeriesKeys.current.add(series.key);
			}
		});

		if (newHiddenKeys.length > 0) {
			setHiddenKeys((prev) => [...prev, ...newHiddenKeys]);
		}
	}, [seriesMeta]);

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
					strokeDasharray: series.metric === "cost" ? "5 4" : "3 3",
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
				strokeDasharray: series.metric === "cost" ? "5 4" : "3 3",
			};
		});
	}, [seriesMeta]);

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

	const groupedLegendItems = useMemo(() => {
		const tokens = legendItems.filter((item) => item.metric === "tokens");
		const cost = legendItems.filter((item) => item.metric === "cost");
		return { tokens, cost };
	}, [legendItems]);

	const toggleSeries = (key: string) => {
		setHiddenKeys((prev) =>
			prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
		);
	};

	const renderLegend = () => {
		const colorClassMap: Record<string, string> = {
			"#8b5cf6": "bg-[#8b5cf6]",
			"#38bdf8": "bg-[#38bdf8]",
			"#22d3ee": "bg-[#22d3ee]",
			"#f43f5e": "bg-[#f43f5e]",
			"#3b82f6": "bg-[#3b82f6]",
			"#ec4899": "bg-[#ec4899]",
			"#f97316": "bg-[#f97316]",
			"#eab308": "bg-[#eab308]",
		};

		const renderGroup = (items: typeof legendItems, title: string) => (
			<div className="flex flex-col gap-2">
				<span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-500">
					{title}
				</span>
				<div className="flex flex-wrap gap-2">
					{items.map((item) => {
						const isHidden = hiddenKeys.includes(item.key);
						const colorClass =
							colorClassMap[item.color] || "bg-slate-500";
						return (
							<button
								key={item.key}
								type="button"
								onClick={() => toggleSeries(item.key)}
								className={`flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors ${
									isHidden
										? "border-slate-200 text-slate-500 bg-slate-100/80 dark:border-slate-800 dark:text-slate-500 dark:bg-slate-900/50"
										: "border-slate-200 text-slate-800 hover:border-slate-300 bg-white/80 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:bg-slate-800/50"
								}`}
							>
								<span
									className={`h-1.5 w-1.5 rounded-full ${colorClass}`}
								/>
								<span
									className={
										isHidden ? "line-through" : undefined
									}
								>
									{item.label}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		);

		return (
			<div className="flex flex-col gap-4 mt-4">
				{renderGroup(groupedLegendItems.tokens, "Tokens")}
				{renderGroup(groupedLegendItems.cost, "Cost")}
			</div>
		);
	};

	return (
		<div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 bg-violet-500/10 rounded-lg">
					<TrendingUp className="h-6 w-6 text-violet-500 dark:text-violet-400" />
				</div>
				<h2 className="text-xl font-bold text-slate-900 dark:text-white">
					Usage Trends (Daily)
				</h2>
			</div>
			<div className="h-[450px] w-full min-w-0">
				<ClientChartMount className="h-full w-full min-w-0">
					<ResponsiveContainer width="100%" height="100%" minWidth={0}>
						<LineChart
						data={timeseries}
						margin={{ bottom: 60, left: 20, right: 20 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke={chartTheme.gridStroke}
						/>
						<XAxis
							dataKey="name"
							stroke={chartTheme.axisStroke}
							tick={{ fill: chartTheme.tickFill, fontSize: 10 }}
							angle={-45}
							textAnchor="end"
							height={100}
						/>
						<YAxis
							yAxisId="left"
							stroke={chartTheme.axisStroke}
							tick={{ fill: chartTheme.tickFill, fontSize: 12 }}
							tickFormatter={formatYAxis}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							stroke={chartTheme.axisStroke}
							tick={{ fill: chartTheme.tickFill, fontSize: 12 }}
							tickFormatter={formatCurrency}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: chartTheme.tooltipBg,
								border: `1px solid ${chartTheme.tooltipBorder}`,
								borderRadius: "8px",
								boxShadow: chartTheme.tooltipShadow,
							}}
							itemStyle={{ color: chartTheme.tooltipRow }}
							labelStyle={{ color: chartTheme.tooltipLabel }}
							formatter={(value: any, name: any) => {
								const val = Number(value);
								if (String(name || "").toLowerCase().includes("cost"))
									return formatCurrency(val);
								return val.toLocaleString();
							}}
						/>
						<Legend content={renderLegend} />
						<Line
							yAxisId="left"
							type="monotone"
							dataKey="totalTokens"
							name="Total Tokens"
							stroke={baseSeries[0].color}
							strokeWidth={baseSeries[0].strokeWidth}
							dot={false}
							activeDot={{ r: 6 }}
							hide={hiddenKeys.includes("totalTokens")}
						/>
						<Line
							yAxisId="left"
							type="monotone"
							dataKey="inputWithCacheWrite"
							name="Input (w/ Cache Write)"
							stroke={baseSeries[1].color}
							strokeWidth={baseSeries[1].strokeWidth}
							strokeDasharray={baseSeries[1].strokeDasharray}
							dot={false}
							activeDot={{ r: 5 }}
							hide={hiddenKeys.includes("inputWithCacheWrite")}
						/>
						<Line
							yAxisId="left"
							type="monotone"
							dataKey="outputTokens"
							name="Output Tokens"
							stroke={baseSeries[2].color}
							strokeWidth={baseSeries[2].strokeWidth}
							strokeDasharray={baseSeries[2].strokeDasharray}
							dot={false}
							activeDot={{ r: 5 }}
							hide={hiddenKeys.includes("outputTokens")}
						/>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="cost"
							name="Daily Cost ($)"
							stroke={baseSeries[3].color}
							strokeWidth={baseSeries[3].strokeWidth}
							dot={false}
							activeDot={{ r: 6 }}
							hide={hiddenKeys.includes("cost")}
						/>
						{dynamicSeries.map((series) => (
							<Line
								key={series.key}
								yAxisId={series.metric === "cost" ? "right" : "left"}
								type="monotone"
								dataKey={series.key}
								name={series.label}
								stroke={series.color}
								strokeWidth={2}
								strokeDasharray={series.strokeDasharray}
								dot={false}
								activeDot={{ r: 4 }}
								hide={hiddenKeys.includes(series.key)}
							/>
						))}
					</LineChart>
					</ResponsiveContainer>
				</ClientChartMount>
			</div>
		</div>
	);
};
