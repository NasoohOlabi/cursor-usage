import { DollarSign, Activity } from "lucide-react";
import {
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
} from "recharts";
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
	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
			{/* Provider Cost Share */}
			<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
				<div className="flex items-center gap-3 mb-6">
					<div className="p-2 bg-emerald-500/10 rounded-lg">
						<DollarSign className="text-emerald-400 w-6 h-6" />
					</div>
					<h2 className="text-xl font-bold text-white">Cost by Provider</h2>
				</div>
				<div className="h-[300px] w-full">
					<ResponsiveContainer width="100%" height="100%">
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
									backgroundColor: "#0f172a",
									border: "1px solid #1e293b",
									borderRadius: "8px",
								}}
								formatter={(value: any) => [
									`$${Number(value || 0).toFixed(4)}`,
									"Cost",
								]}
							/>
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Usage Centric */}
			<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
				<div className="flex items-center gap-3 mb-6">
					<div className="p-2 bg-amber-500/10 rounded-lg">
						<Activity className="text-amber-400 w-6 h-6" />
					</div>
					<h2 className="text-xl font-bold text-white">
						Request Kind Distribution
					</h2>
				</div>
				<div className="h-[300px] w-full">
					<ResponsiveContainer width="100%" height="100%">
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
									backgroundColor: "#0f172a",
									border: "1px solid #1e293b",
									borderRadius: "8px",
								}}
							/>
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
};
