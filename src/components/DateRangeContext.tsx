import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import {
	type DateBounds,
	clampDateToBounds,
} from "../lib/dateRange";

type DateRangeContextValue = {
	fromDate: string;
	toDate: string;
	setFromDate: (date: string) => void;
	setToDate: (date: string) => void;
	dateBounds: DateBounds | null;
	setDateBounds: (bounds: DateBounds | null) => void;
};

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [dateBounds, setDateBounds] = useState<DateBounds | null>(null);

	useEffect(() => {
		const savedFromDate = localStorage.getItem("fromDate");
		if (savedFromDate) setFromDate(savedFromDate);

		const savedToDate = localStorage.getItem("toDate");
		if (savedToDate) setToDate(savedToDate);
	}, []);

	useEffect(() => {
		if (!dateBounds) return;
		setFromDate((prev) => (prev ? clampDateToBounds(prev, dateBounds) : prev));
		setToDate((prev) => (prev ? clampDateToBounds(prev, dateBounds) : prev));
	}, [dateBounds]);

	useEffect(() => {
		if (!fromDate || !toDate || fromDate <= toDate) return;
		setToDate(fromDate);
	}, [fromDate, toDate]);

	useEffect(() => {
		if (fromDate) localStorage.setItem("fromDate", fromDate);
		else localStorage.removeItem("fromDate");
	}, [fromDate]);

	useEffect(() => {
		if (toDate) localStorage.setItem("toDate", toDate);
		else localStorage.removeItem("toDate");
	}, [toDate]);

	return (
		<DateRangeContext.Provider
			value={{
				fromDate,
				toDate,
				setFromDate,
				setToDate,
				dateBounds,
				setDateBounds,
			}}
		>
			{children}
		</DateRangeContext.Provider>
	);
}

export function useDateRange() {
	const ctx = useContext(DateRangeContext);
	if (!ctx) {
		throw new Error("useDateRange must be used within DateRangeProvider");
	}
	return ctx;
}
