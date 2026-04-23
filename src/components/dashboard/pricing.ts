export interface TokenTotals {
	inputWithoutCacheWrite: number;
	inputWithCacheWrite: number;
	cacheRead: number;
	output: number;
	totalTokens: number;
}

export interface DocsModelPricing {
	input: number;
	cacheWrite: number | null;
	cacheRead: number;
	output: number;
}

export type DocsPricingMap = Record<string, DocsModelPricing>;

export const DEFAULT_DOCS_PRICING: DocsPricingMap = {
	"claude-4-sonnet": { input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
	"claude-4.5-sonnet": { input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
	"claude-4.5-opus": { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 },
	"claude-4.6-opus": { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 },
	"composer-1": { input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10 },
	"composer-1.5": { input: 3.5, cacheWrite: null, cacheRead: 0.35, output: 17.5 },
	"composer-2": { input: 0.5, cacheWrite: null, cacheRead: 0.2, output: 2.5 },
	"composer-2-fast": { input: 0.5, cacheWrite: null, cacheRead: 0.2, output: 2.5 },
	"gemini-2.5-flash": { input: 0.3, cacheWrite: null, cacheRead: 0.03, output: 2.5 },
	"gemini-3-flash": { input: 0.5, cacheWrite: null, cacheRead: 0.05, output: 3 },
	"gemini-3-pro": { input: 2, cacheWrite: null, cacheRead: 0.2, output: 12 },
	"gpt-5": { input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10 },
	"gpt-5-fast": { input: 2.5, cacheWrite: null, cacheRead: 0.25, output: 20 },
	"gpt-5-mini": { input: 0.25, cacheWrite: null, cacheRead: 0.025, output: 2 },
	"gpt-5.2": { input: 1.75, cacheWrite: null, cacheRead: 0.175, output: 14 },
	"gpt-5.3-codex": { input: 1.75, cacheWrite: null, cacheRead: 0.175, output: 14 },
	"grok-code": { input: 0.2, cacheWrite: null, cacheRead: 0.02, output: 1.5 },
	auto: { input: 1.25, cacheWrite: 1.25, cacheRead: 0.25, output: 6 },
};

const MODEL_LABELS: Record<string, string> = {
	"Claude 4 Sonnet": "claude-4-sonnet",
	"Claude 4.5 Sonnet": "claude-4.5-sonnet",
	"Claude 4.5 Opus": "claude-4.5-opus",
	"Claude 4.6 Opus": "claude-4.6-opus",
	"Composer 1": "composer-1",
	"Composer 1.5": "composer-1.5",
	"Composer 2": "composer-2",
	"Gemini 2.5 Flash": "gemini-2.5-flash",
	"Gemini 3 Flash": "gemini-3-flash",
	"Gemini 3 Pro": "gemini-3-pro",
	"GPT-5": "gpt-5",
	"GPT-5 Fast": "gpt-5-fast",
	"GPT-5 Mini": "gpt-5-mini",
	"GPT-5.2": "gpt-5.2",
	"GPT-5.3 Codex": "gpt-5.3-codex",
	"Grok Code": "grok-code",
};

const toNumber = (raw: string | null | undefined) => {
	if (!raw) return null;
	const cleaned = raw.replace(/\$/g, "").trim();
	if (!cleaned || cleaned === "-") return null;
	const value = Number(cleaned);
	return Number.isFinite(value) ? value : null;
};

const escapeRegExp = (text: string) =>
	text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeModelForPricing = (rawModelName: string) => {
	const model = rawModelName.toLowerCase().trim();

	if (model.includes("agent_review") || model === "auto" || model.includes(" auto"))
		return "auto";
	if (model.includes("claude-4.5-opus")) return "claude-4.5-opus";
	if (model.includes("claude-4.6-opus")) return "claude-4.6-opus";
	if (model.includes("claude-4-sonnet")) return "claude-4-sonnet";
	if (model.includes("claude-4.5-sonnet")) return "claude-4.5-sonnet";
	if (model.includes("composer-1.5")) return "composer-1.5";
	if (model === "composer-1") return "composer-1";
	if (model.includes("composer-2-fast")) return "composer-2-fast";
	if (model.includes("composer-2")) return "composer-2";
	if (model.includes("gemini-2.5-flash")) return "gemini-2.5-flash";
	if (model.includes("gemini-3-flash")) return "gemini-3-flash";
	if (model.includes("gemini-3-pro")) return "gemini-3-pro";
	if (model.includes("gpt-5-fast")) return "gpt-5-fast";
	if (model.includes("gpt-5-mini")) return "gpt-5-mini";
	if (model === "gpt-5") return "gpt-5";
	if (model.includes("gpt-5.3-codex")) return "gpt-5.3-codex";
	if (model.includes("gpt-5.2")) return "gpt-5.2";
	if (model.includes("gpt-5.1")) return "gpt-5";
	if (model.includes("grok-code")) return "grok-code";

	return null;
};

export const getTokenTotals = (row: Record<string, unknown>): TokenTotals => {
	const inputWithoutCacheWrite = Number(row["Input (w/o Cache Write)"]) || 0;
	const inputWithCacheWrite = Number(row["Input (w/ Cache Write)"]) || 0;
	const cacheRead = Number(row["Cache Read"]) || 0;
	const output = Number(row["Output Tokens"]) || 0;
	const totalTokens = Number(row["Total Tokens"]) || 0;

	return {
		inputWithoutCacheWrite,
		inputWithCacheWrite,
		cacheRead,
		output,
		totalTokens,
	};
};

export const calculateDocsPricePer1M = (
	modelName: string,
	_tokenTotals: TokenTotals,
	pricingMap: DocsPricingMap
) => {
	const pricingKey = normalizeModelForPricing(modelName);
	if (!pricingKey) return { pricePer1M: null, hasDocsPrice: false };

	const pricing = pricingMap[pricingKey];
	if (!pricing) return { pricePer1M: null, hasDocsPrice: false };

	return {
		pricePer1M: pricing.input,
		hasDocsPrice: true,
	};
};

export const parseCursorDocsPricing = (content: string) => {
	const parsed: DocsPricingMap = { ...DEFAULT_DOCS_PRICING };

	for (const [label, key] of Object.entries(MODEL_LABELS)) {
		const regex = new RegExp(
			`${escapeRegExp(label)}\\s*\\n\\|([^|\\n]+)\\|([^|\\n]+)\\|([^|\\n]+)\\|([^|\\n]+)\\|`,
			"i"
		);
		const match = content.match(regex);
		if (!match) continue;

		const input = toNumber(match[1]);
		const cacheWrite = toNumber(match[2]);
		const cacheRead = toNumber(match[3]);
		const output = toNumber(match[4]);

		if (input == null || cacheRead == null || output == null) continue;

		parsed[key] = {
			input,
			cacheWrite,
			cacheRead,
			output,
		};
	}

	const autoInputWriteMatch = content.match(
		/Input \+ Cache Write\*\*: \$([0-9.]+)\s+per 1M tokens/i
	);
	const autoOutputMatch = content.match(
		/Output\*\*: \$([0-9.]+)\s+per 1M tokens/i
	);
	const autoCacheReadMatch = content.match(
		/Cache Read\*\*: \$([0-9.]+)\s+per 1M tokens/i
	);

	if (autoInputWriteMatch && autoOutputMatch && autoCacheReadMatch) {
		const inputAndCacheWrite = Number(autoInputWriteMatch[1]);
		const output = Number(autoOutputMatch[1]);
		const cacheRead = Number(autoCacheReadMatch[1]);
		if (
			Number.isFinite(inputAndCacheWrite) &&
			Number.isFinite(output) &&
			Number.isFinite(cacheRead)
		) {
			parsed.auto = {
				input: inputAndCacheWrite,
				cacheWrite: inputAndCacheWrite,
				cacheRead,
				output,
			};
		}
	}

	return parsed;
};
