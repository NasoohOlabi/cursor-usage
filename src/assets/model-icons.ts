import anthropicIcon from "./models/anthropic.svg?url";
import cursorDarkIcon from "./models/cursor.dark.png?url";
import cursorLightIcon from "./models/cursor.light.png?url";
import deepseekIcon from "./models/deepseek.svg?url";
import geminiIcon from "./models/gemini.svg?url";
import grokDarkIcon from "./models/grok.dark.png?url";
import grokLightIcon from "./models/grok.light.png?url";
import openAiDarkIcon from "./models/openAi.dark.svg?url";
import openAiLightIcon from "./models/openAi.svg?url";

export const modelIcons = {
	deepseek: deepseekIcon,
	gemini: geminiIcon,
	anthropic: anthropicIcon,
	openAi: { light: openAiLightIcon, dark: openAiDarkIcon },
	grok: { light: grokLightIcon, dark: grokDarkIcon },
	cursor: { light: cursorLightIcon, dark: cursorDarkIcon },
} as const;
