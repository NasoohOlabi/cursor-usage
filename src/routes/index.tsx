import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
	Activity,
	AlertCircle,
	ArrowUpDown,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Cpu,
	DollarSign,
	FileText,
	Settings,
	TrendingUp,
	Upload,
	X,
} from "lucide-react";
import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

// --- Server Functions ---

const DATA_DIR = "./data";

const uploadCsv = createServerFn({ method: "POST" })
	.inputValidator((d: FormData) => d)
	.handler(async ({ data }) => {
		const file = data.get("file") as File;
		if (!file) throw new Error("No file uploaded");

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		const filePath = path.join(DATA_DIR, file.name);
		await fs.writeFile(filePath, buffer);
		return { success: true };
	});

const getLatestData = createServerFn({ method: "GET" }).handler(
	async (): Promise<any[] | null> => {
		try {
			const files = await fs.readdir(DATA_DIR).catch(() => []);
			const csvFiles = files.filter((f) => f.endsWith(".csv"));
			if (csvFiles.length === 0) return null;

			const fileStats = await Promise.all(
				csvFiles.map(async (f) => ({
					name: f,
					stat: await fs.stat(path.join(DATA_DIR, f)),
				}))
			);
			const latestFile = fileStats.sort(
				(a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()
			)[0];

			const content = await fs.readFile(
				path.join(DATA_DIR, latestFile.name),
				"utf-8"
			);
			const parsed = Papa.parse(content, {
				header: true,
				dynamicTyping: true,
				skipEmptyLines: true,
			});
			return parsed.data;
		} catch (error) {
			console.error("Error reading data:", error);
			return null;
		}
	}
);

// --- Route Definition ---

export const Route = createFileRoute("/")({
	component: Dashboard,
	loader: async () => await getLatestData(),
});

// --- UI Components ---

const COLORS = [
	"#22d3ee",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#f43f5e",
	"#f97316",
	"#eab308",
];

const getProviderName = (modelName: string) => {
	const name = modelName.toLowerCase();
	if (name.includes("deepseek")) return "DeepSeek";
	if (name.includes("gemini")) return "Google";
	if (name.includes("claude") || name.includes("anthropic"))
		return "Anthropic";
	if (
		name.includes("gpt") ||
		name.includes("openai") ||
		name.includes("o1") ||
		name.includes("o3")
	)
		return "OpenAI";
	if (name.includes("grok")) return "xAI";
	if (
		name.includes("cursor") ||
		name.includes("composer") ||
		name.includes("agent_review") ||
		name.includes("auto")
	)
		return "Cursor";
	return "Other";
};

const getModelIcon = (modelName: string) => {
	const name = modelName.toLowerCase();
	if (name.includes("deepseek")) return "/deepseek.svg";
	if (name.includes("gemini")) return "/gemini.svg";
	if (name.includes("claude") || name.includes("anthropic"))
		return "/anthropic.svg";
	if (
		name.includes("gpt") ||
		name.includes("openai") ||
		name.includes("o1") ||
		name.includes("o3")
	)
		return "/openAi.dark.svg";
	if (name.includes("grok")) return "/grok.dark.png";
	if (
		name.includes("cursor") ||
		name.includes("composer") ||
		name.includes("agent_review") ||
		name.includes("auto")
	)
		return "/cursor.dark.png";
	return null;
};

const ModelIcon = ({
	name,
	className = "w-4 h-4",
}: {
	name: string;
	className?: string;
}) => {
	const icon = getModelIcon(name);
	if (!icon) return null;
	return <img src={icon} alt={name} className={className} />;
};

function Dashboard() {
	const data = Route.useLoaderData() as any[] | null;
	const router = useRouter();
	const [isUploading, setIsUploading] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<
		"idle" | "success" | "error"
	>("idle");
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	}>({ key: "cost", direction: "desc" });

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedModels, setSelectedModels] = useState<string[]>([]);

	// Load selected models from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem("selectedModels");
		if (saved) {
			try {
				setSelectedModels(JSON.parse(saved));
			} catch (e) {
				console.error("Failed to load selected models", e);
			}
		}
	}, []);

	// Save selected models to localStorage
	useEffect(() => {
		if (selectedModels.length > 0) {
			localStorage.setItem("selectedModels", JSON.stringify(selectedModels));
		} else {
			localStorage.removeItem("selectedModels");
		}
	}, [selectedModels]);

	// Modal handlers
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsModalOpen(false);
		};
		if (isModalOpen) {
			window.addEventListener("keydown", handleEscape);
			document.body.style.overflow = "hidden";
		}
		return () => {
			window.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [isModalOpen]);

	const allModels = useMemo(() => {
		if (!data || !Array.isArray(data)) return [];
		const models = Array.from(
			new Set(data.map((row) => row.Model).filter(Boolean))
		) as string[];
		return models.sort();
	}, [data]);

	const onFileUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			setIsUploading(true);
			setUploadStatus("idle");

			try {
				const formData = new FormData();
				formData.append("file", file);
				await uploadCsv({ data: formData });
				setUploadStatus("success");
				router.invalidate();
			} catch (error) {
				console.error("Upload failed:", error);
				setUploadStatus("error");
			} finally {
				setIsUploading(false);
			}
		},
		[router]
	);

	// Data Processing
	const processedData = useMemo(() => {
		if (!data || !Array.isArray(data)) return null;

		// Filter out rows that might be empty or malformed and by selected models
		const validData = data.filter((row) => {
			const isValid = row.Date && row.Model;
			if (!isValid) return false;
			if (selectedModels.length === 0) return true;
			return selectedModels.includes(row.Model);
		});

		// 1. Token & Cost by Model
		const modelData = Object.values(
			validData.reduce((acc: any, row) => {
				const model = row.Model || "Unknown";
				if (!acc[model])
					acc[model] = {
						name: model,
						input: 0,
						output: 0,
						total: 0,
						cost: 0,
						count: 0,
					};
				acc[model].input += Number(row["Input (w/o Cache Write)"]) || 0;
				acc[model].output += Number(row["Output Tokens"]) || 0;
				acc[model].total += Number(row["Total Tokens"]) || 0;
				acc[model].cost += Number(row["Cost"]) || 0;
				acc[model].count += 1;
				return acc;
			}, {})
		)
			.map((m: any) => ({
				...m,
				pricePer1MTokens: m.total > 0 ? (m.cost / m.total) * 1000000 : 0,
				avgOutputTokens: m.count > 0 ? m.output / m.count : 0,
				avgPromptCost: m.count > 0 ? m.cost / m.count : 0,
			}))
			.filter((m: any) => m.total > 0 || m.cost > 0)
			.sort((a: any, b: any) => b.cost - a.cost);

		// 2. Usage Centric (by Kind)
		const usageByKind = Object.values(
			validData.reduce((acc: any, row) => {
				const kind = row.Kind || "Unknown";
				if (!acc[kind]) acc[kind] = { name: kind, value: 0 };
				acc[kind].value += 1;
				return acc;
			}, {})
		) as { name: string; value: number }[];

		// 3. Timeseries (Daily Cost & Tokens)
		const timeseries = Object.values(
			validData.reduce((acc: any, row) => {
				const dateStr =
					row.Date instanceof Date
						? row.Date.toISOString().split("T")[0]
						: String(row.Date).split("T")[0];
				const date = dateStr || "Unknown";
				if (!acc[date]) acc[date] = { name: date, cost: 0, tokens: 0 };
				acc[date].cost += Number(row.Cost) || 0;
				acc[date].tokens += Number(row["Total Tokens"]) || 0;
				return acc;
			}, {})
		).sort((a: any, b: any) => a.name.localeCompare(b.name)) as {
			name: string;
			cost: number;
			tokens: number;
		}[];

		// 4. Provider Data
		const providerData = Object.values(
			validData.reduce((acc: any, row) => {
				const provider = getProviderName(row.Model || "Unknown");
				if (!acc[provider])
					acc[provider] = {
						name: provider,
						input: 0,
						output: 0,
						total: 0,
						cost: 0,
						count: 0,
					};
				acc[provider].input += Number(row["Input (w/o Cache Write)"]) || 0;
				acc[provider].output += Number(row["Output Tokens"]) || 0;
				acc[provider].total += Number(row["Total Tokens"]) || 0;
				acc[provider].cost += Number(row.Cost) || 0;
				acc[provider].count += 1;
				return acc;
			}, {})
		).map((p: any) => ({
			...p,
			pricePer1MTokens: p.total > 0 ? (p.cost / p.total) * 1000000 : 0,
			avgOutputTokens: p.count > 0 ? p.output / p.count : 0,
			avgPromptCost: p.count > 0 ? p.cost / p.count : 0,
		})) as {
			name: string;
			input: number;
			output: number;
			total: number;
			cost: number;
			count: number;
			pricePer1MTokens: number;
			avgOutputTokens: number;
			avgPromptCost: number;
		}[];

		return { modelData, usageByKind, timeseries, providerData };
	}, [data, selectedModels]) as {
		modelData: any[];
		usageByKind: { name: string; value: number }[];
		timeseries: { name: string; cost: number; tokens: number }[];
		providerData: any[];
	} | null;

	const sortedModelData = useMemo(() => {
		if (!processedData?.modelData) return [];
		return [...processedData.modelData].sort((a, b) => {
			const aValue = a[sortConfig.key];
			const bValue = b[sortConfig.key];
			if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
			if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});
	}, [processedData?.modelData, sortConfig]);

	const summaryData = useMemo(() => {
		if (!processedData?.modelData || processedData.modelData.length === 0)
			return null;

		const metrics = [
			{
				key: "cost",
				label: "Cost",
				unit: "$",
				format: (v: number) => `$${v.toFixed(4)}`,
			},
			{
				key: "pricePer1MTokens",
				label: "Price/1M Tokens",
				unit: "$",
				format: (v: number) => `$${v.toFixed(2)}`,
			},
			{
				key: "avgOutputTokens",
				label: "Avg Output Tokens",
				unit: "",
				format: (v: number) => v.toFixed(0),
			},
			{
				key: "avgPromptCost",
				label: "Avg Prompt Cost",
				unit: "$",
				format: (v: number) => `$${v.toFixed(4)}`,
			},
			{
				key: "input",
				label: "Input Tokens",
				unit: "",
				format: (v: number) => v.toLocaleString(),
			},
			{
				key: "output",
				label: "Output Tokens",
				unit: "",
				format: (v: number) => v.toLocaleString(),
			},
			{
				key: "total",
				label: "Total Tokens",
				unit: "",
				format: (v: number) => v.toLocaleString(),
			},
		];

		return metrics.map((metric) => {
			const sorted = [...processedData.modelData].sort(
				(a, b) => a[metric.key] - b[metric.key]
			);
			return {
				...metric,
				least: sorted[0],
				most: sorted[sorted.length - 1],
			};
		});
	}, [processedData?.modelData]);

	const getScaledColor = useCallback(
		(key: string, value: number) => {
			if (!summaryData) return "inherit";
			const metric = summaryData.find((m) => m.key === key);
			if (!metric) return "inherit";

			const min = metric.least[key];
			const max = metric.most[key];

			if (max === min) return "inherit";

			let ratio = (value - min) / (max - min);

			// For cost-related metrics, lower is better (green)
			const costMetrics = ["cost", "pricePer1MTokens", "avgPromptCost"];
			if (costMetrics.includes(key)) {
				ratio = 1 - ratio;
			}

			// Interpolate between Red (hsl(0, 70%, 50%)) and Green (hsl(140, 70%, 50%))
			const hue = ratio * 140; // 0 to 140 (Red to Green)
			return `hsl(${hue}, 80%, 60%)`;
		},
		[summaryData]
	);

	const requestSort = (key: string) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	return (
		<div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans w-full">
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
					<button
						onClick={() => setIsModalOpen(true)}
						className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 border border-slate-700 hover:border-violet-500 hover:bg-slate-900 rounded-xl transition-all group"
					>
						<Settings className="w-5 h-5 text-violet-400 group-hover:rotate-90 transition-transform duration-300" />
						<span className="font-semibold text-slate-200">
							Filter Models
						</span>
						{selectedModels.length > 0 && (
							<span className="ml-1 px-2 py-0.5 bg-violet-500 text-white text-[10px] rounded-full">
								{selectedModels.length}
							</span>
						)}
					</button>

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
									{isUploading
										? "Uploading..."
										: "Drop CSV or Click to Upload"}
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

			{!processedData ? (
				<div className="w-full py-20 text-center">
					<div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 inline-block">
						<FileText className="w-16 h-16 text-slate-700 mb-6" />
						<h2 className="text-2xl font-semibold text-slate-300 mb-2">
							No Data Available
						</h2>
						<p className="text-slate-500">
							Please upload a CSV file with the required headers to see
							your analytics dashboard.
						</p>
					</div>
				</div>
			) : (
				<main className="w-full space-y-8">
					{/* Summary Section */}
					{summaryData && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							{summaryData.map((metric) => (
								<div
									key={metric.key}
									className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
								>
									<h3 className="text-slate-400 text-sm font-medium mb-4 flex items-center gap-2">
										{metric.label === "Cost" && (
											<DollarSign
												size={14}
												className="text-emerald-400"
											/>
										)}
										{metric.label.includes("Tokens") && (
											<Cpu size={14} className="text-cyan-400" />
										)}
										{metric.label}
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between items-end">
											<span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
												Most
											</span>
											<div className="text-right">
												<div
													className="font-bold"
													style={{
														color: getScaledColor(
															metric.key,
															metric.most[metric.key]
														),
													}}
												>
													{metric.format(metric.most[metric.key])}
												</div>
												<div
													className="text-[10px] text-slate-500 flex items-center justify-end gap-1"
													title={metric.most.name}
												>
													<ModelIcon
														name={metric.most.name}
														className="w-3 h-3"
													/>
													{metric.most.name.split("/").pop()}
												</div>
											</div>
										</div>
										<div className="flex justify-between items-end">
											<span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
												Least
											</span>
											<div className="text-right">
												<div
													className="font-bold"
													style={{
														color: getScaledColor(
															metric.key,
															metric.least[metric.key]
														),
													}}
												>
													{metric.format(metric.least[metric.key])}
												</div>
												<div
													className="text-[10px] text-slate-500 flex items-center justify-end gap-1"
													title={metric.least.name}
												>
													<ModelIcon
														name={metric.least.name}
														className="w-3 h-3"
													/>
													{metric.least.name.split("/").pop()}
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Provider Comparison Section */}
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-cyan-500/10 rounded-lg">
								<Activity className="text-cyan-400 w-6 h-6" />
							</div>
							<h2 className="text-xl font-bold text-white">
								Provider Comparison
							</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{processedData.providerData
								.sort((a, b) => b.cost - a.cost)
								.map((p: any) => (
									<div
										key={p.name}
										className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group relative overflow-hidden"
									>
										<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
											<ModelIcon
												name={p.name}
												className="w-16 h-16"
											/>
										</div>
										<div className="flex items-center gap-3 mb-6">
											<div className="p-2 bg-slate-800 rounded-lg">
												<ModelIcon
													name={p.name}
													className="w-6 h-6"
												/>
											</div>
											<h3 className="text-lg font-bold text-white">
												{p.name}
											</h3>
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

					{/* Merged Sortable Table */}
					<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
						<div className="flex items-center gap-3 mb-6">
							<div className="p-2 bg-indigo-500/10 rounded-lg">
								<Activity className="text-indigo-400 w-6 h-6" />
							</div>
							<h2 className="text-xl font-bold text-white">
								Model Performance Breakdown
							</h2>
						</div>
						<div className="w-full overflow-x-auto">
							<table className="w-full text-left border-collapse min-w-[1000px]">
								<thead>
									<tr className="border-b border-slate-800">
										<th
											className="py-3 px-4 text-slate-400 font-medium text-xs cursor-pointer hover:text-white transition-colors group"
											onClick={() => requestSort("name")}
										>
											<div className="flex items-center gap-2">
												Model
												<span className="opacity-0 group-hover:opacity-100 transition-opacity">
													{sortConfig.key === "name" ? (
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
											{ key: "cost", label: "Cost Sum" },
											{ key: "pricePer1MTokens", label: "Price/1M" },
											{
												key: "avgOutputTokens",
												label: "Avg Output",
											},
											{ key: "avgPromptCost", label: "Avg Cost" },
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
														{sortConfig.key === col.key ? (
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
									{sortedModelData.map((m: any, idx: number) => (
										<tr
											key={idx}
											className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
										>
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
													color: getScaledColor("cost", m.cost),
												}}
											>
												${m.cost.toFixed(4)}
											</td>
											<td
												className="py-3 px-4 text-sm text-right font-mono"
												style={{
													color: getScaledColor(
														"pricePer1MTokens",
														m.pricePer1MTokens
													),
												}}
											>
												${m.pricePer1MTokens.toFixed(2)}
											</td>
											<td
												className="py-3 px-4 text-sm text-right font-mono"
												style={{
													color: getScaledColor(
														"avgOutputTokens",
														m.avgOutputTokens
													),
												}}
											>
												{m.avgOutputTokens.toFixed(0)}
											</td>
											<td
												className="py-3 px-4 text-sm text-right font-mono"
												style={{
													color: getScaledColor(
														"avgPromptCost",
														m.avgPromptCost
													),
												}}
											>
												${m.avgPromptCost.toFixed(4)}
											</td>
											<td
												className="py-3 px-4 text-sm text-right font-mono"
												style={{
													color: getScaledColor("input", m.input),
												}}
											>
												{m.input.toLocaleString()}
											</td>
											<td
												className="py-3 px-4 text-sm text-right font-mono"
												style={{
													color: getScaledColor(
														"output",
														m.output
													),
												}}
											>
												{m.output.toLocaleString()}
											</td>
											<td
												className="py-3 px-4 text-sm text-right font-mono font-bold"
												style={{
													color: getScaledColor("total", m.total),
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

					{/* Timeseries - Moved out of grid to be wider */}
					<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors w-full">
						<div className="flex items-center gap-3 mb-6">
							<div className="p-2 bg-violet-500/10 rounded-lg">
								<TrendingUp className="text-violet-400 w-6 h-6" />
							</div>
							<h2 className="text-xl font-bold text-white">
								Usage Trends (Daily)
							</h2>
						</div>
						<div className="h-[450px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart
									data={processedData.timeseries}
									margin={{ bottom: 60, left: 20, right: 20 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="#1e293b"
									/>
									<XAxis
										dataKey="name"
										stroke="#64748b"
										fontSize={10}
										angle={-45}
										textAnchor="end"
										height={100}
										interval="auto"
									/>
									<YAxis
										yAxisId="left"
										stroke="#64748b"
										fontSize={12}
									/>
									<YAxis
										yAxisId="right"
										orientation="right"
										stroke="#64748b"
										fontSize={12}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "#0f172a",
											border: "1px solid #1e293b",
											borderRadius: "8px",
										}}
									/>
									<Legend />
									<Line
										yAxisId="left"
										type="monotone"
										dataKey="tokens"
										name="Total Tokens"
										stroke="#8b5cf6"
										strokeWidth={3}
										dot={{ r: 4, fill: "#8b5cf6" }}
										activeDot={{ r: 6 }}
									/>
									<Line
										yAxisId="right"
										type="monotone"
										dataKey="cost"
										name="Daily Cost ($)"
										stroke="#f43f5e"
										strokeWidth={3}
										dot={{ r: 4, fill: "#f43f5e" }}
										activeDot={{ r: 6 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Provider Cost Share */}
						<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
							<div className="flex items-center gap-3 mb-6">
								<div className="p-2 bg-emerald-500/10 rounded-lg">
									<DollarSign className="text-emerald-400 w-6 h-6" />
								</div>
								<h2 className="text-xl font-bold text-white">
									Cost by Provider
								</h2>
							</div>
							<div className="h-[300px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={processedData.providerData}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={5}
											dataKey="cost"
											nameKey="name"
										>
											{processedData.providerData.map((_, index) => (
												<Cell
													key={`cell-${index}`}
													fill={COLORS[index % COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: "#0f172a",
												border: "1px solid #1e293b",
												borderRadius: "8px",
											}}
											formatter={(value: any) => [
												`$${Number(value || 0).toFixed(4)}`,
												"Cost",
											]}
										/>
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</div>
						</div>

						{/* Usage Centric */}
						<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
							<div className="flex items-center gap-3 mb-6">
								<div className="p-2 bg-amber-500/10 rounded-lg">
									<Activity className="text-amber-400 w-6 h-6" />
								</div>
								<h2 className="text-xl font-bold text-white">
									Request Kind Distribution
								</h2>
							</div>
							<div className="h-[300px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={processedData.usageByKind}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={5}
											dataKey="value"
										>
											{processedData.usageByKind.map((_, index) => (
												<Cell
													key={`cell-${index}`}
													fill={COLORS[index % COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: "#0f172a",
												border: "1px solid #1e293b",
												borderRadius: "8px",
											}}
										/>
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</div>
						</div>
					</div>
				</main>
			)}

			{/* Filter Modal */}
			{isModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
					onClick={() => setIsModalOpen(false)}
				>
					<div
						className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-6 border-b border-slate-800 flex items-center justify-between">
							<div>
								<h2 className="text-xl font-bold text-white">
									Select Models
								</h2>
								<p className="text-slate-400 text-sm">
									Choose which models to include in the analytics.
								</p>
							</div>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
								aria-label="Close"
							>
								<X size={24} />
							</button>
						</div>
						<div className="flex-1 overflow-y-auto p-6">
							<div className="flex flex-wrap gap-2">
								{allModels.map((model) => (
									<div
										key={model}
										onClick={() => {
											if (selectedModels.includes(model)) {
												setSelectedModels(
													selectedModels.filter((m) => m !== model)
												);
											} else {
												setSelectedModels([
													...selectedModels,
													model,
												]);
											}
										}}
										className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${
											selectedModels.includes(model)
												? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_-5px_rgba(6,182,212,0.3)]"
												: "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
										}`}
									>
										<ModelIcon name={model} />
										<span
											className="text-sm font-medium whitespace-nowrap"
											title={model}
										>
											{model.split("/").pop()}
										</span>
									</div>
								))}
							</div>
						</div>
						<div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-b-3xl">
							<button
								onClick={() => setSelectedModels([])}
								className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
							>
								Clear All
							</button>
							<div className="flex gap-3">
								<button
									onClick={() => setSelectedModels(allModels)}
									className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
								>
									Select All
								</button>
								<button
									onClick={() => setIsModalOpen(false)}
									className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
								>
									Apply Filters
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
