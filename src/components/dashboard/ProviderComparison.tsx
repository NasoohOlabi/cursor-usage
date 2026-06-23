import { Activity } from "lucide-react";
import { ModelIcon } from "./ModelIcon";
import { ProviderData } from "./types";

interface ProviderComparisonProps {
	providerData: ProviderData[];
}

export const ProviderComparison = ({ providerData }: ProviderComparisonProps) => {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<div className="p-1.5 bg-cyan-500/10 rounded-md">
					<Activity className="text-cyan-400 w-4 h-4" />
				</div>
				<h2 className="text-sm font-bold text-slate-900 dark:text-white">Provider Comparison</h2>
			</div>
			<div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:gap-2 sm:pb-0.5 [scrollbar-gutter:stable]">
				{[...providerData]
					.toSorted((a, b) => b.cost - a.cost)
					.map((p) => (
						<div
							key={p.name}
							className="w-full shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0 bg-white/70 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 rounded-xl p-2.5 sm:p-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all group relative overflow-hidden shadow-sm dark:shadow-none"
						>
							<div className="absolute top-0 right-0 p-1.5 opacity-10 group-hover:opacity-20 transition-opacity">
								<ModelIcon name={p.name} className="w-8 h-8" />
							</div>
							<div className="flex items-center gap-1.5 mb-2 min-w-0 pr-2">
								<div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-md shrink-0">
									<ModelIcon name={p.name} className="w-4 h-4" />
								</div>
								<h3 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={p.name}>
									{p.name}
								</h3>
							</div>
							<div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
								<div>
									<p className="text-slate-500 dark:text-slate-500 text-[9px] font-medium uppercase tracking-wider mb-px">
										Total Cost
									</p>
									<p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
										${p.cost.toFixed(4)}
									</p>
								</div>
								<div>
									<p className="text-slate-500 dark:text-slate-500 text-[9px] font-medium uppercase tracking-wider mb-px">
										Total Tokens
									</p>
									<p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 font-mono tabular-nums truncate">
										{p.total.toLocaleString()}
									</p>
								</div>
								<div>
									<p className="text-slate-500 dark:text-slate-500 text-[9px] font-medium uppercase tracking-wider mb-px">
										Avg Price/1M
									</p>
									<p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
										{p.hasDocsPrice ? `$${p.pricePer1MTokens.toFixed(2)}` : "N/A"}
									</p>
								</div>
								<div>
									<p className="text-slate-500 dark:text-slate-500 text-[9px] font-medium uppercase tracking-wider mb-px">
										Requests
									</p>
									<p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
										{p.count}
									</p>
								</div>
							</div>
							<div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 text-[9px] min-w-0">
								<span className="text-slate-500 dark:text-slate-500 italic truncate" title={`Avg Output: ${p.avgOutputTokens.toFixed(0)}`}>
									Avg Out: {p.avgOutputTokens.toFixed(0)}
								</span>
								<span className="text-slate-500 dark:text-slate-500 italic font-mono truncate" title={`Avg Cost: $${p.avgPromptCost.toFixed(4)}`}>
									Avg $: {p.avgPromptCost.toFixed(4)}
								</span>
							</div>
						</div>
					))}
			</div>
		</div>
	);
};
