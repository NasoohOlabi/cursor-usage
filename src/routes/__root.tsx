import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { DateRangeProvider } from "../components/DateRangeContext";
import Header from "../components/Header";
import { ThemeProvider } from "../components/ThemeContext";

export const Route = createRootRoute({
	notFoundComponent: () => (
		<main className="mx-auto max-w-lg px-6 py-16 text-slate-800 dark:text-slate-200">
			<h1 className="text-xl font-semibold text-slate-900 dark:text-white">
				Page not found
			</h1>
			<p className="mt-2 text-slate-600 dark:text-slate-400">
				That URL does not match any route in this app.
			</p>
		</main>
	),
	component: RootLayout,
});

function RootLayout() {
	return (
		<ThemeProvider>
			<DateRangeProvider>
				<Header />
				<Outlet />
				{import.meta.env.DEV ? (
					<TanStackRouterDevtools position="bottom-right" />
				) : null}
			</DateRangeProvider>
		</ThemeProvider>
	);
}
