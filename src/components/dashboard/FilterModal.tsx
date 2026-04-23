import { X } from "lucide-react";
import { useEffect } from "react";
import { ModelIcon } from "./ModelIcon";

interface FilterModalProps {
	isOpen: boolean;
	onClose: () => void;
	allModels: string[];
	selectedModels: string[];
	setSelectedModels: (models: string[]) => void;
}

export const FilterModal = ({
	isOpen,
	onClose,
	allModels,
	selectedModels,
	setSelectedModels,
}: FilterModalProps) => {
	// Modal escape handler
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		if (isOpen) {
			window.addEventListener("keydown", handleEscape);
			document.body.style.overflow = "hidden";
		}
		return () => {
			window.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={onClose}
		>
			<div
				className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl dark:shadow-2xl shadow-xl animate-in zoom-in-95 duration-200"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-slate-900 dark:text-white">
							Select Models
						</h2>
						<p className="text-slate-600 dark:text-slate-400 text-sm">
							Choose which models to include in the analytics.
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
						aria-label="Close"
					>
						<X size={24} />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-6 space-y-8">
					<div className="space-y-4">
						<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
							Models
						</h3>
						<div className="flex flex-wrap gap-2">
							{allModels.map((model) => (
								<div
									key={model}
									onClick={() => {
										if (selectedModels.includes(model)) {
											setSelectedModels(
												selectedModels.filter((m) => m !== model)
											);
										} else {
											setSelectedModels([...selectedModels, model]);
										}
									}}
									className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${
										selectedModels.includes(model)
											? "bg-cyan-500/20 border-cyan-500/50 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_-5px_rgba(6,182,212,0.25)]"
											: "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
									}`}
								>
									<ModelIcon name={model} />
									<span
										className="text-sm font-medium whitespace-nowrap"
										title={model}
									>
										{model.split("/").pop()}
									</span>
								</div>
							))}
						</div>
					</div>
					<div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/50 rounded-b-3xl">
						<button
							onClick={() => {
								setSelectedModels([]);
							}}
							className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
						>
							Clear All
						</button>
						<div className="flex gap-3">
							<button
								onClick={() => setSelectedModels(allModels)}
								className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
							>
								Select All
							</button>
							<button
								onClick={onClose}
								className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
							>
								Apply Filters
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
