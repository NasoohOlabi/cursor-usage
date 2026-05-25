import { DollarSign, Cpu, Info } from "lucide-react";
import { ModelIcon } from "./ModelIcon";
import { getScaledColor } from "./utils";
import { MetricSummary } from "./types";

interface SummaryCardsProps {
	summaryData: MetricSummary[];
}

function MetricExtentCell({
	label,
	row,
	metric,
	summaryData,
	muted,
}: {
	label: string;
	row: { name: string; [key: string]: unknown };
	metric: MetricSummary;
	summaryData: MetricSummary[];
	muted?: boolean;
}) {
	const value = row[metric.key] as number;
	return (
		<div className="min-w-0">
			<span
				className={`block text-[9px] uppercase tracking-wider font-bold mb-0.5 ${
					muted
						? "text-slate-400 dark:text-slate-600"
						: "text-slate-500 dark:text-slate-500"
				}`}
			>
				{label}
			</span>
			<div
				className={`leading-tight truncate ${muted ? "text-xs font-semibold" : "text-sm font-bold"}`}
				style={{
					color: getScaledColor(metric.key, value, summaryData),
				}}
				title={metric.format(value)}
			>
				{metric.format(value)}
			</div>
			<div
				className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center gap-1 min-w-0 mt-0.5"
				title={row.name}
			>
				<ModelIcon name={row.name} className="w-3 h-3 shrink-0" />
				<span className="truncate">{row.name}</span>
			</div>
		</div>
	);
}

export const SummaryCards = ({ summaryData }: SummaryCardsProps) => {
	return (
		<div className="space-y-2">
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
			{summaryData.map((metric) => (
				<div
					key={metric.key}
					title={metric.hint}
					className="bg-white/70 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm dark:shadow-none"
				>
					<h3 className="text-slate-600 dark:text-slate-400 text-[11px] font-medium mb-2 flex items-center gap-1">
						{metric.label === "Cost" && (
							<DollarSign size={14} className="text-emerald-400" />
						)}
						{metric.label.includes("Tokens") && (
							<Cpu size={14} className="text-cyan-400" />
						)}
						{metric.label}
					</h3>
					<div className="grid grid-cols-2 gap-x-2 gap-y-2">
						<MetricExtentCell
							label="Most"
							row={metric.most}
							metric={metric}
							summaryData={summaryData}
						/>
						<MetricExtentCell
							label="P99"
							row={metric.p99}
							metric={metric}
							summaryData={summaryData}
							muted
						/>
						<MetricExtentCell
							label="Least"
							row={metric.least}
							metric={metric}
							summaryData={summaryData}
						/>
						<MetricExtentCell
							label="P01"
							row={metric.p01}
							metric={metric}
							summaryData={summaryData}
							muted
						/>
					</div>
				</div>
			))}
		</div>
		<p className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug px-0.5">
			<Info size={12} className="shrink-0 mt-0.5 text-slate-400" aria-hidden />
			<span>
				<strong className="font-medium text-slate-600 dark:text-slate-300">Most / Least</strong>{" "}
				= min and max <em>per model</em> in your filtered CSV;{" "}
				<strong className="font-medium text-slate-600 dark:text-slate-300">P99 / P01</strong>{" "}
				trim outliers (table heatmap uses P99–P01). Token totals use CSV columns;{" "}
				<strong className="font-medium text-slate-600 dark:text-slate-300">Input (w/o Cache)</strong>{" "}
				is only non-cached input, while{" "}
				<strong className="font-medium text-slate-600 dark:text-slate-300">Total Tokens</strong>{" "}
				includes cache read. Hover a card for metric details.
			</span>
		</p>
		</div>
	);
};
