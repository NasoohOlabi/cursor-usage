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
				<div className="h-[300px] w-full min-w-0">
					<ClientChartMount className="h-full w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<PieChart>
								<Pie
									data={providerData}
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={100}
								paddingAngle={5}
								dataKey="cost"
								nameKey="name"
							>
								{providerData.map((_, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[index % COLORS.length]}
									/>
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
								formatter={(value: any) => [
									`$${Number(value || 0).toFixed(4)}`,
									"Cost",
								]}
							/>
							<Legend />
						</PieChart>
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
				<div className="h-[300px] w-full min-w-0">
					<ClientChartMount className="h-full w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<PieChart>
								<Pie
									data={usageByKind}
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={100}
								paddingAngle={5}
								dataKey="value"
							>
								{usageByKind.map((_, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[index % COLORS.length]}
									/>
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
							/>
							<Legend />
						</PieChart>
						</ResponsiveContainer>
					</ClientChartMount>
				</div>
			</div>
		</div>
	);
};
