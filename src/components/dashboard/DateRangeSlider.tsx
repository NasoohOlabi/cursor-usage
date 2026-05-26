import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	type DateBounds,
	daySpan,
	effectiveDateRange,
	formatShortDate,
	indexToDate,
} from "../../lib/dateRange";

const COMMIT_DEBOUNCE_MS = 300;

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
	const { fromIndex, toIndex } = useMemo(
		() => effectiveDateRange(bounds, fromDate, toDate),
		[bounds, fromDate, toDate],
	);

	const [draftFromIndex, setDraftFromIndex] = useState(fromIndex);
	const [draftToIndex, setDraftToIndex] = useState(toIndex);
	const draggingRef = useRef(false);
	const draftRef = useRef({ from: fromIndex, to: toIndex });
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	draftRef.current = { from: draftFromIndex, to: draftToIndex };

	useEffect(() => {
		if (draggingRef.current) return;
		setDraftFromIndex(fromIndex);
		setDraftToIndex(toIndex);
	}, [fromIndex, toIndex]);

	const commitIndices = useCallback(
		(nextFromIndex: number, nextToIndex: number) => {
			const f = Math.min(nextFromIndex, nextToIndex);
			const t = Math.max(nextFromIndex, nextToIndex);
			onFromDateChange(indexToDate(bounds, f));
			onToDateChange(indexToDate(bounds, t));
		},
		[bounds, onFromDateChange, onToDateChange],
	);

	const flushCommit = useCallback(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		}
		const { from: f, to: t } = draftRef.current;
		commitIndices(f, t);
	}, [commitIndices]);

	const scheduleCommit = useCallback(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			debounceRef.current = null;
			const { from: f, to: t } = draftRef.current;
			commitIndices(f, t);
		}, COMMIT_DEBOUNCE_MS);
	}, [commitIndices]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	useEffect(() => {
		const onPointerUp = () => {
			if (!draggingRef.current) return;
			draggingRef.current = false;
			flushCommit();
		};
		window.addEventListener("pointerup", onPointerUp);
		return () => window.removeEventListener("pointerup", onPointerUp);
	}, [flushCommit]);

	const applyDraft = useCallback(
		(nextFromIndex: number, nextToIndex: number) => {
			setDraftFromIndex(nextFromIndex);
			setDraftToIndex(nextToIndex);
			scheduleCommit();
		},
		[scheduleCommit],
	);

	const fromPct = span === 0 ? 0 : (draftFromIndex / span) * 100;
	const toPct = span === 0 ? 100 : (draftToIndex / span) * 100;

	const draftFrom = useMemo(
		() => indexToDate(bounds, Math.min(draftFromIndex, draftToIndex)),
		[bounds, draftFromIndex, draftToIndex],
	);

	const draftTo = useMemo(
		() => indexToDate(bounds, Math.max(draftFromIndex, draftToIndex)),
		[bounds, draftFromIndex, draftToIndex],
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
					? "flex flex-col gap-0.5 w-full min-w-[16rem] max-w-4xl"
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
				<span>{formatShortDate(draftFrom)}</span>
				<span>{formatShortDate(draftTo)}</span>
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
					value={draftFromIndex}
					onPointerDown={() => {
						draggingRef.current = true;
					}}
					onChange={(e) =>
						applyDraft(Number(e.target.value), draftToIndex)
					}
					aria-label="Filter start date"
					className="date-range-thumb date-range-thumb--from absolute inset-x-0 top-0 w-full h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
				/>
				<input
					type="range"
					min={0}
					max={span}
					value={draftToIndex}
					onPointerDown={() => {
						draggingRef.current = true;
					}}
					onChange={(e) =>
						applyDraft(draftFromIndex, Number(e.target.value))
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
