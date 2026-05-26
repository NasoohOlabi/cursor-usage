import { useMemo } from "react";
import { ReferenceLine } from "recharts";
import { formatBillingCycleMonthLabel, pickBillingCycleDates } from "./chartLayout";

interface BillingCycleReferenceLinesProps {
	names: string[];
	stroke: string;
}

export const BillingCycleReferenceLines = ({
	names,
	stroke,
}: BillingCycleReferenceLinesProps) => {
	const dates = useMemo(() => pickBillingCycleDates(names), [names]);

	if (dates.length === 0) return null;

	return (
		<>
			{dates.map((x) => (
				<ReferenceLine
					key={`billing-cycle-${x}`}
					x={x}
					stroke={stroke}
					strokeDasharray="4 4"
					strokeOpacity={0.5}
					ifOverflow="hidden"
					label={{
						value: formatBillingCycleMonthLabel(x),
						position: "insideTopLeft",
						fill: stroke,
						fontSize: 9,
						fontWeight: 600,
						dx: 3,
						dy: 2,
					}}
				/>
			))}
		</>
	);
};
