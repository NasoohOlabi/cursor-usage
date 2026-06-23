import {
	Activity,
	ChevronUp,
	ChevronDown,
	ArrowUpDown,
} from "lucide-react";
import { ModelIcon } from "./ModelIcon";
import { getScaledColor } from "./utils";
import { formatListPricePer1M } from "./pricing";
import {
	CostAggregation,
	MetricSummary,
	ModelBreakdownRow,
	SortConfig,
} from "./types";
import { LineChart, Line, YAxis } from "recharts";

const SPARKLINE_WIDTH = 96;
const SPARKLINE_HEIGHT = 48;

interface ModelBreakdownTableProps {
	sortedModelData: ModelBreakdownRow[];
	sortConfig: SortConfig;
	requestSort: (key: string) => void;
	summaryData: MetricSummary[] | null;
	costAggregation: CostAggregation;
	onCostAggregationChange: (value: CostAggregation) => void;
}

export const ModelBreakdownTable = ({
	sortedModelData,
	sortConfig,
	requestSort,
	summaryData,
	costAggregation,
	onCostAggregationChange,
}: ModelBreakdownTableProps) => {
	const compactNumberFormatter = new Intl.NumberFormat("en", {
		notation: "compact",
		compactDisplay: "short",
		maximumFractionDigits: 0,
	});

	return (
		<div className="bg-white/70 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
			<div className="flex items-center justify-between gap-2 mb-3">
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-md bg-indigo-100/90 ring-1 ring-inset ring-indigo-200/80 dark:bg-indigo-500/10 dark:ring-0">
						<Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
					</div>
					<div>
						<h2 className="text-sm font-bold text-slate-900 dark:text-white">
							Model breakdown
						</h2>
						<p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
							<strong>Spent</strong> = your actual CSV charges (usage-dependent).
							<strong className="ml-1">List $/1M</strong> columns = Cursor catalog rates by token type — not blended cost.
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
					<span className="uppercase tracking-wider font-semibold">
						Cost
					</span>
					<select
						className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
						aria-label="Cost aggregation"
						value={costAggregation}
						onChange={(event) =>
							onCostAggregationChange(
								event.target.value as CostAggregation
							)
						}
					>
						<option value="sum">Sum</option>
						<option value="average">Average</option>
						<option value="max">Max</option>
						<option value="min">Min</option>
						<option value="p50">P50</option>
						<option value="p90">P90</option>
					</select>
				</div>
			</div>
			<div className="w-full overflow-x-auto">
				<table className="w-full text-left border-collapse min-w-[1200px]">
					<thead>
						<tr className="border-b border-slate-200 dark:border-slate-800">
							<th className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium text-xs text-right w-12">
								#
							</th>
							<th
								className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium text-xs cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group"
								onClick={() => requestSort("name")}
							>
								<div className="flex items-center gap-2">
									Model
									<span className="opacity-0 group-hover:opacity-100 transition-opacity">
										{sortConfig.key === "name" &&
										sortConfig.direction ? (
											sortConfig.direction === "asc" ? (
												<ChevronUp size={14} />
											) : (
												<ChevronDown size={14} />
											)
										) : (
											<ArrowUpDown size={14} />
										)}
									</span>
								</div>
							</th>
							<th
								className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium text-xs text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group"
								onClick={() => requestSort("count")}
							>
								<div className="flex items-center justify-end gap-2">
									Uses
									<span>
										{sortConfig.key === "count" &&
										sortConfig.direction ? (
											sortConfig.direction === "asc" ? (
												<ChevronUp size={14} />
											) : (
												<ChevronDown size={14} />
											)
										) : (
											<ArrowUpDown size={14} />
										)}
									</span>
								</div>
							</th>
							{[
								{
									key: "costAgg",
									label: costAggregation === "sum" ? "Spent" : "Cost",
									title:
										costAggregation === "sum"
											? "Sum of Cost from your export for this model (what you actually paid in the period)."
											: `${costAggregation} of per-request Cost from your export.`,
								},
								{
									key: "listInputPer1M",
									label: "List input",
									title:
										"Cursor docs input price per 1M tokens (catalog rate).",
								},
								{
									key: "listCacheWritePer1M",
									label: "List cache write",
									title:
										"Cursor docs cache-write price per 1M tokens (— when not offered).",
								},
								{
									key: "listCacheReadPer1M",
									label: "List cache read",
									title:
										"Cursor docs cache-read price per 1M tokens (catalog rate).",
								},
								{
									key: "listOutputPer1M",
									label: "List output",
									title:
										"Cursor docs output price per 1M tokens (catalog rate).",
								},
								{
									key: "p50ObservedCostPer1M",
									label: "Observed $/1M",
									title:
										"Median actual $/1M from your CSV (Cost ÷ Total Tokens × 1M per request). Blends input, cache, and output.",
								},
								{ key: "cacheHitRate", label: "Cache Hit %", title: undefined },
								{ key: "input", label: "Input", title: undefined },
								{ key: "output", label: "Output", title: undefined },
								{ key: "total", label: "Total", title: undefined },
							].map((col) => (
								<th
									key={col.key}
									title={col.title}
									className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium text-xs text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group"
									onClick={() => requestSort(col.key)}
								>
									<div className="flex items-center justify-end gap-2">
										{col.label}
										<span>
											{sortConfig.key === col.key &&
											sortConfig.direction ? (
												sortConfig.direction === "asc" ? (
													<ChevronUp size={14} />
												) : (
													<ChevronDown size={14} />
												)
											) : (
												<ArrowUpDown size={14} />
											)}
										</span>
									</div>
								</th>
							))}
							<th className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium text-xs text-right w-24">
								Trend (7d)
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedModelData.map((m, idx) => (
							<tr
								key={idx}
								className="border-b border-slate-200/80 dark:border-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors"
							>
								<td className="py-3 px-4 text-sm text-right font-mono text-slate-500 dark:text-slate-400">
									{idx + 1}
								</td>
								<td
									className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-slate-300 truncate max-w-[200px]"
									title={m.name}
								>
									<div className="flex items-center gap-2">
										<ModelIcon name={m.name} />
										{m.name.split("/").pop()}
									</div>
								</td>
								<td className="py-3 px-4 text-sm text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
									{m.count.toLocaleString()}
								</td>
								<td
									className="py-3 px-4 text-sm text-right font-mono"
									style={{
										color: getScaledColor(
											"costAgg",
											m.costAgg,
											summaryData
										),
									}}
								>
									${m.costAgg.toFixed(4)}
								</td>
								{(
									[
										"listInputPer1M",
										"listCacheWritePer1M",
										"listCacheReadPer1M",
										"listOutputPer1M",
									] as const
								).map((listKey) => {
									const listValue = m[listKey];
									return (
										<td
											key={listKey}
											className="py-3 px-4 text-sm text-right font-mono"
											style={{
												color:
													m.hasDocsPrice && listValue != null
														? getScaledColor(
																listKey,
																listValue,
																summaryData
														  )
														: "inherit",
											}}
										>
											{m.hasDocsPrice
												? formatListPricePer1M(listValue)
												: "N/A"}
										</td>
									);
								})}
								<td
									className="py-3 px-4 text-sm text-right font-mono text-slate-700 dark:text-slate-300"
									style={{
										color: getScaledColor(
											"p50ObservedCostPer1M",
											m.p50ObservedCostPer1M,
											summaryData
										),
									}}
									title="Median actual $/1M from your usage"
								>
									{m.p50ObservedCostPer1M > 0
										? `$${m.p50ObservedCostPer1M.toFixed(2)}`
										: "—"}
								</td>
								<td className="py-3 px-4 text-sm text-right font-mono" style={{ color: getScaledColor("cacheHitRate", m.cacheHitRate, summaryData) }}>
									{m.cacheHitRate > 0 ? `${m.cacheHitRate.toFixed(1)}%` : "0%"}
								</td>
								<td
									className="py-3 px-4 text-sm text-right font-mono"
									style={{
										color: getScaledColor("input", m.input, summaryData),
									}}
								>
									{compactNumberFormatter.format(m.input)}
								</td>
								<td
									className="py-3 px-4 text-sm text-right font-mono"
									style={{
										color: getScaledColor("output", m.output, summaryData),
									}}
								>
									{compactNumberFormatter.format(m.output)}
								</td>
								<td
									className="py-3 px-4 text-sm text-right font-mono font-bold"
									style={{
										color: getScaledColor("total", m.total, summaryData),
									}}
								>
									{compactNumberFormatter.format(m.total)}
								</td>
								<td className="py-3 px-4 h-12 w-24">
									{m.sparklineData && m.sparklineData.length > 1 ? (
										<LineChart
											width={SPARKLINE_WIDTH}
											height={SPARKLINE_HEIGHT}
											data={m.sparklineData.slice(-7)}
										>
											<YAxis domain={["dataMin", "dataMax"]} hide />
											<Line
												type="monotone"
												dataKey="value"
												stroke="#8b5cf6"
												strokeWidth={2}
												dot={false}
												isAnimationActive={false}
											/>
										</LineChart>
									) : (
										<span className="text-xs text-slate-400">N/A</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
