import { Gauge, TrendingDown, TrendingUp } from "lucide-react";

interface WindowMetrics {
	tokens: number;
	cost: number;
	requests: number;
	blendedCostPer1M: number;
	cheapTokenSharePct: number;
}

interface UsageEfficiencySummaryData {
	currentLabel: string;
	previousLabel: string;
	current: WindowMetrics;
	previous: WindowMetrics;
	tokenDeltaPct: number | null;
	costDeltaPct: number | null;
	requestDeltaPct: number | null;
	efficiencyDeltaPct: number | null;
	cheapShareDeltaPct: number | null;
}

interface UsageEfficiencySummaryProps {
	summary: UsageEfficiencySummaryData;
}

const formatDelta = (value: number | null, invert = false) => {
	if (value == null) return "N/A";
	const normalized = invert ? -value : value;
	const sign = normalized > 0 ? "+" : "";
	return `${sign}${normalized.toFixed(1)}%`;
};

const getDeltaClassName = (value: number | null, invert = false) => {
	if (value == null) return "text-slate-500 dark:text-slate-500";
	const normalized = invert ? -value : value;
	if (Math.abs(normalized) < 0.05)
		return "text-slate-500 dark:text-slate-400";
	return normalized > 0
		? "text-emerald-600 dark:text-emerald-400"
		: "text-rose-600 dark:text-rose-400";
};

export const UsageEfficiencySummary = ({
	summary,
}: UsageEfficiencySummaryProps) => {
	const efficiencyImproved = (summary.efficiencyDeltaPct || 0) < 0;
	return (
		<section className="bg-white/70 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
			<div className="flex items-center justify-between gap-4 mb-5">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-emerald-500/10 rounded-lg">
						<Gauge className="text-emerald-400 w-6 h-6" />
					</div>
					<div>
						<h2 className="text-xl font-bold text-slate-900 dark:text-white">
							Usage Efficiency Summary
						</h2>
						<p className="text-xs text-slate-600 dark:text-slate-400">
							Comparing current window vs previous equal window
						</p>
					</div>
				</div>
				<div
					className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
						efficiencyImproved
							? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
							: "bg-rose-500/15 text-rose-800 dark:text-rose-300"
					}`}
				>
					{efficiencyImproved ? (
						<TrendingDown size={14} />
					) : (
						<TrendingUp size={14} />
					)}
					{efficiencyImproved ? "Efficiency Up" : "Efficiency Down"}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-4">
					<p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
						Current ({summary.currentLabel})
					</p>
					<p className="text-sm text-slate-700 dark:text-slate-300">
						Tokens:{" "}
						<span className="font-mono text-cyan-600 dark:text-cyan-300">
							{summary.current.tokens.toLocaleString()}
						</span>
					</p>
					<p className="text-sm text-slate-700 dark:text-slate-300">
						Cost:{" "}
						<span className="font-mono text-emerald-600 dark:text-emerald-300">
							${summary.current.cost.toFixed(2)}
						</span>
					</p>
					<p className="text-sm text-slate-700 dark:text-slate-300">
						Requests:{" "}
						<span className="font-mono text-violet-600 dark:text-violet-300">
							{summary.current.requests}
						</span>
					</p>
				</div>
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-4">
					<p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
						Previous ({summary.previousLabel})
					</p>
					<p className="text-sm text-slate-700 dark:text-slate-300">
						Tokens:{" "}
						<span className="font-mono text-cyan-600 dark:text-cyan-300">
							{summary.previous.tokens.toLocaleString()}
						</span>
					</p>
					<p className="text-sm text-slate-700 dark:text-slate-300">
						Cost:{" "}
						<span className="font-mono text-emerald-600 dark:text-emerald-300">
							${summary.previous.cost.toFixed(2)}
						</span>
					</p>
					<p className="text-sm text-slate-700 dark:text-slate-300">
						Requests:{" "}
						<span className="font-mono text-violet-600 dark:text-violet-300">
							{summary.previous.requests}
						</span>
					</p>
				</div>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-3">
					<p className="text-slate-500 dark:text-slate-500 text-[11px] uppercase">Tokens</p>
					<p className={`font-mono ${getDeltaClassName(summary.tokenDeltaPct)}`}>
						{formatDelta(summary.tokenDeltaPct)}
					</p>
				</div>
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-3">
					<p className="text-slate-500 dark:text-slate-500 text-[11px] uppercase">Cost</p>
					<p
						className={`font-mono ${getDeltaClassName(summary.costDeltaPct, true)}`}
					>
						{formatDelta(summary.costDeltaPct, true)}
					</p>
				</div>
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-3">
					<p className="text-slate-500 dark:text-slate-500 text-[11px] uppercase">Requests</p>
					<p className={`font-mono ${getDeltaClassName(summary.requestDeltaPct)}`}>
						{formatDelta(summary.requestDeltaPct)}
					</p>
				</div>
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-3">
					<p className="text-slate-500 dark:text-slate-500 text-[11px] uppercase">Blended $/1M</p>
					<p
						className={`font-mono ${getDeltaClassName(summary.efficiencyDeltaPct, true)}`}
					>
						{formatDelta(summary.efficiencyDeltaPct, true)}
					</p>
				</div>
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-3">
					<p className="text-slate-500 dark:text-slate-500 text-[11px] uppercase">Cheap Share</p>
					<p
						className={`font-mono ${getDeltaClassName(summary.cheapShareDeltaPct)}`}
					>
						{formatDelta(summary.cheapShareDeltaPct)}
					</p>
				</div>
			</div>
		</section>
	);
};
