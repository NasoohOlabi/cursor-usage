import { useMemo } from "react";
import { DollarSign, LineChart as LineChartIcon } from "lucide-react";
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
import { useTheme } from "../ThemeContext";
import { ClientChartMount } from "./ClientChartMount";
import { getChartTheme } from "./chartTheme";
import { ModelTimeseriesSeries, TimeseriesData } from "./types";
import { COLORS } from "./utils";

interface ModelSpendTokenChartsProps {
	timeseries: TimeseriesData[];
	modelSeries: ModelTimeseriesSeries[];
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
				<ul className="max-h-[min(320px,50vh)] space-y-1.5 overflow-y-auto pr-1">
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
}: ModelSpendTokenChartsProps) => {
	const { isDark } = useTheme();
	const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);

	if (!modelSeries.length || !timeseries.length) return null;

	return (
		<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<div className="rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700">
				<div className="mb-2 flex items-center gap-3">
					<div className="p-2 bg-emerald-500/10 rounded-lg">
						<DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div>
						<h2 className="text-xl font-bold text-slate-900 dark:text-white">
							Spending by Model (daily)
						</h2>
						<p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
							Top {modelSeries.length} models by total spend in range
						</p>
					</div>
				</div>
				<div className="h-[380px] w-full min-w-0 mt-4">
					<ClientChartMount className="h-full w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<LineChart
								data={timeseries}
								margin={{ bottom: 56, left: 8, right: 8, top: 8 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke={chartTheme.gridStroke}
								/>
								<XAxis
									dataKey="name"
									stroke={chartTheme.axisStroke}
									tick={{ fill: chartTheme.tickFill, fontSize: 10 }}
									angle={-40}
									textAnchor="end"
									height={72}
									interval="preserveStartEnd"
								/>
								<YAxis
									stroke={chartTheme.axisStroke}
									tick={{ fill: chartTheme.tickFill, fontSize: 11 }}
									tickFormatter={formatCostAxis}
								/>
								<Tooltip
									content={(props) => (
										<ModelLineTooltip
											active={props.active}
											payload={props.payload as TooltipPayloadEntry[]}
											label={props.label}
											variant="cost"
										/>
									)}
								/>
								<Legend
									wrapperStyle={{ fontSize: 11 }}
									formatter={(value) => (
										<span className="text-slate-700 dark:text-slate-300">{value}</span>
									)}
								/>
								{modelSeries.map((series, index) => (
									<Line
										key={series.costKey}
										type="monotone"
										dataKey={series.costKey}
										name={shortModelName(series.name)}
										stroke={COLORS[index % COLORS.length]}
										strokeWidth={2}
										dot={{ r: 2 }}
										activeDot={{ r: 4 }}
									/>
								))}
							</LineChart>
						</ResponsiveContainer>
					</ClientChartMount>
				</div>
			</div>

			<div className="rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700">
				<div className="mb-2 flex items-center gap-3">
					<div className="p-2 bg-violet-500/10 rounded-lg">
						<LineChartIcon className="h-6 w-6 text-violet-500 dark:text-violet-400" />
					</div>
					<div>
						<h2 className="text-xl font-bold text-slate-900 dark:text-white">
							Token use by Model (daily)
						</h2>
						<p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
							Same models as spending chart
						</p>
					</div>
				</div>
				<div className="h-[380px] w-full min-w-0 mt-4">
					<ClientChartMount className="h-full w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<LineChart
								data={timeseries}
								margin={{ bottom: 56, left: 8, right: 8, top: 8 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke={chartTheme.gridStroke}
								/>
								<XAxis
									dataKey="name"
									stroke={chartTheme.axisStroke}
									tick={{ fill: chartTheme.tickFill, fontSize: 10 }}
									angle={-40}
									textAnchor="end"
									height={72}
									interval="preserveStartEnd"
								/>
								<YAxis
									stroke={chartTheme.axisStroke}
									tick={{ fill: chartTheme.tickFill, fontSize: 11 }}
									tickFormatter={formatYAxisTokens}
								/>
								<Tooltip
									content={(props) => (
										<ModelLineTooltip
											active={props.active}
											payload={props.payload as TooltipPayloadEntry[]}
											label={props.label}
											variant="tokens"
										/>
									)}
								/>
								<Legend
									wrapperStyle={{ fontSize: 11 }}
									formatter={(value) => (
										<span className="text-slate-700 dark:text-slate-300">{value}</span>
									)}
								/>
								{modelSeries.map((series, index) => (
									<Line
										key={series.tokensKey}
										type="monotone"
										dataKey={series.tokensKey}
										name={shortModelName(series.name)}
										stroke={COLORS[index % COLORS.length]}
										strokeWidth={2}
										dot={{ r: 2 }}
										activeDot={{ r: 4 }}
									/>
								))}
							</LineChart>
						</ResponsiveContainer>
					</ClientChartMount>
				</div>
			</div>
		</div>
	);
};
