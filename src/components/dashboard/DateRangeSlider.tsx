import { useCallback, useMemo } from "react";
import {
	type DateBounds,
	daySpan,
	effectiveDateRange,
	formatShortDate,
	indexToDate,
} from "../../lib/dateRange";

interface DateRangeSliderProps {
	bounds: DateBounds;
	fromDate: string;
	toDate: string;
	onFromDateChange: (date: string) => void;
	onToDateChange: (date: string) => void;
	variant?: "default" | "compact";
}

export const DateRangeSlider = ({
	bounds,
	fromDate,
	toDate,
	onFromDateChange,
	onToDateChange,
	variant = "default",
}: DateRangeSliderProps) => {
	const compact = variant === "compact";
	const span = daySpan(bounds);
	const { from, to, fromIndex, toIndex } = useMemo(
		() => effectiveDateRange(bounds, fromDate, toDate),
		[bounds, fromDate, toDate],
	);

	const fromPct = span === 0 ? 0 : (fromIndex / span) * 100;
	const toPct = span === 0 ? 100 : (toIndex / span) * 100;

	const applyIndices = useCallback(
		(nextFromIndex: number, nextToIndex: number) => {
			const f = Math.min(nextFromIndex, nextToIndex);
			const t = Math.max(nextFromIndex, nextToIndex);
			onFromDateChange(indexToDate(bounds, f));
			onToDateChange(indexToDate(bounds, t));
		},
		[bounds, onFromDateChange, onToDateChange],
	);

	if (span === 0) {
		return (
			<span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
				{formatShortDate(bounds.min)}
			</span>
		);
	}

	return (
		<div
			className={
				compact
					? "flex flex-col gap-0.5 w-full min-w-0 max-w-md"
					: "flex flex-col gap-1 min-w-[12rem] max-w-[20rem] flex-1"
			}
		>
			<div
				className={
					compact
						? "flex justify-between text-[9px] font-medium text-slate-500 dark:text-slate-400 tabular-nums uppercase tracking-wide"
						: "flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 tabular-nums uppercase tracking-wide"
				}
			>
				<span>{formatShortDate(from)}</span>
				<span>{formatShortDate(to)}</span>
			</div>
			<div className="date-range-track relative h-6 flex items-center">
				<div
					className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700 pointer-events-none"
					aria-hidden
				/>
				<div
					className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-violet-500 dark:bg-violet-400 pointer-events-none"
					style={{ left: `${fromPct}%`, width: `${Math.max(0, toPct - fromPct)}%` }}
					aria-hidden
				/>
				<input
					type="range"
					min={0}
					max={span}
					value={fromIndex}
					onChange={(e) =>
						applyIndices(Number(e.target.value), toIndex)
					}
					aria-label="Filter start date"
					className="date-range-thumb date-range-thumb--from absolute inset-x-0 top-0 w-full h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
				/>
				<input
					type="range"
					min={0}
					max={span}
					value={toIndex}
					onChange={(e) =>
						applyIndices(fromIndex, Number(e.target.value))
					}
					aria-label="Filter end date"
					className="date-range-thumb date-range-thumb--to absolute inset-x-0 top-0 w-full h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
				/>
			</div>
			{!compact && (
				<div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 tabular-nums">
					<span>{bounds.min}</span>
					<span>{bounds.max}</span>
				</div>
			)}
		</div>
	);
};
