import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import { useCallback, useEffect, useMemo, useState } from "react";

// Components
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DistributionCharts } from "../components/dashboard/DistributionCharts";
import { EmptyState } from "../components/dashboard/EmptyState";
import { FilterModal } from "../components/dashboard/FilterModal";
import { ModelBreakdownTable } from "../components/dashboard/ModelBreakdownTable";
import { ProviderComparison } from "../components/dashboard/ProviderComparison";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { UsageTrendsChart } from "../components/dashboard/UsageTrendsChart";

// Utils & Types
import {
	CostAggregation,
	MetricSummary,
	ModelBreakdownRow,
	ProcessedData,
	SortConfig,
} from "../components/dashboard/types";
import { getProviderName } from "../components/dashboard/utils";

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

function Dashboard() {
	const data = Route.useLoaderData() as any[] | null;
	const router = useRouter();
	const [isUploading, setIsUploading] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<
		"idle" | "success" | "error"
	>("idle");
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		key: null,
		direction: null,
	});
	const [costAggregation, setCostAggregation] =
		useState<CostAggregation>("sum");

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedModels, setSelectedModels] = useState<string[]>([]);
	const [fromDate, setFromDate] = useState<string>("");
	const [toDate, setToDate] = useState<string>("");

	const sanitizeSeriesKey = useCallback((value: string) => {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "");
	}, []);

	// Load selected models and dates from localStorage on mount
	useEffect(() => {
		const savedModels = localStorage.getItem("selectedModels");
		if (savedModels) {
			try {
				setSelectedModels(JSON.parse(savedModels));
			} catch (e) {
				console.error("Failed to load selected models", e);
			}
		}

		const savedFromDate = localStorage.getItem("fromDate");
		if (savedFromDate) setFromDate(savedFromDate);

		const savedToDate = localStorage.getItem("toDate");
		if (savedToDate) setToDate(savedToDate);
	}, []);

	// Save selected models and dates to localStorage
	useEffect(() => {
		if (selectedModels.length > 0) {
			localStorage.setItem("selectedModels", JSON.stringify(selectedModels));
		} else {
			localStorage.removeItem("selectedModels");
		}
	}, [selectedModels]);

	useEffect(() => {
		if (fromDate) {
			localStorage.setItem("fromDate", fromDate);
		} else {
			localStorage.removeItem("fromDate");
		}
	}, [fromDate]);

	useEffect(() => {
		if (toDate) {
			localStorage.setItem("toDate", toDate);
		} else {
			localStorage.removeItem("toDate");
		}
	}, [toDate]);

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

		const validData = data.filter((row) => {
			const isValid = row.Date && row.Model;
			if (!isValid) return false;

			// Model Filter
			if (selectedModels.length > 0 && !selectedModels.includes(row.Model)) {
				return false;
			}

			// Date Filter
			const rowDate =
				row.Date instanceof Date
					? row.Date.toISOString().split("T")[0]
					: String(row.Date).split("T")[0];

			if (fromDate && rowDate < fromDate) return false;
			if (toDate && rowDate > toDate) return false;

			return true;
		});

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
						costSamples: [],
					};
				const rowCost = Number(row["Cost"]) || 0;
				acc[model].input += Number(row["Input (w/o Cache Write)"]) || 0;
				acc[model].output += Number(row["Output Tokens"]) || 0;
				acc[model].total += Number(row["Total Tokens"]) || 0;
				acc[model].cost += rowCost;
				acc[model].count += 1;
				acc[model].costSamples.push(rowCost);
				return acc;
			}, {})
		)
			.map((m: any) => {
				const sortedCosts = [...m.costSamples].sort(
					(a: number, b: number) => a - b
				);
				const count = sortedCosts.length;
				const minPromptCost = count > 0 ? sortedCosts[0] : 0;
				const maxPromptCost = count > 0 ? sortedCosts[count - 1] : 0;
				const p50PromptCost =
					count > 0 ? sortedCosts[Math.floor(0.5 * (count - 1))] : 0;
				const p90PromptCost =
					count > 0 ? sortedCosts[Math.floor(0.9 * (count - 1))] : 0;

				return {
					...m,
					pricePer1MTokens:
						m.total > 0 ? (m.cost / m.total) * 1000000 : 0,
					avgOutputTokens: m.count > 0 ? m.output / m.count : 0,
					avgPromptCost: m.count > 0 ? m.cost / m.count : 0,
					minPromptCost,
					maxPromptCost,
					p50PromptCost,
					p90PromptCost,
				};
			})
			.filter((m: any) => m.total > 0 || m.cost > 0);

		const usageByKind = Object.values(
			validData.reduce((acc: any, row) => {
				const kind = row.Kind || "Unknown";
				if (!acc[kind]) acc[kind] = { name: kind, value: 0 };
				acc[kind].value += 1;
				return acc;
			}, {})
		) as { name: string; value: number }[];

		const providerTotals = new Map<string, { cost: number; tokens: number }>();
		const userTotals = new Map<string, { cost: number; tokens: number }>();

		validData.forEach((row) => {
			const provider = getProviderName(row.Model || "Unknown");
			const user = row.User || "Unknown";
			const cost = Number(row.Cost) || 0;
			const totalTokens = Number(row["Total Tokens"]) || 0;

			const providerTotal = providerTotals.get(provider) || {
				cost: 0,
				tokens: 0,
			};
			providerTotal.cost += cost;
			providerTotal.tokens += totalTokens;
			providerTotals.set(provider, providerTotal);

			const userTotal = userTotals.get(user) || { cost: 0, tokens: 0 };
			userTotal.cost += cost;
			userTotal.tokens += totalTokens;
			userTotals.set(user, userTotal);
		});

		const topProviders = Array.from(providerTotals.entries())
			.sort((a, b) => b[1].cost - a[1].cost)
			.slice(0, 5)
			.map(([name]) => name);

		const topUsers = Array.from(userTotals.entries())
			.sort((a, b) => b[1].cost - a[1].cost)
			.slice(0, 5)
			.map(([name]) => name);

		const providerSeries = topProviders.map((name) => {
			const safeKey = sanitizeSeriesKey(name);
			return {
				name,
				tokensKey: `providerTokens_${safeKey}`,
				costKey: `providerCost_${safeKey}`,
			};
		});

		const userSeries = topUsers.map((name) => {
			const safeKey = sanitizeSeriesKey(name);
			return {
				name,
				tokensKey: `userTokens_${safeKey}`,
				costKey: `userCost_${safeKey}`,
			};
		});

		const providerSeriesMap = new Map(
			providerSeries.map((series) => [series.name, series])
		);
		const userSeriesMap = new Map(
			userSeries.map((series) => [series.name, series])
		);

		const timeseries = Object.values(
			validData.reduce((acc: any, row) => {
				const dateStr =
					row.Date instanceof Date
						? row.Date.toISOString().split("T")[0]
						: String(row.Date).split("T")[0];
				const date = dateStr || "Unknown";
				if (!acc[date]) {
					acc[date] = {
						name: date,
						cost: 0,
						totalTokens: 0,
						inputWithCacheWrite: 0,
						outputTokens: 0,
					};
				}
				acc[date].cost += Number(row.Cost) || 0;
				acc[date].totalTokens += Number(row["Total Tokens"]) || 0;
				acc[date].inputWithCacheWrite +=
					Number(row["Input (w/ Cache Write)"]) || 0;
				acc[date].outputTokens += Number(row["Output Tokens"]) || 0;

				const provider = getProviderName(row.Model || "Unknown");
				const providerSeriesEntry = providerSeriesMap.get(provider);
				if (providerSeriesEntry) {
					acc[date][providerSeriesEntry.tokensKey] =
						(acc[date][providerSeriesEntry.tokensKey] || 0) +
						(Number(row["Total Tokens"]) || 0);
					acc[date][providerSeriesEntry.costKey] =
						(acc[date][providerSeriesEntry.costKey] || 0) +
						(Number(row.Cost) || 0);
				}

				const user = row.User || "Unknown";
				const userSeriesEntry = userSeriesMap.get(user);
				if (userSeriesEntry) {
					acc[date][userSeriesEntry.tokensKey] =
						(acc[date][userSeriesEntry.tokensKey] || 0) +
						(Number(row["Total Tokens"]) || 0);
					acc[date][userSeriesEntry.costKey] =
						(acc[date][userSeriesEntry.costKey] || 0) +
						(Number(row.Cost) || 0);
				}

				return acc;
			}, {})
		).sort((a: any, b: any) => a.name.localeCompare(b.name));

		timeseries.forEach((row: any) => {
			providerSeries.forEach((series) => {
				if (row[series.tokensKey] == null) row[series.tokensKey] = 0;
				if (row[series.costKey] == null) row[series.costKey] = 0;
			});
			userSeries.forEach((series) => {
				if (row[series.tokensKey] == null) row[series.tokensKey] = 0;
				if (row[series.costKey] == null) row[series.costKey] = 0;
			});
		});

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
		})) as any[];

		const timeseriesMeta = [
			...providerSeries.flatMap((series) => [
				{
					key: series.tokensKey,
					label: `${series.name} Tokens`,
					metric: "tokens",
					kind: "provider",
				},
				{
					key: series.costKey,
					label: `${series.name} Cost`,
					metric: "cost",
					kind: "provider",
				},
			]),
			...(userTotals.size > 1
				? userSeries.flatMap((series) => [
						{
							key: series.tokensKey,
							label: `${series.name} Tokens`,
							metric: "tokens",
							kind: "user",
						},
						{
							key: series.costKey,
							label: `${series.name} Cost`,
							metric: "cost",
							kind: "user",
						},
				  ])
				: []),
		];

		return { modelData, usageByKind, timeseries, providerData, timeseriesMeta };
	}, [data, selectedModels, fromDate, toDate, sanitizeSeriesKey]) as
		| ProcessedData
		| null;

	const modelBreakdownData = useMemo<ModelBreakdownRow[]>(() => {
		if (!processedData?.modelData) return [];
		return processedData.modelData.map((model) => {
			let costAgg = model.cost;
			switch (costAggregation) {
				case "average":
					costAgg = model.avgPromptCost;
					break;
				case "max":
					costAgg = model.maxPromptCost;
					break;
				case "min":
					costAgg = model.minPromptCost;
					break;
				case "p50":
					costAgg = model.p50PromptCost;
					break;
				case "p90":
					costAgg = model.p90PromptCost;
					break;
				case "sum":
				default:
					costAgg = model.cost;
					break;
			}
			return { ...model, costAgg };
		});
	}, [processedData?.modelData, costAggregation]);

	const sortedModelData = useMemo<ModelBreakdownRow[]>(() => {
		if (!modelBreakdownData.length) return [];
		if (!sortConfig.key || !sortConfig.direction) return modelBreakdownData;
		const directionFactor = sortConfig.direction === "asc" ? 1 : -1;
		const sortKey = sortConfig.key as keyof ModelBreakdownRow;
		return [...modelBreakdownData].sort((a, b) => {
			if (sortConfig.key === "name") {
				return a.name.localeCompare(b.name) * directionFactor;
			}
			const aValue = a[sortKey] ?? 0;
			const bValue = b[sortKey] ?? 0;
			if (aValue < bValue) return -1 * directionFactor;
			if (aValue > bValue) return 1 * directionFactor;
			return 0;
		});
	}, [modelBreakdownData, sortConfig]);

	const modelBreakdownSummaryData = useMemo(() => {
		if (!modelBreakdownData.length) return null;
		const metrics: Array<{
			key: keyof ModelBreakdownRow;
			label: string;
			unit: string;
			format: (v: number) => string;
		}> = [
			{
				key: "costAgg",
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
			const sorted = [...modelBreakdownData].sort(
				(a: any, b: any) => a[metric.key] - b[metric.key]
			);
			return {
				...metric,
				least: sorted[0],
				most: sorted[sorted.length - 1],
			};
		}) as MetricSummary[];
	}, [modelBreakdownData]);

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
				(a: any, b: any) => a[metric.key] - b[metric.key]
			);
			return {
				...metric,
				least: sorted[0],
				most: sorted[sorted.length - 1],
			};
		}) as MetricSummary[];
	}, [processedData?.modelData]);

	const requestSort = (key: string) => {
		setSortConfig((prev) => {
			if (prev.key !== key) {
				return { key, direction: "desc" };
			}
			if (prev.direction === "desc") {
				return { key, direction: "asc" };
			}
			if (prev.direction === "asc") {
				return { key: null, direction: null };
			}
			return { key, direction: "desc" };
		});
	};

	return (
		<div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans w-full">
			<DashboardHeader
				isUploading={isUploading}
				uploadStatus={uploadStatus}
				onFileUpload={onFileUpload}
				onOpenFilter={() => setIsModalOpen(true)}
				selectedModelsCount={selectedModels.length}
				fromDate={fromDate}
				setFromDate={setFromDate}
				toDate={toDate}
				setToDate={setToDate}
			/>

			{!processedData ? (
				<EmptyState />
			) : (
				<main className="w-full space-y-8">
					{summaryData && <SummaryCards summaryData={summaryData} />}

					<ProviderComparison providerData={processedData.providerData} />

					<UsageTrendsChart
						timeseries={processedData.timeseries}
						seriesMeta={processedData.timeseriesMeta}
					/>

					<DistributionCharts
						providerData={processedData.providerData}
						usageByKind={processedData.usageByKind}
					/>
					<ModelBreakdownTable
						sortedModelData={sortedModelData}
						sortConfig={sortConfig}
						requestSort={requestSort}
						summaryData={modelBreakdownSummaryData}
						costAggregation={costAggregation}
						onCostAggregationChange={setCostAggregation}
					/>
				</main>
			)}

			<FilterModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				allModels={allModels}
				selectedModels={selectedModels}
				setSelectedModels={setSelectedModels}
			/>
		</div>
	);
}
