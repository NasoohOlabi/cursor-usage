export interface ModelData {
	name: string;
	input: number;
	output: number;
	total: number;
	cost: number;
	count: number;
	pricePer1MTokens: number;
	hasDocsPrice: boolean;
	avgOutputTokens: number;
	avgPromptCost: number;
	minPromptCost: number;
	maxPromptCost: number;
	p50PromptCost: number;
	p90PromptCost: number;
	p50PromptTokens: number;
	p90PromptTokens: number;
	p50ObservedCostPer1M: number;
	p90ObservedCostPer1M: number;
}

export interface ProviderData {
	name: string;
	input: number;
	output: number;
	total: number;
	cost: number;
	count: number;
	pricePer1MTokens: number;
	hasDocsPrice: boolean;
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

/** Per-model daily series keys on `TimeseriesData` (top models by spend in range). */
export interface ModelTimeseriesSeries {
	name: string;
	tokensKey: string;
	costKey: string;
}

export interface ProcessedData {
	modelData: ModelData[];
	usageByKind: UsageByKind[];
	timeseries: TimeseriesData[];
	providerData: ProviderData[];
	timeseriesMeta: TimeseriesSeriesMeta[];
	modelSeries: ModelTimeseriesSeries[];
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
