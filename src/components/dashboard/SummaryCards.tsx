import { DollarSign, Cpu } from "lucide-react";
import { ModelIcon } from "./ModelIcon";
import { getScaledColor } from "./utils";
import { MetricSummary } from "./types";

interface SummaryCardsProps {
	summaryData: MetricSummary[];
}

export const SummaryCards = ({ summaryData }: SummaryCardsProps) => {
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
			{summaryData.map((metric) => (
				<div
					key={metric.key}
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
					<div className="space-y-1.5">
						<div className="flex justify-between items-end gap-1">
							<span className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-wider font-bold">
								Most
							</span>
							<div className="text-right min-w-0">
								<div
									className="text-sm font-bold"
									style={{
										color: getScaledColor(metric.key, metric.most[metric.key], summaryData),
									}}
								>
									{metric.format(metric.most[metric.key])}
								</div>
								<div
									className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center justify-end gap-1"
									title={metric.most.name}
								>
									<ModelIcon name={metric.most.name} className="w-3 h-3" />
									{metric.most.name.split("/").pop()}
								</div>
							</div>
						</div>
						<div className="flex justify-between items-end gap-1">
							<span className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-wider font-bold">
								Least
							</span>
							<div className="text-right min-w-0">
								<div
									className="text-sm font-bold"
									style={{
										color: getScaledColor(metric.key, metric.least[metric.key], summaryData),
									}}
								>
									{metric.format(metric.least[metric.key])}
								</div>
								<div
									className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center justify-end gap-1"
									title={metric.least.name}
								>
									<ModelIcon name={metric.least.name} className="w-3 h-3" />
									{metric.least.name.split("/").pop()}
								</div>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};
