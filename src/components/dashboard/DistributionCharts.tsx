import { useMemo } from "react";
import { DollarSign, Activity } from "lucide-react";
import {
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
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

	const providerTotalCost = useMemo(() => {
		return providerData.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
	}, [providerData]);

	const totalRequests = useMemo(() => {
		return usageByKind.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
	}, [usageByKind]);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
			{/* Provider Cost Share */}
			<div className="rounded-xl border border-slate-200/90 bg-white/70 p-3 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700">
				<div className="mb-2 flex items-center gap-2">
					<div className="p-1.5 bg-emerald-500/10 rounded-md">
						<DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">Cost by Provider</h2>
				</div>
				<div className="h-[210px] w-full min-w-0">
					<ClientChartMount className="h-full w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
								<Pie
									data={providerData}
									dataKey="cost"
									nameKey="name"
									cx="50%"
									cy="45%"
									innerRadius={42}
									outerRadius={72}
									paddingAngle={2}
									stroke="none"
								>
									{providerData.map((p, index) => (
										<Cell key={p.name} fill={COLORS[index % COLORS.length]} />
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: chartTheme.tooltipBg,
										border: `1px solid ${chartTheme.tooltipBorder}`,
										borderRadius: "8px",
										boxShadow: chartTheme.tooltipShadow,
									}}
									itemStyle={{ color: chartTheme.tooltipRow }}
									labelStyle={{ color: chartTheme.tooltipLabel }}
									formatter={(value: any, name: any) => {
										const numericValue = Number(value || 0);
										const ratio =
											providerTotalCost > 0
												? (numericValue / providerTotalCost) * 100
												: 0;
										return [`$${numericValue.toFixed(4)} (${ratio.toFixed(1)}%)`, name];
									}}
								/>
								<Legend
									verticalAlign="bottom"
									wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
								/>
							</PieChart>
						</ResponsiveContainer>
					</ClientChartMount>
				</div>
			</div>

			{/* Usage Centric */}
			<div className="rounded-xl border border-slate-200/90 bg-white/70 p-3 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700">
				<div className="mb-2 flex items-center gap-2">
					<div className="p-1.5 bg-amber-500/10 rounded-md">
						<Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
					</div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						Request Kind Distribution
					</h2>
				</div>
				<div className="h-[210px] w-full min-w-0">
					<ClientChartMount className="h-full w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
								<Pie
									data={usageByKind}
									dataKey="value"
									nameKey="name"
									cx="50%"
									cy="45%"
									innerRadius={42}
									outerRadius={72}
									paddingAngle={2}
									stroke="none"
								>
									{usageByKind.map((k, index) => (
										<Cell key={k.name} fill={COLORS[index % COLORS.length]} />
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: chartTheme.tooltipBg,
										border: `1px solid ${chartTheme.tooltipBorder}`,
										borderRadius: "8px",
										boxShadow: chartTheme.tooltipShadow,
									}}
									itemStyle={{ color: chartTheme.tooltipRow }}
									labelStyle={{ color: chartTheme.tooltipLabel }}
									formatter={(value: any, name: any) => {
										const numericValue = Number(value || 0);
										const ratio =
											totalRequests > 0 ? (numericValue / totalRequests) * 100 : 0;
										return [`${numericValue.toLocaleString()} (${ratio.toFixed(1)}%)`, name];
									}}
								/>
								<Legend
									verticalAlign="bottom"
									wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
								/>
							</PieChart>
						</ResponsiveContainer>
					</ClientChartMount>
				</div>
			</div>
		</div>
	);
};
