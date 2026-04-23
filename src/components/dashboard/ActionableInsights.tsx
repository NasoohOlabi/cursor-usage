import { Lightbulb, AlertTriangle, TrendingDown } from "lucide-react";
import { ModelData } from "./types";

interface ActionableInsightsProps {
	modelData: ModelData[];
}

export const ActionableInsights = ({ modelData }: ActionableInsightsProps) => {
	if (!modelData || modelData.length === 0) return null;

	const insights = [];

	// Insight 1: High cost, low request share
	const totalCost = modelData.reduce((acc, m) => acc + m.cost, 0);
	const totalRequests = modelData.reduce((acc, m) => acc + m.count, 0);

	const expensiveInefficientModels = modelData.filter((m) => {
		if (totalCost === 0 || totalRequests === 0) return false;
		const costShare = m.cost / totalCost;
		const reqShare = m.count / totalRequests;
		return costShare > 0.4 && reqShare < 0.2;
	});

	if (expensiveInefficientModels.length > 0) {
		const m = expensiveInefficientModels[0];
		insights.push({
			icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
			title: "Costly Model Usage",
			description: `${m.name.split("/").pop()} accounts for ${((m.cost / totalCost) * 100).toFixed(0)}% of your cost but only ${((m.count / totalRequests) * 100).toFixed(0)}% of requests. Consider routing some queries to a cheaper model.`,
		});
	}

	// Insight 2: Low Cache Hit Rate
	const lowCacheModels = modelData.filter(m => m.cacheHitRate < 10 && m.total > 100000);
	if (lowCacheModels.length > 0) {
		const m = lowCacheModels.sort((a, b) => b.total - a.total)[0];
		insights.push({
			icon: <TrendingDown className="w-5 h-5 text-blue-500" />,
			title: "Low Cache Efficiency",
			description: `${m.name.split("/").pop()} has a cache hit rate of ${m.cacheHitRate.toFixed(1)}% despite high volume. Check if cache headers or prompt structures can be optimized.`,
		});
	}

	// Default fallback insight if nothing major flagged
	if (insights.length === 0) {
		const topModel = [...modelData].sort((a, b) => b.count - a.count)[0];
		if (topModel) {
			insights.push({
				icon: <Lightbulb className="w-5 h-5 text-emerald-500" />,
				title: "Healthy Usage",
				description: `Your top model by request volume is ${topModel.name.split("/").pop()} with ${topModel.count} requests. Cost vs request share is balanced.`,
			});
		}
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
			{insights.map((insight, i) => (
				<div
					key={i}
					className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 flex items-start gap-4 shadow-sm dark:shadow-none transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
				>
					<div className="p-2 bg-white dark:bg-slate-900 rounded-lg shrink-0 shadow-sm border border-slate-100 dark:border-slate-800">
						{insight.icon}
					</div>
					<div>
						<h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
							{insight.title}
						</h4>
						<p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
							{insight.description}
						</p>
					</div>
				</div>
			))}
		</div>
	);
};