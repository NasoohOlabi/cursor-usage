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
	MetricSummary,
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
		key: "cost",
		direction: "desc",
	});

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedModels, setSelectedModels] = useState<string[]>([]);
	const [fromDate, setFromDate] = useState<string>("");
	const [toDate, setToDate] = useState<string>("");

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

		const usageByKind = Object.values(
			validData.reduce((acc: any, row) => {
				const kind = row.Kind || "Unknown";
				if (!acc[kind]) acc[kind] = { name: kind, value: 0 };
				acc[kind].value += 1;
				return acc;
			}, {})
		) as { name: string; value: number }[];

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

		return { modelData, usageByKind, timeseries, providerData };
	}, [data, selectedModels, fromDate, toDate]) as ProcessedData | null;

	const sortedModelData = useMemo(() => {
		if (!processedData?.modelData) return [];
		return [...processedData.modelData].sort((a: any, b: any) => {
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
		let direction: "asc" | "desc" = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
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

					<UsageTrendsChart timeseries={processedData.timeseries} />

					<DistributionCharts
						providerData={processedData.providerData}
						usageByKind={processedData.usageByKind}
					/>
					<ModelBreakdownTable
						sortedModelData={sortedModelData}
						sortConfig={sortConfig}
						requestSort={requestSort}
						summaryData={summaryData}
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
