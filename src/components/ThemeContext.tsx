import {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = {
	theme: Theme;
	setTheme: (t: Theme) => void;
	isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";

function readStoredTheme(): Theme {
	if (typeof window === "undefined") return "light";
	const s = localStorage.getItem(STORAGE_KEY) as Theme | null;
	return s === "dark" || s === "light" ? s : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	/* Default "light" matches server render; useLayoutEffect syncs before first paint. */
	const [theme, setThemeState] = useState<Theme>("light");

	useLayoutEffect(() => {
		setThemeState(readStoredTheme());
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
		localStorage.setItem(STORAGE_KEY, theme);
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) {
			meta.setAttribute(
				"content",
				theme === "dark" ? "#0f172a" : "#f8fafc"
			);
		}
	}, [theme]);

	const setTheme = (t: Theme) => setThemeState(t);

	const value = useMemo(
		() => ({ theme, setTheme, isDark: theme === "dark" }),
		[theme]
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) {
		throw new Error("useTheme must be used within ThemeProvider");
	}
	return ctx;
}
