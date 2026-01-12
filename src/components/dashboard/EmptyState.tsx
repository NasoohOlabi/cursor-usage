import { FileText } from "lucide-react";

export const EmptyState = () => {
	return (
		<div className="w-full py-20 text-center">
			<div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 inline-block">
				<FileText className="w-16 h-16 text-slate-700 mb-6" />
				<h2 className="text-2xl font-semibold text-slate-300 mb-2">
					No Data Available
				</h2>
				<p className="text-slate-500">
					Please upload a CSV file with the required headers to see your analytics
					dashboard.
				</p>
			</div>
		</div>
	);
};
