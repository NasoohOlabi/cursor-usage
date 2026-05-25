import Papa from "papaparse";

export type UsageRow = Record<string, unknown>;

const parseOptions = {
	header: true,
	dynamicTyping: true,
	skipEmptyLines: true,
} as const;

export function parseCsvText(content: string): UsageRow[] {
	const parsed = Papa.parse<UsageRow>(content, parseOptions);
	if (parsed.errors.length > 0) {
		console.warn("CSV parse warnings:", parsed.errors.slice(0, 3));
	}
	return parsed.data.filter((row) => row && Object.keys(row).length > 0);
}

export async function parseCsvFile(file: File): Promise<UsageRow[]> {
	return parseCsvText(await file.text());
}

export const SAMPLE_CSV_URL = `${import.meta.env.BASE_URL}sample-usage-events.csv`;

export async function fetchSampleCsv(): Promise<UsageRow[]> {
	const response = await fetch(SAMPLE_CSV_URL);
	if (!response.ok) {
		throw new Error(`Failed to load sample data (${response.status})`);
	}
	return parseCsvText(await response.text());
}

const STORAGE_KEY = "cursor-usage-rows-v1";

export function loadStoredCsvRows(): UsageRow[] | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const rows = JSON.parse(raw) as UsageRow[];
		return Array.isArray(rows) && rows.length > 0 ? rows : null;
	} catch {
		return null;
	}
}

export function storeCsvRows(rows: UsageRow[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
	} catch (error) {
		console.warn("Could not persist CSV to localStorage", error);
	}
}

export function clearStoredCsvRows(): void {
	localStorage.removeItem(STORAGE_KEY);
}
