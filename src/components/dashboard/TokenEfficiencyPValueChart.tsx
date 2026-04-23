import { CircleHelp, Filter, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useTheme } from "../ThemeContext";
import { ClientChartMount } from "./ClientChartMount";
import { getChartTheme } from "./chartTheme";
import {
	CartesianGrid,
	Cell,
	LabelList,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
	ZAxis,
} from "recharts";
import { ModelData } from "./types";

interface TokenEfficiencyPValueChartProps {
	modelData: ModelData[];
}

const formatCompact = (value: number) =>
	new Intl.NumberFormat("en", {
		notation: "compact",
		compactDisplay: "short",
		maximumFractionDigits: 1,
	}).format(value);

export const TokenEfficiencyPValueChart = ({
	modelData,
}: TokenEfficiencyPValueChartProps) => {
	const { isDark } = useTheme();
	const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);
	const [percentile, setPercentile] = useState<"p50" | "p90">("p50");
	const [metricView, setMetricView] = useState<"absolute" | "effective">(
		"absolute",
	);
	const [providerFilter, setProviderFilter] = useState<string>("all");

	const providers = useMemo(() => {
		const provs = new Set<string>();
		modelData.forEach((row) => {
			if (row.hasDocsPrice && row.count >= 3 && row.name.includes("/")) {
				provs.add(row.name.split("/")[0]);
			}
		});
		return ["all", ...Array.from(provs).sort()];
	}, [modelData]);

	const plottedRows = useMemo(() => {
		const raw = modelData
			.filter((row) => {
				if (!row.hasDocsPrice || row.count < 1) return false;
				if (
					providerFilter !== "all" &&
					!row.name.startsWith(`${providerFilter}/`)
				)
					return false;
				return true;
			})
			.map((row) => {
				const promptCost =
					percentile === "p50" ? row.p50PromptCost : row.p90PromptCost;
				const promptTokens =
					percentile === "p50" ? row.p50PromptTokens : row.p90PromptTokens;
				const observedCostPer1M =
					percentile === "p50"
						? row.p50ObservedCostPer1M
						: row.p90ObservedCostPer1M;

				const yValue =
					metricView === "absolute" ? promptCost : observedCostPer1M;

				return {
					name: row.name,
					pricePer1M: row.pricePer1MTokens,
					promptCost,
					promptTokens,
					observedCostPer1M,
					yValue,
					size: Math.max(
						3,
						Math.min(12, Math.sqrt(Math.max(promptTokens, 1)) / 30),
					),
				};
			});

		const maxX = Math.max(...raw.map((d) => d.pricePer1M), 0.001);
		const maxY = Math.max(...raw.map((d) => d.yValue), 0.001);

		const width = 600;
		const height = 300;

		const placedLabels: { x: number; y: number; w: number; h: number }[] = [];

		const positions = [
			{ dx: 0, dy: -16, anchor: "middle" },
			{ dx: 14, dy: 0, anchor: "start" },
			{ dx: -14, dy: 0, anchor: "end" },
			{ dx: 0, dy: 20, anchor: "middle" },
			{ dx: 16, dy: -12, anchor: "start" },
			{ dx: -16, dy: -12, anchor: "end" },
			{ dx: 18, dy: 14, anchor: "start" },
			{ dx: -18, dy: 14, anchor: "end" },
			{ dx: 24, dy: -2, anchor: "start" },
			{ dx: -24, dy: -2, anchor: "end" },
		] as const;

		const points = raw.map((row) => ({
			...row,
			px: (row.pricePer1M / maxX) * width,
			py: height - (row.yValue / maxY) * height,
			labelText: row.name.split("/").pop() || "",
		}));

		const byPriority = [...points].sort(
			(a, b) => b.promptTokens - a.promptTokens,
		);

		const labelMeta = new Map<
			string,
			{ labelPos: (typeof positions)[number]; showLabel: boolean }
		>();

		for (const row of byPriority) {
			const text = row.labelText;
			const tw = Math.max(24, text.length * 5.5);
			const th = 12;

			let chosenPos: (typeof positions)[number] = positions[0];
			let found = false;

			for (const pos of positions) {
				let lx = row.px + pos.dx;
				const ly = row.py + pos.dy;

				if (pos.anchor === "middle") lx -= tw / 2;
				else if (pos.anchor === "end") lx -= tw;

				const pad = 4;
				const box = {
					x: lx - pad,
					y: ly - th - pad,
					w: tw + pad * 2,
					h: th + pad * 2,
				};

				const outOfBounds =
					box.x < 0 ||
					box.y < 0 ||
					box.x + box.w > width ||
					box.y + box.h > height;
				if (outOfBounds) continue;

				const overlapsLabel = placedLabels.some((p) => {
					return !(
						box.x + box.w < p.x ||
						box.x > p.x + p.w ||
						box.y + box.h < p.y ||
						box.y > p.y + p.h
					);
				});
				if (overlapsLabel) continue;

				const overlapsNearbyPoint = points.some((p) => {
					if (p.name === row.name) return false;
					const pointRadius = 11;
					return (
						p.px >= box.x - pointRadius &&
						p.px <= box.x + box.w + pointRadius &&
						p.py >= box.y - pointRadius &&
						p.py <= box.y + box.h + pointRadius
					);
				});
				if (overlapsNearbyPoint) continue;

				chosenPos = pos;
				placedLabels.push(box);
				found = true;
				break;
			}

			labelMeta.set(row.name, { labelPos: chosenPos, showLabel: found });
		}

		return points
			.map((row) => {
				const meta = labelMeta.get(row.name);
				return {
					...row,
					labelPos: meta?.labelPos || positions[0],
					showLabel: meta?.showLabel ?? false,
				};
			})
			.sort((a, b) => b.yValue - a.yValue);
	}, [modelData, providerFilter, percentile, metricView]);

	const standoutRows = useMemo(() => {
		if (plottedRows.length < 2) return [];
		const byPrice = [...plottedRows]
			.sort((a, b) => b.pricePer1M - a.pricePer1M)
			.map((row, index) => ({ ...row, priceRank: index + 1 }));
		const byCost = [...plottedRows]
			.sort((a, b) => b.yValue - a.yValue)
			.map((row, index) => ({ ...row, costRank: index + 1 }));
		const costRankMap = new Map(
			byCost.map((row) => [row.name, row.costRank]),
		);
		return byPrice
			.map((row) => {
				const costRank = costRankMap.get(row.name) || row.priceRank;
				return {
					...row,
					costRank,
					outperformance: row.priceRank - costRank,
				};
			})
			.filter((row) => row.outperformance > 0)
			.sort((a, b) => b.outperformance - a.outperformance)
			.slice(0, 6);
	}, [plottedRows]);

	/** Observed $/1M ÷ list $/1M — lower means you pay less of the sticker rate (better value). Tertiles vs other bubbles in view. */
	const efficiencyThresholds = useMemo(() => {
		const ratios = plottedRows
			.map((row) =>
				row.pricePer1M > 0 ? row.observedCostPer1M / row.pricePer1M : 0,
			)
			.filter((r) => Number.isFinite(r))
			.sort((a, b) => a - b);

		if (ratios.length === 0) {
			return { high: 0, moderate: 0 };
		}

		const quantile = (p: number) => {
			if (ratios.length === 1) return ratios[0];
			const index = (ratios.length - 1) * p;
			const lower = Math.floor(index);
			const upper = Math.ceil(index);
			if (lower === upper) return ratios[lower];
			const weight = index - lower;
			return ratios[lower] * (1 - weight) + ratios[upper] * weight;
		};

		return {
			high: quantile(1 / 3),
			moderate: quantile(2 / 3),
		};
	}, [plottedRows]);

	const classifyEfficiency = (ratio: number) => {
		if (ratio <= efficiencyThresholds.high) return "high";
		if (ratio <= efficiencyThresholds.moderate) return "moderate";
		return "low";
	};

	const observedToListRatio = (row: { pricePer1M: number; observedCostPer1M: number }) =>
		row.pricePer1M > 0 ? row.observedCostPer1M / row.pricePer1M : 0;

	if (plottedRows.length === 0) return null;

	const metricLabel =
		metricView === "absolute" ? "Prompt Cost" : "Effective Cost/1M";
	const metricHint =
		metricView === "absolute"
			? "Raw spend at selected percentile."
			: "Observed spend normalized per 1M tokens.";

	return (
		<section className="rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-slate-700">
			<div className="mb-4 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
				<div className="flex items-center gap-3">
					<div className="shrink-0 rounded-lg bg-fuchsia-500/10 p-2">
						<Sparkles className="h-6 w-6 text-fuchsia-500 dark:text-fuchsia-400" />
					</div>
					<div>
						<h2 className="text-xl font-bold text-slate-900 dark:text-white">
							Token Cost Efficiency Explorer ({percentile.toUpperCase()})
						</h2>
						<p className="text-sm text-slate-700 dark:text-slate-300">
							Compare list price against observed spend across models.
						</p>
						<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
							Bubble color is value vs list price (observed $/1M ÷ list); Y is
							spend at this percentile—light usage keeps dollars low even on
							pricy models. Bubble size = token volume.
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="flex flex-col gap-1">
						<span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
							Percentile
						</span>
						<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-950/50">
							<button
								type="button"
								onClick={() => setPercentile("p50")}
								className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${percentile === "p50" ? "bg-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
							>
								P50 (Median)
							</button>
							<button
								type="button"
								onClick={() => setPercentile("p90")}
								className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${percentile === "p90" ? "bg-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
							>
								P90 (Tail)
							</button>
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
							Y-Axis Metric
						</span>
						<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-950/50">
							<button
								type="button"
								onClick={() => setMetricView("absolute")}
								className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${metricView === "absolute" ? "bg-blue-500/20 text-blue-800 dark:text-blue-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
							>
								Absolute Cost
							</button>
							<button
								type="button"
								onClick={() => setMetricView("effective")}
								className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${metricView === "effective" ? "bg-blue-500/20 text-blue-800 dark:text-blue-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
							>
								Effective Cost/1M
							</button>
						</div>
					</div>

					{providers.length > 1 && (
						<div className="ml-1 flex flex-col gap-1">
							<span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
								Provider
							</span>
							<div className="flex items-center gap-2">
								<Filter className="h-4 w-4 text-slate-500" />
								<select
									value={providerFilter}
									onChange={(e) => setProviderFilter(e.target.value)}
									title="Filter by provider"
									className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium capitalize text-slate-800 outline-none transition-colors focus:border-fuchsia-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
								>
									{providers.map((p) => (
										<option key={p} value={p}>
											{p === "all" ? "All Providers" : p}
										</option>
									))}
								</select>
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200/90 bg-slate-50/90 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/35 dark:text-slate-300">
				<span className="text-slate-500 dark:text-slate-400">
					X: List Price ($/1M) | Y: {metricLabel} ({metricHint})
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
					High efficiency
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
					Moderate efficiency
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
					Low efficiency
				</span>
				<span
					className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400"
					title="Green = lowest observed $/1M ÷ list price among models shown; red = highest ratios. Compares effective rate to sticker price, not chart position."
				>
					<CircleHelp className="h-3.5 w-3.5" />
					Hover explainer
				</span>
			</div>

			<div className="flex flex-col xl:flex-row gap-4">
				<div className="h-[340px] mt-4 flex-1 min-w-0">
					<ClientChartMount className="h-full w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<ScatterChart
								margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
							>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke={chartTheme.gridStroke}
							/>
							<XAxis
								type="number"
								dataKey="pricePer1M"
								name="List Price/1M"
								stroke={chartTheme.axisStroke}
								tick={{ fill: chartTheme.tickFill, fontSize: 11 }}
								tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
								label={{
									value: "List Price ($ / 1M tokens)",
									position: "insideBottom",
									offset: -8,
									fill: chartTheme.axisLabelFill,
									fontSize: 11,
								}}
							/>
							<YAxis
								type="number"
								dataKey="yValue"
								name={metricLabel}
								stroke={chartTheme.axisStroke}
								tick={{ fill: chartTheme.tickFill, fontSize: 11 }}
								tickFormatter={(v) =>
									metricView === "absolute"
										? `$${Number(v).toFixed(3)}`
										: `$${Number(v).toFixed(2)}`
								}
								label={{
									value: metricLabel,
									angle: -90,
									position: "insideLeft",
									fill: chartTheme.axisLabelFill,
									fontSize: 11,
									dx: -2,
								}}
							/>
							<ZAxis type="number" dataKey="size" range={[20, 160]} />
							<Tooltip
								cursor={{ strokeDasharray: "4 4" }}
								contentStyle={{ outline: "none" }}
								content={({ active, payload }) => {
									if (!active || !payload?.length) return null;
									const point = payload[0]?.payload as
										| {
												name: string;
												pricePer1M: number;
												yValue: number;
												promptTokens: number;
												observedCostPer1M: number;
										  }
										| undefined;
									if (!point) return null;
									const ratio = observedToListRatio(point);
									const efficiencyTier = classifyEfficiency(ratio);
									const efficiencyText =
										efficiencyTier === "high"
											? "High efficiency (green)"
											: efficiencyTier === "moderate"
												? "Moderate efficiency (blue)"
												: "Low efficiency (red)";
									return (
										<div
											className="rounded-lg border px-3 py-2 text-xs shadow-xl dark:border-slate-700"
											style={{
												backgroundColor: chartTheme.tooltipBg,
												borderColor: chartTheme.tooltipBorder,
												boxShadow: chartTheme.tooltipShadow,
											}}
										>
											<div className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
												{point.name.split("/").pop() || point.name}
											</div>
											<div className="text-slate-600 dark:text-slate-300">
												List Price:{" "}
												<span className="text-slate-900 dark:text-slate-100">
													${point.pricePer1M.toFixed(2)}
												</span>
											</div>
											<div className="text-slate-600 dark:text-slate-300">
												{metricLabel}:{" "}
												<span className="text-slate-900 dark:text-slate-100">
													$
													{point.yValue.toFixed(
														metricView === "absolute" ? 4 : 2,
													)}
												</span>
											</div>
											<div className="text-slate-600 dark:text-slate-300">
												Observed Cost/1M:{" "}
												<span className="text-slate-900 dark:text-slate-100">
													${point.observedCostPer1M.toFixed(2)}
												</span>
											</div>
											<div className="text-slate-600 dark:text-slate-300">
												Tokens:{" "}
												<span className="text-slate-900 dark:text-slate-100">
													{formatCompact(point.promptTokens)}
												</span>
											</div>
											<div className="mt-1 text-slate-500 dark:text-slate-400">
												Observed/List price: {ratio.toFixed(2)}×
											</div>
											<div className="text-slate-500 dark:text-slate-500">
												{efficiencyText}
											</div>
										</div>
									);
								}}
							/>
							<Scatter data={plottedRows}>
								<LabelList
									dataKey="name"
									content={(props: any) => {
										const { x, y, value, index } = props;
										const point = plottedRows[index];
										if (!point || !point.labelPos || !point.showLabel)
											return null;
										const name =
											typeof value === "string"
												? value.split("/").pop()
												: value;
										return (
											<text
												x={x}
												y={y}
												dx={point.labelPos.dx}
												dy={point.labelPos.dy}
												fill={chartTheme.axisStroke}
												fontSize={10}
												textAnchor={point.labelPos.anchor as "start" | "middle" | "end"}
												stroke={chartTheme.cellStroke}
												strokeWidth={2.5}
												paintOrder="stroke"
											>
												{name}
											</text>
										);
									}}
								/>
								{plottedRows.map((point, idx) => {
									const ratio = observedToListRatio(point);
									const efficiencyTier = classifyEfficiency(ratio);
									const color =
										efficiencyTier === "high"
											? "#22c55e"
											: efficiencyTier === "moderate"
												? "#38bdf8"
												: "#fb7185";
									return (
										<Cell key={`${point.name}-${idx}`} fill={color} />
									);
								})}
							</Scatter>
						</ScatterChart>
						</ResponsiveContainer>
					</ClientChartMount>
				</div>

				{standoutRows.length > 0 && (
					<div className="mt-4 shrink-0 overflow-x-auto rounded-xl border border-slate-200/90 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/30 xl:w-[460px] 2xl:w-[520px]">
						<div className="border-b border-slate-200/80 bg-slate-100/80 px-3 py-2 dark:border-slate-800/80 dark:bg-slate-900/40">
							<p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
								Price vs Performance Outperformers
							</p>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								Models that rank expensive by list price but cheaper by
								observed
								{metricView === "absolute"
									? " absolute cost."
									: " effective cost."}
							</p>
						</div>
						<table className="w-full min-w-[460px] text-xs">
							<thead className="bg-slate-100/90 dark:bg-slate-900/60">
								<tr className="text-slate-500 dark:text-slate-400">
									<th className="text-left font-medium px-3 py-2">
										Model
									</th>
									<th className="text-left font-medium px-3 py-2">
										Price Rank
									</th>
									<th className="text-left font-medium px-3 py-2">
										{percentile.toUpperCase()} Rank
									</th>
									<th className="text-left font-medium px-3 py-2">
										Delta
									</th>
									<th className="text-left font-medium px-3 py-2">
										Tokens
									</th>
									<th className="text-left font-medium px-3 py-2">
										{metricView === "absolute"
											? "Cost"
											: "Eff. Cost/1M"}
									</th>
								</tr>
							</thead>
							<tbody>
								{standoutRows.map((row) => (
									<tr
										key={row.name}
										className="border-t border-slate-200/80 dark:border-slate-800/80"
									>
										<td
											className="max-w-[220px] truncate px-3 py-2 text-slate-800 dark:text-slate-100"
											title={row.name}
										>
											{row.name.split("/").pop()}
										</td>
										<td className="px-3 py-2 text-slate-600 dark:text-slate-300">
											#{row.priceRank}
										</td>
										<td className="px-3 py-2 text-slate-600 dark:text-slate-300">
											#{row.costRank}
										</td>
										<td className="px-3 py-2 font-medium text-emerald-600 dark:text-emerald-300">
											+{row.outperformance}
										</td>
										<td className="px-3 py-2 text-slate-600 dark:text-slate-300">
											{formatCompact(row.promptTokens)}
										</td>
										<td className="px-3 py-2 text-emerald-600 dark:text-emerald-400">
											$
											{row.yValue.toFixed(
												metricView === "absolute" ? 4 : 2,
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</section>
	);
};
