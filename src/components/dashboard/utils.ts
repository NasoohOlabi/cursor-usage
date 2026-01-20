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

export const getModelIcon = (modelName: string) => {
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

export const COLORS = [
	"#22d3ee",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#f43f5e",
	"#f97316",
	"#eab308",
];

export const getScaledColor = (
	key: string,
	value: number,
	summaryData: any[] | null
) => {
	if (!summaryData) return "inherit";
	const metric = summaryData.find((m) => m.key === key);
	if (!metric) return "inherit";

	const min = metric.least[key];
	const max = metric.most[key];

	if (max === min) return "inherit";

	let ratio = (value - min) / (max - min);

	// For cost-related metrics, lower is better (green)
	const costMetrics = ["cost", "pricePer1MTokens", "avgPromptCost", "costAgg"];
	if (costMetrics.includes(key)) {
		ratio = 1 - ratio;
	}

	// Interpolate between Red (hsl(0, 70%, 50%)) and Green (hsl(140, 70%, 50%))
	const hue = ratio * 140; // 0 to 140 (Red to Green)
	return `hsl(${hue}, 80%, 60%)`;
};
