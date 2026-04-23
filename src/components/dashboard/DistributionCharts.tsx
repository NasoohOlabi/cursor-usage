import { useMemo } from "react";
import { DollarSign, Activity } from "lucide-react";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	Cell,
	Tooltip,
	Legend,
	XAxis,
	YAxis,
} from "recharts";
import { useTheme } from "../ThemeContext";
import { ClientChartMount } from "./ClientChartMount";
import { getChartTheme } from "./chartTheme";
import { COLORS } from "./utils";
import { ProviderData, UsageByKind } from "./types";

interface DistributionChartsProps {
	providerData: ProviderData[];
	usageByKind: UsageByKind[];
}

export const DistributionCharts = ({
	providerData,
	usageByKind,
}: DistributionChartsProps) => {
	const { isDark } = useTheme();
	const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);

	const providerBarData = useMemo(() => {
		const obj: any = { name: "Cost Share" };
		providerData.forEach(p => obj[p.name] = p.cost);
		return [obj];
	}, [providerData]);

	const kindBarData = useMemo(() => {
		const obj: any = { name: "Request Share" };
		usageByKind.forEach(k => obj[k.name] = k.value);
		return [obj];
	}, [usageByKind]);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
			{/* Provider Cost Share */}
			<div className="rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700">
				<div className="mb-6 flex items-center gap-3">
					<div className="p-2 bg-emerald-500/10 rounded-lg">
						<DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">Cost by Provider</h2>
				</div>
				<div className="h-[160px] w-full min-w-0">
					<ClientChartMount className="h-full w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<BarChart
								data={providerBarData}
								layout="vertical"
								stackOffset="expand"
								margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
							>
								<XAxis type="number" hide />
								<YAxis type="category" dataKey="name" hide />
								<Tooltip
									contentStyle={{
										backgroundColor: chartTheme.tooltipBg,
										border: `1px solid ${chartTheme.tooltipBorder}`,
										borderRadius: "8px",
										boxShadow: chartTheme.tooltipShadow,
									}}
									itemStyle={{ color: chartTheme.tooltipRow }}
									labelStyle={{ color: chartTheme.tooltipLabel }}
									formatter={(value: any, name: any) => [
										`$${Number(value || 0).toFixed(4)}`,
										name,
									]}
								/>
								<Legend verticalAlign="bottom" />
								{providerData.map((p, index) => (
									<Bar
										key={p.name}
										dataKey={p.name}
										stackId="1"
										fill={COLORS[index % COLORS.length]}
									/>
								))}
							</BarChart>
						</ResponsiveContainer>
					</ClientChartMount>
				</div>
			</div>

			{/* Usage Centric */}
			<div className="rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700">
				<div className="mb-6 flex items-center gap-3">
					<div className="p-2 bg-amber-500/10 rounded-lg">
						<Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
					</div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						Request Kind Distribution
					</h2>
				</div>
				<div className="h-[160px] w-full min-w-0">
					<ClientChartMount className="h-full w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<BarChart
								data={kindBarData}
								layout="vertical"
								stackOffset="expand"
								margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
							>
								<XAxis type="number" hide />
								<YAxis type="category" dataKey="name" hide />
								<Tooltip
									contentStyle={{
										backgroundColor: chartTheme.tooltipBg,
										border: `1px solid ${chartTheme.tooltipBorder}`,
										borderRadius: "8px",
										boxShadow: chartTheme.tooltipShadow,
									}}
									itemStyle={{ color: chartTheme.tooltipRow }}
									labelStyle={{ color: chartTheme.tooltipLabel }}
								/>
								<Legend verticalAlign="bottom" />
								{usageByKind.map((k, index) => (
									<Bar
										key={k.name}
										dataKey={k.name}
										stackId="1"
										fill={COLORS[index % COLORS.length]}
									/>
								))}
							</BarChart>
						</ResponsiveContainer>
					</ClientChartMount>
				</div>
			</div>
		</div>
	);
};
