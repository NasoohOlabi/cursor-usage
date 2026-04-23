import { useEffect, useState } from "react";

/** Recharts ResponsiveContainer needs a measured DOM size; skip SSR/first paint until mounted. */
export function ClientChartMount({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	const [ready, setReady] = useState(false);
	useEffect(() => setReady(true), []);
	return <div className={className}>{ready ? children : null}</div>;
}
