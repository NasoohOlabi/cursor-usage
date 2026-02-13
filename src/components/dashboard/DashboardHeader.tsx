import {
	Activity,
	Settings,
	Upload,
	CheckCircle2,
	AlertCircle,
	RefreshCw,
} from "lucide-react";

interface DashboardHeaderProps {
	isUploading: boolean;
	uploadStatus: "idle" | "success" | "error";
	onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
	onRefreshPricing: () => Promise<void>;
	pricingRefreshStatus: "idle" | "loading" | "success" | "error";
	pricingLastUpdated: string | null;
	onOpenFilter: () => void;
	selectedModelsCount: number;
	fromDate: string;
	setFromDate: (date: string) => void;
	toDate: string;
	setToDate: (date: string) => void;
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
	fromDate,
	setFromDate,
	toDate,
	setToDate,
}: DashboardHeaderProps) => {
	return (
		<header className="w-full mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
			<div>
				<h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
					<Activity className="text-cyan-400 w-10 h-10" />
					Usage Analytics
				</h1>
				<p className="text-slate-400 text-lg">
					Upload your CSV to visualize token usage, costs, and trends.
				</p>
			</div>

			<div className="flex flex-wrap md:flex-nowrap items-center gap-4">
				<div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2">
					<div className="flex flex-col">
						<label htmlFor="header-fromDate" className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">From</label>
						<input
							type="date"
							id="header-fromDate"
							value={fromDate}
							onChange={(e) => setFromDate(e.target.value)}
							className="bg-transparent text-sm text-white focus:outline-none focus:ring-0 transition-all cursor-pointer"
						/>
					</div>
					<div className="h-8 w-px bg-slate-700 mx-2" />
					<div className="flex flex-col">
						<label htmlFor="header-toDate" className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">To</label>
						<input
							type="date"
							id="header-toDate"
							value={toDate}
							onChange={(e) => setToDate(e.target.value)}
							className="bg-transparent text-sm text-white focus:outline-none focus:ring-0 transition-all cursor-pointer"
						/>
					</div>
				</div>

				<button
					onClick={onOpenFilter}
					className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 border border-slate-700 hover:border-violet-500 hover:bg-slate-900 rounded-xl transition-all group"
				>
					<Settings className="w-5 h-5 text-violet-400 group-hover:rotate-90 transition-transform duration-300" />
					<span className="font-semibold text-slate-200">Models</span>
					{selectedModelsCount > 0 && (
						<span className="ml-1 px-2 py-0.5 bg-violet-500 text-white text-[10px] rounded-full flex items-center gap-1">
							{selectedModelsCount}
						</span>
					)}
				</button>

				<div className="flex flex-col gap-1">
					<button
						onClick={onRefreshPricing}
						disabled={pricingRefreshStatus === "loading"}
						className="flex items-center gap-2 px-4 py-3 bg-slate-900/50 border border-slate-700 hover:border-cyan-500 hover:bg-slate-900 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<RefreshCw
							className={`w-4 h-4 text-cyan-400 ${
								pricingRefreshStatus === "loading" ? "animate-spin" : ""
							}`}
						/>
						<span className="font-semibold text-slate-200 text-sm">
							{pricingRefreshStatus === "loading"
								? "Updating Prices..."
								: "Update Prices from Cursor"}
						</span>
					</button>
					<p className="text-[11px] text-slate-500">
						{pricingRefreshStatus === "success"
							? "Pricing updated from Cursor docs."
							: pricingRefreshStatus === "error"
								? "Pricing refresh failed. Using current values."
								: "Using Cursor docs pricing."}
						{pricingLastUpdated
							? ` Last update: ${new Date(pricingLastUpdated).toLocaleString()}.`
							: ""}
					</p>
				</div>

				<div className="flex flex-col gap-2">
					<label className="relative group cursor-pointer">
						<input
							type="file"
							accept=".csv"
							onChange={onFileUpload}
							className="hidden"
							disabled={isUploading}
						/>
						<div
							className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-dashed transition-all ${
								isUploading
									? "bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed"
									: "bg-slate-900/50 border-slate-700 hover:border-cyan-500 hover:bg-slate-900"
							}`}
						>
							<Upload
								className={`w-5 h-5 ${isUploading ? "animate-bounce" : "text-cyan-400"}`}
							/>
							<span className="font-semibold">
								{isUploading ? "Uploading..." : "Drop CSV or Click to Upload"}
							</span>
						</div>
					</label>
					{uploadStatus === "success" && (
						<p className="text-emerald-400 text-sm flex items-center gap-1">
							<CheckCircle2 size={14} /> Upload successful!
						</p>
					)}
					{uploadStatus === "error" && (
						<p className="text-rose-400 text-sm flex items-center gap-1">
							<AlertCircle size={14} /> Upload failed.
						</p>
					)}
				</div>
			</div>
		</header>
	);
};
