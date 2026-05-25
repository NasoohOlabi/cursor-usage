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

/** Fallback when live docs fetch fails or omits a model */
export const DEFAULT_DOCS_PRICING: DocsPricingMap = {
	"claude-4-sonnet": { input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
	"claude-4.5-sonnet": { input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
	"claude-4.5-opus": { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 },
	"claude-4.6-opus": { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 },
	"claude-4.6-sonnet": { input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
	"claude-4.7-opus": { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 },
	"composer-1": { input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10 },
	"composer-1.5": { input: 3.5, cacheWrite: null, cacheRead: 0.35, output: 17.5 },
	"composer-2": { input: 0.5, cacheWrite: null, cacheRead: 0.2, output: 2.5 },
	"composer-2-fast": { input: 0.5, cacheWrite: null, cacheRead: 0.2, output: 2.5 },
	"composer-2.5": { input: 0.5, cacheWrite: null, cacheRead: 0.2, output: 2.5 },
	"composer-2.5-fast": { input: 3, cacheWrite: null, cacheRead: 0.5, output: 15 },
	"gemini-2.5-flash": { input: 0.3, cacheWrite: null, cacheRead: 0.03, output: 2.5 },
	"gemini-3-flash": { input: 0.5, cacheWrite: null, cacheRead: 0.05, output: 3 },
	"gemini-3-pro": { input: 2, cacheWrite: null, cacheRead: 0.2, output: 12 },
	"gemini-3.1-pro": { input: 2, cacheWrite: null, cacheRead: 0.2, output: 12 },
	"gpt-5": { input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10 },
	"gpt-5-fast": { input: 2.5, cacheWrite: null, cacheRead: 0.25, output: 20 },
	"gpt-5-mini": { input: 0.25, cacheWrite: null, cacheRead: 0.025, output: 2 },
	"gpt-5.2": { input: 1.75, cacheWrite: null, cacheRead: 0.175, output: 14 },
	"gpt-5.3-codex": { input: 1.75, cacheWrite: null, cacheRead: 0.175, output: 14 },
	"gpt-5.4": { input: 2.5, cacheWrite: null, cacheRead: 0.25, output: 15 },
	"gpt-5.5": { input: 5, cacheWrite: null, cacheRead: 0.5, output: 30 },
	"gpt-5.5-fast": { input: 12.5, cacheWrite: null, cacheRead: 1.25, output: 75 },
	"grok-4.3": { input: 1.25, cacheWrite: null, cacheRead: 0.2, output: 2.5 },
	"grok-code": { input: 0.2, cacheWrite: null, cacheRead: 0.02, output: 1.5 },
	auto: { input: 1.25, cacheWrite: 1.25, cacheRead: 0.25, output: 6 },
};

/** Docs paths fetched via Jina (markdown tables + prose) */
export const CURSOR_PRICING_DOC_PATHS = [
	"/docs/models-and-pricing",
	"/docs/models",
	"/docs/models/cursor-composer-2-5",
	"/docs/models/gpt-5-5",
	"/docs/models/gpt-5-4",
	"/docs/models/gpt-5-3-codex",
	"/docs/models/gpt-5-mini",
	"/docs/models/claude-4-6-sonnet",
	"/docs/models/claude-opus-4-7",
	"/docs/models/claude-4-5-sonnet",
	"/docs/models/claude-4-5-opus",
	"/docs/models/gemini-3-1-pro",
	"/docs/models/gemini-3-flash",
	"/docs/models/gemini-2-5-flash",
	"/docs/models/grok-4-3",
] as const;

const DISPLAY_NAME_TO_KEY: Record<string, string> = {
	"Composer 2.5 (Fast)": "composer-2.5-fast",
	"Composer 2.5": "composer-2.5",
	"Composer 2": "composer-2",
	"Composer 1.5": "composer-1.5",
	"Composer 1": "composer-1",
	"GPT-5.5 (Fast Mode)": "gpt-5.5-fast",
	"GPT-5.5 (Long Context (>272k))": "gpt-5.5-long-context",
	"GPT-5.5": "gpt-5.5",
	"GPT-5.4": "gpt-5.4",
	"GPT-5.3 Codex": "gpt-5.3-codex",
	"GPT-5.2": "gpt-5.2",
	"GPT-5 Fast": "gpt-5-fast",
	"GPT-5 Mini": "gpt-5-mini",
	"GPT-5": "gpt-5",
	"Claude 4.7 Opus": "claude-4.7-opus",
	"Claude 4.6 Sonnet": "claude-4.6-sonnet",
	"Claude 4.6 Opus": "claude-4.6-opus",
	"Claude 4.5 Sonnet": "claude-4.5-sonnet",
	"Claude 4.5 Opus": "claude-4.5-opus",
	"Claude 4 Sonnet": "claude-4-sonnet",
	"Gemini 3.1 Pro": "gemini-3.1-pro",
	"Gemini 3 Pro": "gemini-3-pro",
	"Gemini 3 Flash": "gemini-3-flash",
	"Gemini 2.5 Flash": "gemini-2.5-flash",
	"Grok 4.3": "grok-4.3",
	"Grok Code": "grok-code",
};

const PRICING_TABLE_ROW_RE =
	/\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/gi;

const toNumber = (raw: string | null | undefined) => {
	if (!raw) return null;
	const cleaned = raw.replace(/\$/g, "").trim();
	if (!cleaned || cleaned === "-") return null;
	const value = Number(cleaned);
	return Number.isFinite(value) ? value : null;
};

const escapeRegExp = (text: string) =>
	text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugFromDocsUrl = (url: string) => {
	const match = url.match(/\/docs\/models\/([^/?#]+)/i);
	return match?.[1]?.toLowerCase() ?? null;
};

export const resolvePricingKeyFromDocsRow = (
	label: string,
	url?: string
): string | null => {
	const trimmed = label.trim();
	if (!trimmed || trimmed === "Name") return null;

	const displayKey = DISPLAY_NAME_TO_KEY[trimmed];
	if (displayKey) return displayKey;

	const slug = url ? slugFromDocsUrl(url) : null;
	if (!slug) return null;

	if (slug === "cursor-composer-2-5") {
		return /\(fast\)/i.test(trimmed) ? "composer-2.5-fast" : "composer-2.5";
	}
	if (slug === "claude-opus-4-7") return "claude-4.7-opus";
	if (slug.startsWith("cursor-composer-")) {
		return slug.replace(/^cursor-composer-/, "composer-");
	}

	return slug;
};

export const parsePricingMarkdownTables = (
	content: string
): Partial<DocsPricingMap> => {
	const parsed: Partial<DocsPricingMap> = {};

	for (const match of content.matchAll(PRICING_TABLE_ROW_RE)) {
		const [, label, url, inputRaw, cacheWriteRaw, cacheReadRaw, outputRaw] =
			match;
		const key = resolvePricingKeyFromDocsRow(label, url);
		if (!key) continue;

		const input = toNumber(inputRaw);
		const cacheWrite = toNumber(cacheWriteRaw);
		const cacheRead = toNumber(cacheReadRaw);
		const output = toNumber(outputRaw);
		if (input == null || cacheRead == null || output == null) continue;

		parsed[key] = { input, cacheWrite, cacheRead, output };
	}

	return parsed;
};

export const normalizeModelForPricing = (rawModelName: string) => {
	const model = rawModelName.toLowerCase().trim();

	if (model.includes("agent_review") || model === "auto" || model.includes(" auto"))
		return "auto";
	if (model.includes("claude-4.7-opus") || model.includes("claude-opus-4-7"))
		return "claude-4.7-opus";
	if (model.includes("claude-4.6-sonnet") || model.includes("claude-4-6-sonnet"))
		return "claude-4.6-sonnet";
	if (model.includes("claude-4.6-opus")) return "claude-4.6-opus";
	if (model.includes("claude-4.5-opus")) return "claude-4.5-opus";
	if (model.includes("claude-4-sonnet")) return "claude-4-sonnet";
	if (model.includes("claude-4.5-sonnet")) return "claude-4.5-sonnet";
	if (model.includes("composer-1.5")) return "composer-1.5";
	if (model === "composer-1") return "composer-1";
	if (model.includes("composer-2.5-fast")) return "composer-2.5-fast";
	if (model.includes("composer-2.5")) return "composer-2.5";
	if (model.includes("composer-2-fast")) return "composer-2-fast";
	if (model.includes("composer-2")) return "composer-2";
	if (model.includes("gemini-3.1-pro")) return "gemini-3.1-pro";
	if (model.includes("gemini-3.5-flash") || model.includes("gemini-3-flash"))
		return "gemini-3-flash";
	if (model.includes("gemini-3-pro")) return "gemini-3-pro";
	if (model.includes("gemini-2.5-flash")) return "gemini-2.5-flash";
	if (model.includes("gpt-5.5") && model.includes("fast")) return "gpt-5.5-fast";
	if (model.includes("gpt-5.5")) return "gpt-5.5";
	if (model.includes("gpt-5.4")) return "gpt-5.4";
	if (model.includes("gpt-5-fast")) return "gpt-5-fast";
	if (model.includes("gpt-5-mini")) return "gpt-5-mini";
	if (model.includes("gpt-5.3-codex")) return "gpt-5.3-codex";
	if (model.includes("gpt-5.2")) return "gpt-5.2";
	if (model === "gpt-5") return "gpt-5";
	if (model.includes("gpt-5.1")) return "gpt-5";
	if (model.includes("grok-4.3") || model.includes("grok-4-20")) return "grok-4.3";
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

const parseLegacyLabelRows = (content: string): Partial<DocsPricingMap> => {
	const parsed: Partial<DocsPricingMap> = {};

	for (const [label, key] of Object.entries(DISPLAY_NAME_TO_KEY)) {
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

		parsed[key] = { input, cacheWrite, cacheRead, output };
	}

	return parsed;
};

const parseAutoPoolPricing = (content: string): Partial<DocsPricingMap> => {
	const autoInputWriteMatch = content.match(
		/Input \+ Cache Write\*\*: \$([0-9.]+)\s+per 1M tokens/i
	);
	const autoOutputMatch = content.match(/Output\*\*: \$([0-9.]+)\s+per 1M tokens/i);
	const autoCacheReadMatch = content.match(
		/Cache Read\*\*: \$([0-9.]+)\s+per 1M tokens/i
	);

	if (!autoInputWriteMatch || !autoOutputMatch || !autoCacheReadMatch) {
		return {};
	}

	const inputAndCacheWrite = Number(autoInputWriteMatch[1]);
	const output = Number(autoOutputMatch[1]);
	const cacheRead = Number(autoCacheReadMatch[1]);
	if (
		!Number.isFinite(inputAndCacheWrite) ||
		!Number.isFinite(output) ||
		!Number.isFinite(cacheRead)
	) {
		return {};
	}

	return {
		auto: {
			input: inputAndCacheWrite,
			cacheWrite: inputAndCacheWrite,
			cacheRead,
			output,
		},
	};
};

const parseComposerFastProse = (
	content: string,
	base: DocsPricingMap
): Partial<DocsPricingMap> => {
	const composer25FastMatch = content.match(
		/faster variant[\s\S]*?\$([0-9.]+)\/M input and \$([0-9.]+)\/M output/i
	);
	if (!composer25FastMatch) return {};

	const input = Number(composer25FastMatch[1]);
	const output = Number(composer25FastMatch[2]);
	if (!Number.isFinite(input) || !Number.isFinite(output)) return {};

	return {
		"composer-2.5-fast": {
			input,
			cacheWrite: null,
			cacheRead: base["composer-2.5-fast"]?.cacheRead ?? base["composer-2.5"]?.cacheRead ?? 0.5,
			output,
		},
	};
};

/** Merge pricing extracted from one docs page into a map */
export const parseCursorDocsPricing = (
	content: string,
	base: DocsPricingMap = { ...DEFAULT_DOCS_PRICING }
): DocsPricingMap => {
	const parsed: DocsPricingMap = { ...base };

	const merge = (partial: Partial<DocsPricingMap>) => {
		for (const [key, value] of Object.entries(partial)) {
			if (value) parsed[key] = value;
		}
	};

	merge(parsePricingMarkdownTables(content));
	merge(parseLegacyLabelRows(content));
	merge(parseAutoPoolPricing(content));
	merge(parseComposerFastProse(content, parsed));

	return parsed;
};

export const fetchCursorDocsPricing = async (): Promise<{
	pricing: DocsPricingMap;
	fetchedAt: string;
	sources: string[];
}> => {
	let pricing: DocsPricingMap = { ...DEFAULT_DOCS_PRICING };
	const jinaBase = "https://r.jina.ai/http://cursor.com";

	const pageResults = await Promise.all(
		CURSOR_PRICING_DOC_PATHS.map(async (path) => {
			const source = `${jinaBase}${path}`;
			try {
				const response = await fetch(source, {
					headers: { Accept: "text/plain, text/markdown, */*" },
				});
				if (!response.ok) return null;
				const content = await response.text();
				if (!content.trim()) return null;
				return { source, content };
			} catch {
				return null;
			}
		})
	);

	const sources: string[] = [];
	for (const page of pageResults) {
		if (!page) continue;
		pricing = parseCursorDocsPricing(page.content, pricing);
		sources.push(page.source);
	}

	// Direct HTML fallback (partial table via link+price patterns)
	if (sources.length === 0) {
		try {
			const response = await fetch("https://cursor.com/docs/models-and-pricing");
			if (response.ok) {
				const content = await response.text();
				pricing = parseCursorDocsPricing(content, pricing);
				sources.push("https://cursor.com/docs/models-and-pricing");
			}
		} catch {
			// Fall through to error below.
		}
	}

	if (sources.length === 0) {
		throw new Error("Unable to fetch pricing from Cursor docs");
	}

	return {
		pricing,
		fetchedAt: new Date().toISOString(),
		sources,
	};
};
