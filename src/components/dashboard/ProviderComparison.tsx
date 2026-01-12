import { Activity } from "lucide-react";
import { ModelIcon } from "./ModelIcon";
import { ProviderData } from "./types";

interface ProviderComparisonProps {
	providerData: ProviderData[];
}

export const ProviderComparison = ({ providerData }: ProviderComparisonProps) => {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<div className="p-2 bg-cyan-500/10 rounded-lg">
					<Activity className="text-cyan-400 w-6 h-6" />
				</div>
				<h2 className="text-xl font-bold text-white">Provider Comparison</h2>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{providerData
					.sort((a, b) => b.cost - a.cost)
					.map((p) => (
						<div
							key={p.name}
							className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group relative overflow-hidden"
						>
							<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
								<ModelIcon name={p.name} className="w-16 h-16" />
							</div>
							<div className="flex items-center gap-3 mb-6">
								<div className="p-2 bg-slate-800 rounded-lg">
									<ModelIcon name={p.name} className="w-6 h-6" />
								</div>
								<h3 className="text-lg font-bold text-white">{p.name}</h3>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
										Total Cost
									</p>
									<p className="text-xl font-bold text-emerald-400 font-mono">
										${p.cost.toFixed(4)}
									</p>
								</div>
								<div>
									<p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
										Total Tokens
									</p>
									<p className="text-xl font-bold text-cyan-400 font-mono">
										{p.total.toLocaleString()}
									</p>
								</div>
								<div>
									<p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
										Avg Price/1M
									</p>
									<p className="text-lg font-semibold text-slate-300 font-mono">
										${p.pricePer1MTokens.toFixed(2)}
									</p>
								</div>
								<div>
									<p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
										Requests
									</p>
									<p className="text-lg font-semibold text-slate-300 font-mono">
										{p.count}
									</p>
								</div>
							</div>
							<div className="mt-6 pt-6 border-t border-slate-800/50 flex justify-between items-center text-xs">
								<span className="text-slate-500 italic">
									Avg Output: {p.avgOutputTokens.toFixed(0)}
								</span>
								<span className="text-slate-500 italic">
									Avg Cost: ${p.avgPromptCost.toFixed(4)}
								</span>
							</div>
						</div>
					))}
			</div>
		</div>
	);
};
