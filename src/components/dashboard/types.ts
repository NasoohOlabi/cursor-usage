export interface ModelData {
	name: string;
	input: number;
	output: number;
	total: number;
	cost: number;
	count: number;
	pricePer1MTokens: number;
	avgOutputTokens: number;
	avgPromptCost: number;
	minPromptCost: number;
	maxPromptCost: number;
	p50PromptCost: number;
	p90PromptCost: number;
}

export interface ProviderData {
	name: string;
	input: number;
	output: number;
	total: number;
	cost: number;
	count: number;
	pricePer1MTokens: number;
	avgOutputTokens: number;
	avgPromptCost: number;
}

export interface TimeseriesData {
	name: string;
	cost: number;
	totalTokens: number;
	inputWithCacheWrite: number;
	outputTokens: number;
	[key: string]: string | number;
}

export interface TimeseriesSeriesMeta {
	key: string;
	label: string;
	metric: "tokens" | "cost";
	kind: "provider" | "user";
}

export interface UsageByKind {
	name: string;
	value: number;
}

export interface ProcessedData {
	modelData: ModelData[];
	usageByKind: UsageByKind[];
	timeseries: TimeseriesData[];
	providerData: ProviderData[];
	timeseriesMeta: TimeseriesSeriesMeta[];
}

export interface MetricSummary {
	key: string;
	label: string;
	unit: string;
	format: (v: number) => string;
	least: any;
	most: any;
}

export interface SortConfig {
	key: string | null;
	direction: "asc" | "desc" | null;
}

export type CostAggregation = "sum" | "average" | "max" | "min" | "p50" | "p90";

export type ModelBreakdownRow = ModelData & {
	costAgg: number;
};
