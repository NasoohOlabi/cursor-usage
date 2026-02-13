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
	return (
		<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
			<div className="flex items-center justify-between gap-3 mb-6">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-indigo-500/10 rounded-lg">
						<Activity className="text-indigo-400 w-6 h-6" />
					</div>
					<h2 className="text-xl font-bold text-white">
						Model Performance Breakdown
					</h2>
				</div>
				<div className="flex items-center gap-2 text-xs text-slate-400">
					<span className="uppercase tracking-wider font-semibold">
						Cost
					</span>
					<select
						className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
						<tr className="border-b border-slate-800">
							<th className="py-3 px-4 text-slate-400 font-medium text-xs text-right w-12">
								#
							</th>
							<th
								className="py-3 px-4 text-slate-400 font-medium text-xs cursor-pointer hover:text-white transition-colors group"
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
								{ key: "input", label: "Input" },
								{ key: "output", label: "Output" },
								{ key: "total", label: "Total" },
							].map((col) => (
								<th
									key={col.key}
									className="py-3 px-4 text-slate-400 font-medium text-xs text-right cursor-pointer hover:text-white transition-colors group"
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
						</tr>
					</thead>
					<tbody>
						{sortedModelData.map((m, idx) => (
							<tr
								key={idx}
								className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
							>
								<td className="py-3 px-4 text-sm text-right font-mono text-slate-400">
									{idx + 1}
								</td>
								<td
									className="py-3 px-4 text-sm font-medium text-slate-300 truncate max-w-[200px]"
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
								<td
									className="py-3 px-4 text-sm text-right font-mono"
									style={{
										color: getScaledColor("input", m.input, summaryData),
									}}
								>
									{m.input.toLocaleString()}
								</td>
								<td
									className="py-3 px-4 text-sm text-right font-mono"
									style={{
										color: getScaledColor("output", m.output, summaryData),
									}}
								>
									{m.output.toLocaleString()}
								</td>
								<td
									className="py-3 px-4 text-sm text-right font-mono font-bold"
									style={{
										color: getScaledColor("total", m.total, summaryData),
									}}
								>
									{m.total.toLocaleString()}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
