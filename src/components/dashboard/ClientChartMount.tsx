import { useEffect, useRef, useState } from "react";

/** Recharts ResponsiveContainer needs a measured DOM size; render only when > 0. */
export function ClientChartMount({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [hasSize, setHasSize] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const update = (width: number, height: number) => {
			setHasSize(width > 0 && height > 0);
		};

		const ro = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			update(width, height);
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	return (
		<div ref={ref} className={className}>
			{hasSize ? children : null}
		</div>
	);
}
