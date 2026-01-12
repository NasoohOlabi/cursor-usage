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
	tokens: number;
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
	key: string;
	direction: "asc" | "desc";
}
