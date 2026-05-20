import { getModelIconAsset } from "./utils";

export const ModelIcon = ({
	name,
	className = "w-4 h-4",
}: {
	name: string;
	className?: string;
}) => {
	const asset = getModelIconAsset(name);
	if (!asset) return null;

	const chip =
		"inline-flex shrink-0 items-center justify-center rounded-md bg-slate-200/95 p-[3px] ring-1 ring-inset ring-slate-300/70 dark:bg-slate-700/55 dark:ring-slate-500/35";

	if (asset.mode === "single") {
		return (
			<span className={chip} aria-hidden>
				<img
					src={asset.src}
					alt=""
					className={`${className} object-contain dark:opacity-90`}
				/>
			</span>
		);
	}

	return (
		<span className={chip} aria-hidden>
			<img
				src={asset.light}
				alt=""
				className={`${className} object-contain dark:hidden`}
			/>
			<img
				src={asset.dark}
				alt=""
				className={`${className} object-contain hidden dark:block`}
			/>
		</span>
	);
};
