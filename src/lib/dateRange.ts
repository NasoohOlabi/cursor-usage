export type DateBounds = { min: string; max: string };

const MS_PER_DAY = 86_400_000;

export function rowDateString(date: unknown): string | null {
	if (!date) return null;
	if (date instanceof Date) return date.toISOString().split("T")[0] ?? null;
	const s = String(date).split("T")[0];
	return s.length >= 10 ? s : null;
}

export function computeDateBounds(dates: Iterable<string>): DateBounds | null {
	let min = "";
	let max = "";
	for (const d of dates) {
		if (!d) continue;
		if (!min || d < min) min = d;
		if (!max || d > max) max = d;
	}
	return min && max ? { min, max } : null;
}

function parseIsoUtc(iso: string): number {
	const y = Number(iso.slice(0, 4));
	const m = Number(iso.slice(5, 7));
	const d = Number(iso.slice(8, 10));
	return Date.UTC(y, m - 1, d);
}

export function daySpan(bounds: DateBounds): number {
	return Math.max(0, Math.round((parseIsoUtc(bounds.max) - parseIsoUtc(bounds.min)) / MS_PER_DAY));
}

export function dayIndex(bounds: DateBounds, iso: string): number {
	return Math.round((parseIsoUtc(iso) - parseIsoUtc(bounds.min)) / MS_PER_DAY);
}

export function indexToDate(bounds: DateBounds, index: number): string {
	const t = parseIsoUtc(bounds.min) + index * MS_PER_DAY;
	const d = new Date(t);
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, "0");
	const day = String(d.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function clampDateToBounds(iso: string, bounds: DateBounds): string {
	if (iso < bounds.min) return bounds.min;
	if (iso > bounds.max) return bounds.max;
	return iso;
}

export function effectiveDateRange(
	bounds: DateBounds,
	fromDate: string,
	toDate: string,
): { from: string; to: string; fromIndex: number; toIndex: number } {
	const span = daySpan(bounds);
	const from = fromDate ? clampDateToBounds(fromDate, bounds) : bounds.min;
	const to = toDate ? clampDateToBounds(toDate, bounds) : bounds.max;
	const fromIndex = Math.min(dayIndex(bounds, from), span);
	const toIndex = Math.max(fromIndex, Math.min(dayIndex(bounds, to), span));
	return { from, to, fromIndex, toIndex };
}

export function formatShortDate(iso: string): string {
	const m = Number(iso.slice(5, 7));
	const d = Number(iso.slice(8, 10));
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return `${months[m - 1] ?? ""} ${d}`;
}
