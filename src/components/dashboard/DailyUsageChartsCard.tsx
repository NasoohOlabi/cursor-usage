import { useMemo, useState } from "react";
import { AverageTokenPriceChart } from "./AverageTokenPriceChart";
import { ModelSpendTokenCharts } from "./ModelSpendTokenCharts";
import { UsageTrendsChart } from "./UsageTrendsChart";
import {
	DAILY_STACK_CHART_HEIGHT_PX,
	DAILY_STACK_SYNC_ID,
	DAILY_STACK_Y_AXIS_WIDTH,
	pickXAxisTicks,
} from "./chartLayout";
import type {
	ModelTimeseriesSeries,
	TimeseriesData,
	TimeseriesSeriesMeta,
} from "./types";

interface DailyUsageChartsCardProps {
	timeseries: TimeseriesData[];
	seriesMeta: TimeseriesSeriesMeta[];
	modelSeries: ModelTimeseriesSeries[];
	periodAverage?: number;
}

export const DailyUsageChartsCard = ({
	timeseries,
	seriesMeta,
	modelSeries,
	periodAverage,
}: DailyUsageChartsCardProps) => {
	const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
	const [viewMode, setViewMode] = useState<"totals" | "breakdown">("totals");

	const xTicks = useMemo(
		() => pickXAxisTicks(timeseries.map((d) => d.name)),
		[timeseries],
	);

	const stackProps = {
		stackMode: true as const,
		embedded: true as const,
		syncId: DAILY_STACK_SYNC_ID,
		xTicks,
		chartHeight: DAILY_STACK_CHART_HEIGHT_PX,
		yAxisWidth: DAILY_STACK_Y_AXIS_WIDTH,
	};

	const usageControl = {
		hiddenKeys,
		onHiddenKeysChange: setHiddenKeys,
		viewMode,
		onViewModeChange: setViewMode,
	};

	const hasModelCharts =
		modelSeries.length > 0 && timeseries.length > 0;

	return (
		<div className="w-full rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700">
			<UsageTrendsChart
				{...stackProps}
				timeseries={timeseries}
				seriesMeta={seriesMeta}
				part="header"
				{...usageControl}
			/>

			<div className="mt-4 flex flex-col gap-4 min-[520px]:flex-row min-[520px]:items-stretch">
				<div className="flex min-w-0 flex-1 flex-col gap-2 overflow-visible pb-32">
					<AverageTokenPriceChart
						{...stackProps}
						timeseries={timeseries}
						periodAverage={periodAverage}
					/>
					<UsageTrendsChart
						{...stackProps}
						timeseries={timeseries}
						seriesMeta={seriesMeta}
						part="charts"
						{...usageControl}
					/>
					{hasModelCharts && (
						<>
							<div
								className="border-t border-slate-200/80 dark:border-slate-800"
								aria-hidden
							/>
							<ModelSpendTokenCharts
								{...stackProps}
								timeseries={timeseries}
								modelSeries={modelSeries}
								part="charts"
							/>
						</>
					)}
				</div>

				<aside className="shrink-0 border-t border-slate-200/80 pt-4 min-[520px]:w-52 min-[520px]:border-l min-[520px]:border-t-0 min-[520px]:pl-4 min-[520px]:pt-0 dark:border-slate-800">
					<div
						className="space-y-4 overflow-y-auto pr-1"
						style={{
							maxHeight: `min(${
								DAILY_STACK_CHART_HEIGHT_PX *
								(hasModelCharts ? 5 : 3)
							}px, 70vh)`,
						}}
					>
						<UsageTrendsChart
							{...stackProps}
							timeseries={timeseries}
							seriesMeta={seriesMeta}
							part="legend"
							{...usageControl}
						/>
						{hasModelCharts && (
							<ModelSpendTokenCharts
								{...stackProps}
								timeseries={timeseries}
								modelSeries={modelSeries}
								part="legend"
							/>
						)}
					</div>
				</aside>
			</div>
		</div>
	);
};
