import { getModelIcon } from "./utils";

export const ModelIcon = ({
	name,
	className = "w-4 h-4",
}: {
	name: string;
	className?: string;
}) => {
	const icon = getModelIcon(name);
	if (!icon) return null;
	return <img src={icon} alt={name} className={className} />;
};
