import {
	Activity,
	ChevronUp,
	ChevronDown,
	ArrowUpDown,
} from "lucide-react";
import { ModelIcon } from "./ModelIcon";
import { getScaledColor } from "./utils";
import {
	CostAggregation,
	MetricSummary,
	ModelBreakdownRow,
	SortConfig,
} from "./types";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

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
		<div className="bg-white/70 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
			<div className="flex items-center justify-between gap-3 mb-6">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-indigo-500/10 rounded-lg">
						<Activity className="text-indigo-500 dark:text-indigo-400 w-6 h-6" />
					</div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						Model Performance Breakdown
					</h2>
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
				<table className="w-full text-left border-collapse min-w-[1000px]">
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
							{[
								{ key: "costAgg", label: "Cost" },
								{ key: "pricePer1MTokens", label: "Price/1M" },
								{ key: "cacheHitRate", label: "Cache Hit %" },
								{ key: "input", label: "Input" },
								{ key: "output", label: "Output" },
								{ key: "total", label: "Total" },
							].map((col) => (
								<th
									key={col.key}
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
								<td
									className="py-3 px-4 text-sm text-right font-mono"
									style={{
										color: m.hasDocsPrice
											? getScaledColor(
													"pricePer1MTokens",
													m.pricePer1MTokens,
													summaryData
											  )
											: "inherit",
									}}
								>
									{m.hasDocsPrice ? `$${m.pricePer1MTokens.toFixed(2)}` : "N/A"}
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
										<ResponsiveContainer width="100%" height="100%">
											<LineChart data={m.sparklineData.slice(-7)}>
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
										</ResponsiveContainer>
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
