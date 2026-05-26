/** Public folder asset URL (respects Vite `base`, e.g. `/cursor-usage/` on Pages). */
const publicAsset = (file: string) =>
	`${import.meta.env.BASE_URL}${file.replace(/^\//, "")}`;

export const getProviderName = (modelName: string) => {
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

/** Single asset, or separate light/dark assets (light = for default / light UI). */
export type ModelIconAsset =
	| { mode: "single"; src: string }
	| { mode: "theme"; light: string; dark: string };

export const getModelIconAsset = (modelName: string): ModelIconAsset | null => {
	const name = modelName.toLowerCase();
	if (name.includes("deepseek"))
		return { mode: "single", src: publicAsset("deepseek.svg") };
	if (name.includes("gemini"))
		return { mode: "single", src: publicAsset("gemini.svg") };
	if (name.includes("claude") || name.includes("anthropic"))
		return { mode: "single", src: publicAsset("anthropic.svg") };
	if (
		name.includes("gpt") ||
		name.includes("openai") ||
		name.includes("o1") ||
		name.includes("o3")
	)
		return {
			mode: "theme",
			light: publicAsset("openAi.svg"),
			dark: publicAsset("openAi.dark.svg"),
		};
	if (name.includes("grok"))
		return {
			mode: "theme",
			light: publicAsset("grok.light.png"),
			dark: publicAsset("grok.dark.png"),
		};
	if (
		name.includes("cursor") ||
		name.includes("composer") ||
		name.includes("agent_review") ||
		name.includes("auto")
	)
		return {
			mode: "theme",
			light: publicAsset("cursor.light.png"),
			dark: publicAsset("cursor.dark.png"),
		};
	return null;
};

export const COLORS = [
	"#22d3ee",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#f43f5e",
	"#f97316",
	"#eab308",
];

/** Nearest-rank percentile on a pre-sorted array (same as model breakdown). */
export function getPercentileValue(
	sortedValues: number[],
	percentile: number,
): number {
	if (sortedValues.length === 0) return 0;
	const idx = Math.floor(percentile * (sortedValues.length - 1));
	return sortedValues[idx] ?? 0;
}

export function summarizeMetricExtents<T extends Record<string, unknown>>(
	values: T[],
	key: keyof T & string
): { least: T; most: T; p01: T; p99: T } | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort(
		(a, b) => Number(a[key]) - Number(b[key])
	);
	const at = (p: number) =>
		sorted[Math.floor(p * (sorted.length - 1))] ?? sorted[0];
	return {
		least: sorted[0],
		most: sorted[sorted.length - 1],
		p01: at(0.01),
		p99: at(0.99),
	};
}

export const getScaledColor = (
	key: string,
	value: number,
	summaryData: any[] | null
) => {
	if (!summaryData) return "inherit";
	const metric = summaryData.find((m) => m.key === key);
	if (!metric) return "inherit";

	const min = (metric.p01 ?? metric.least)[key];
	const max = (metric.p99 ?? metric.most)[key];

	if (max === min) return "inherit";

	let ratio = (value - min) / (max - min);

	// For these metrics, lower is better (green) and higher is worse (red).
	const lowerIsBetterMetrics = [
		"cost",
		"pricePer1MTokens",
		"p50ObservedCostPer1M",
		"avgPromptCost",
		"costAgg",
		"input",
		"output",
		"total",
	];
	if (lowerIsBetterMetrics.includes(key)) {
		ratio = 1 - ratio;
	}

	// Interpolate between Red (hsl(0, 70%, 50%)) and Green (hsl(140, 70%, 50%))
	const hue = ratio * 140; // 0 to 140 (Red to Green)
	return `hsl(${hue}, 80%, 60%)`;
};
