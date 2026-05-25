import { TrendingUp } from "lucide-react";

export type BreakdownView = "model" | "provider";

interface UsageTrendsChartHeaderProps {
	breakdownView: BreakdownView;
	onBreakdownViewChange: (view: BreakdownView) => void;
}

export const UsageTrendsChartHeader = ({
	breakdownView,
	onBreakdownViewChange,
}: UsageTrendsChartHeaderProps) => {
	const isModelView = breakdownView === "model";

	return (
		<div className="flex items-center gap-3">
			<div className="rounded-md bg-violet-500/10 p-1.5">
				<TrendingUp className="h-6 w-6 text-violet-500 dark:text-violet-400" />
			</div>
			<div className="flex-1">
				<h2 className="text-xl font-bold text-slate-900 dark:text-white">
					Usage Trends (Daily)
				</h2>
			</div>
			<div className="inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
				<button
					type="button"
					onClick={() => onBreakdownViewChange("model")}
					className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
						isModelView
							? "bg-violet-500 text-white"
							: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
					}`}
				>
					By model
				</button>
				<button
					type="button"
					onClick={() => onBreakdownViewChange("provider")}
					className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
						!isModelView
							? "bg-violet-500 text-white"
							: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
					}`}
				>
					By provider
				</button>
			</div>
		</div>
	);
};
