import { TrendingUp } from "lucide-react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { TimeseriesData } from "./types";

interface UsageTrendsChartProps {
	timeseries: TimeseriesData[];
}

const formatYAxis = (value: number) => {
	if (value >= 1_000_000)
		return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
	if (value >= 1_000)
		return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
	return value.toString();
};

const formatCurrency = (value: number) => {
	return `$${value.toFixed(2)}`;
};

export const UsageTrendsChart = ({ timeseries }: UsageTrendsChartProps) => {
	return (
		<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors w-full">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 bg-violet-500/10 rounded-lg">
					<TrendingUp className="text-violet-400 w-6 h-6" />
				</div>
				<h2 className="text-xl font-bold text-white">
					Usage Trends (Daily)
				</h2>
			</div>
			<div className="h-[450px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={timeseries}
						margin={{ bottom: 60, left: 20, right: 20 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
						<XAxis
							dataKey="name"
							stroke="#64748b"
							fontSize={10}
							angle={-45}
							textAnchor="end"
							height={100}
						/>
						<YAxis
							yAxisId="left"
							stroke="#64748b"
							fontSize={12}
							tickFormatter={formatYAxis}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							stroke="#64748b"
							fontSize={12}
							tickFormatter={formatCurrency}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "#0f172a",
								border: "1px solid #1e293b",
								borderRadius: "8px",
							}}
							formatter={(value: any, name: any) => {
								const val = Number(value);
								if (name?.includes?.("Cost"))
									return formatCurrency(val);
								return val.toLocaleString();
							}}
						/>
						<Legend />
						<Line
							yAxisId="left"
							type="monotone"
							dataKey="tokens"
							name="Total Tokens"
							stroke="#8b5cf6"
							strokeWidth={3}
							dot={{ r: 4, fill: "#8b5cf6" }}
							activeDot={{ r: 6 }}
						/>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="cost"
							name="Daily Cost ($)"
							stroke="#f43f5e"
							strokeWidth={3}
							dot={{ r: 4, fill: "#f43f5e" }}
							activeDot={{ r: 6 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};
