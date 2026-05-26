import { Link } from "@tanstack/react-router";
import { Activity, Moon, Sun } from "lucide-react";

import { useDateRange } from "./DateRangeContext";
import { DateRangeSlider } from "./dashboard/DateRangeSlider";
import { useTheme } from "./ThemeContext";

export default function Header() {
	const { theme, setTheme } = useTheme();
	const { dateBounds, fromDate, toDate, setFromDate, setToDate } =
		useDateRange();

	return (
		<header className="p-3 md:p-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4 bg-gradient-to-r from-slate-100 via-white to-slate-100/90 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-cyan-500/20 shadow-sm dark:shadow-[0_4px_24px_-4px_rgba(34,211,238,0.15)]">
			<h1 className="text-xl font-semibold shrink-0 justify-self-start">
				<Link
					to="/"
					className="group flex items-center gap-2.5 rounded-xl px-1 py-0.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
				>
					<span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 p-[2px] shadow-lg shadow-cyan-500/25 dark:shadow-cyan-400/20">
						<span className="flex h-full w-full items-center justify-center rounded-[10px] bg-white dark:bg-gray-900">
							<Activity
								size={20}
								className="text-cyan-600 dark:text-cyan-400"
								strokeWidth={2.5}
							/>
						</span>
					</span>
					<span className="flex flex-col leading-none">
						<span className="flex items-baseline gap-1.5">
							<span className="bg-gradient-to-r from-cyan-600 via-violet-600 to-fuchsia-600 dark:from-cyan-300 dark:via-violet-300 dark:to-fuchsia-300 bg-clip-text text-lg font-black uppercase tracking-tighter text-transparent">
								Cursor
							</span>
							<span className="text-lg font-black uppercase italic tracking-tight text-slate-800 dark:text-white">
								Usage
							</span>
						</span>
						<span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-cyan-400/80">
							analytics
						</span>
					</span>
				</Link>
			</h1>

			{dateBounds ? (
				<div className="flex justify-center min-w-0 w-full px-2 md:px-4">
					<DateRangeSlider
						variant="compact"
						bounds={dateBounds}
						fromDate={fromDate}
						toDate={toDate}
						onFromDateChange={setFromDate}
						onToDateChange={setToDate}
					/>
				</div>
			) : (
				<div aria-hidden />
			)}

			<div className="shrink-0 flex items-center gap-1 justify-self-end">
				<button
					type="button"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					className="p-2.5 rounded-xl border border-slate-300/80 dark:border-slate-600 bg-white/70 dark:bg-gray-800/80 hover:border-cyan-500/50 hover:shadow-md hover:shadow-cyan-500/10 dark:hover:shadow-cyan-400/5 transition-all"
					aria-label={
						theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
					}
					title={theme === "dark" ? "Light mode" : "Dark mode"}
				>
					{theme === "dark" ? (
						<Sun size={20} className="text-amber-300" />
					) : (
						<Moon size={20} className="text-indigo-600" />
					)}
				</button>
			</div>
		</header>
	);
}
