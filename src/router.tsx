import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

/** Vite `base` (e.g. `/cursor-usage/` on GitHub Pages) without trailing slash. */
const basepath =
	import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL.replace(/\/$/, "");

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		basepath,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
	});

	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
