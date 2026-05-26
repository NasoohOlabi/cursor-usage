import {
	Activity,
	Settings,
	Upload,
	CheckCircle2,
	AlertCircle,
	RefreshCw,
	Sparkles,
	Coins,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import type { GlobalUsageTotals } from "./types";

interface DashboardHeaderProps {
	isUploading: boolean;
	uploadStatus: "idle" | "success" | "error";
	onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
	onRefreshPricing: () => Promise<void>;
	pricingRefreshStatus: "idle" | "loading" | "success" | "error";
	pricingLastUpdated: string | null;
	onOpenFilter: () => void;
	selectedModelsCount: number;
	globalUsage?: GlobalUsageTotals | null;
}

export const DashboardHeader = ({
	isUploading,
	uploadStatus,
	onFileUpload,
	onRefreshPricing,
	pricingRefreshStatus,
	pricingLastUpdated,
	onOpenFilter,
	selectedModelsCount,
	globalUsage,
}: DashboardHeaderProps) => {
	const showAvgTokenPrice =
		globalUsage != null && globalUsage.totalTokens > 0;
	const { isDark } = useTheme();
	const [showPriceSyncBurst, setShowPriceSyncBurst] = useState(false);

	useEffect(() => {
		if (pricingRefreshStatus === "success") {
			setShowPriceSyncBurst(true);
			const t = window.setTimeout(() => setShowPriceSyncBurst(false), 700);
			return () => window.clearTimeout(t);
		}
	}, [pricingRefreshStatus]);

	return (
		<header className="w-full mb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
			<div className="flex items-center gap-2">
				<Activity className="text-cyan-500 dark:text-cyan-400 w-6 h-6" />
				<div>
					<h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
						Usage Analytics
					</h1>
					<p className="text-slate-600 dark:text-slate-400 text-xs">
						Upload your CSV to visualize token usage, costs, and trends.
					</p>
				</div>
			</div>

			<div className="flex flex-wrap md:flex-nowrap items-center gap-2">
				{showAvgTokenPrice && (
					<div
						className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 shadow-sm dark:shadow-none"
						title={`$${globalUsage.totalCost.toFixed(2)} ÷ ${globalUsage.totalTokens.toLocaleString()} tokens`}
					>
						<Coins className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
						<div className="flex flex-col min-w-0">
							<span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium uppercase tracking-wider leading-none">
								Avg token price
							</span>
							<span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-300 tabular-nums leading-tight">
								${globalUsage.averagePricePer1MTokens.toFixed(2)}
								<span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-sans">
									{" "}
									/1M
								</span>
							</span>
						</div>
					</div>
				)}

				<button
					type="button"
					onClick={onOpenFilter}
					className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-slate-900 rounded-lg transition-all group shadow-sm dark:shadow-none"
				>
					<Settings className="w-4 h-4 text-violet-500 dark:text-violet-400 group-hover:rotate-90 transition-transform duration-300" />
					<span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Models</span>
					{selectedModelsCount > 0 && (
						<span className="ml-1 px-2 py-0.5 bg-violet-500 text-white text-[10px] rounded-full flex items-center gap-1">
							{selectedModelsCount}
						</span>
					)}
				</button>

				<div className="flex flex-col gap-1 min-w-0 max-w-[min(100%,16rem)]">
					<div
						className={`relative rounded-xl p-px transition-all duration-500 ${
							showPriceSyncBurst
								? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500 scale-[1.02] shadow-lg shadow-cyan-500/30"
								: "bg-gradient-to-r from-cyan-400/90 via-fuchsia-500/80 to-violet-500/90 hover:shadow-md hover:shadow-cyan-500/25"
						}`}
					>
						<div
							className={`relative flex flex-col overflow-hidden rounded-[15px] backdrop-blur-sm ${
								isDark
									? "bg-slate-950/85 border border-slate-800/80"
									: "bg-white/85 border border-slate-200/90"
							}`}
						>
							<button
								type="button"
								onClick={onRefreshPricing}
								disabled={pricingRefreshStatus === "loading"}
								className="group flex w-full items-center justify-center gap-2 px-3 py-2 text-left transition-all enabled:hover:bg-cyan-500/5 dark:enabled:hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-55"
							>
								<RefreshCw
									className={`h-3.5 w-3.5 shrink-0 text-cyan-500 dark:text-cyan-400 ${
										pricingRefreshStatus === "loading"
											? "animate-spin"
											: "group-hover:rotate-[-20deg] transition-transform duration-300 " +
											  (pricingRefreshStatus === "idle"
													? "animate-pulse"
													: "")
									} ${showPriceSyncBurst ? "text-emerald-500" : ""}`}
								/>
								<div className="min-w-0">
									<span className="flex items-center gap-1 font-semibold text-slate-800 text-xs dark:text-slate-100">
										<Sparkles
											className="h-3 w-3 shrink-0 text-fuchsia-500 opacity-80"
											aria-hidden
										/>
										{pricingRefreshStatus === "loading"
											? "Pulling prices…"
											: "Update Prices"}
									</span>
								</div>
							</button>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-1">
					<label className="relative group cursor-pointer">
						<input
							type="file"
							accept=".csv"
							onChange={onFileUpload}
							className="hidden"
							disabled={isUploading}
						/>
						<div
							className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed transition-all ${
								isUploading
									? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
									: "bg-white/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50/40 dark:hover:bg-slate-900 shadow-sm"
							}`}
						>
							<Upload
								className={`w-4 h-4 ${
									isUploading
										? "animate-bounce"
										: "text-cyan-500 dark:text-cyan-400"
								}`}
							/>
							<span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
								{isUploading ? "Uploading..." : "Upload CSV"}
							</span>
						</div>
					</label>
					{uploadStatus === "success" && (
						<p className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
							<CheckCircle2 size={14} /> Upload successful!
						</p>
					)}
					{uploadStatus === "error" && (
						<p className="text-rose-600 dark:text-rose-400 text-sm flex items-center gap-1">
							<AlertCircle size={14} /> Upload failed.
						</p>
					)}
				</div>
			</div>
		</header>
	);
};
