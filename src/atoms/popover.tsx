import { Popover as PopoverBase } from "@base-ui/react/popover";
import { cn } from "@/css/lib";

export const PopoverCreateHandler: typeof PopoverBase.createHandle =
	PopoverBase.createHandle;

export const Popover: typeof PopoverBase.Root = PopoverBase.Root;

export const PopoverTrigger: React.FC<
	React.ComponentProps<typeof PopoverBase.Trigger>
> = ({ className, children, ...props }) => {
	return (
		<PopoverBase.Trigger
			className={className}
			data-slot="popover-trigger"
			{...props}
		>
			{children}
		</PopoverBase.Trigger>
	);
};

function PopoverPopup({
	children,
	className,
	side = "bottom",
	align = "center",
	sideOffset = 4,
	alignOffset = 0,
	tooltipStyle = false,
	anchor,
	portalProps,
	popoverProps = {},
	...props
}: PopoverBase.Popup.Props & {
	portalProps?: PopoverBase.Portal.Props;
	side?: PopoverBase.Positioner.Props["side"];
	align?: PopoverBase.Positioner.Props["align"];
	sideOffset?: PopoverBase.Positioner.Props["sideOffset"];
	alignOffset?: PopoverBase.Positioner.Props["alignOffset"];
	tooltipStyle?: boolean;
	anchor?: PopoverBase.Positioner.Props["anchor"];
	popoverProps?: {
		className?: string;
	};
}): React.ReactElement {
	return (
		<PopoverBase.Portal {...portalProps}>
			<PopoverBase.Positioner
				align={align}
				alignOffset={alignOffset}
				anchor={anchor}
				className="z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom,transform] data-instant:transition-none"
				data-slot="popover-positioner"
				side={side}
				sideOffset={sideOffset}
			>
				<PopoverBase.Popup
					className={cn(
						"relative flex h-(--popup-height,auto) w-(--popup-width,auto) origin-(--transform-origin) rounded-lg border border-border bg-popover not-dark:bg-clip-padding text-popover-foreground shadow-lg/5 outline-none transition-[width,height,scale,opacity] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] has-data-[slot=calendar]:rounded-xl has-data-[slot=calendar]:before:rounded-[calc(var(--radius-xl)-1px)] data-starting-style:scale-98 data-starting-style:opacity-0 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
						tooltipStyle &&
							"w-fit text-balance rounded-md text-xs shadow-md/5 before:rounded-[calc(var(--radius-md)-1px)]",
						className,
					)}
					data-slot="popover-popup"
					{...props}
				>
					<PopoverBase.Viewport
						className={cn(
							"relative size-full max-h-(--available-height) overflow-clip px-(--viewport-inline-padding) py-4 [--viewport-inline-padding:--spacing(4)] has-data-[slot=calendar]:p-2 data-instant:transition-none **:data-current:data-ending-style:opacity-0 **:data-current:data-starting-style:opacity-0 **:data-previous:data-ending-style:opacity-0 **:data-previous:data-starting-style:opacity-0 **:data-current:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding)-2px)] **:data-previous:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding)-2px)] **:data-current:opacity-100 **:data-previous:opacity-100 **:data-current:transition-opacity **:data-previous:transition-opacity",
							tooltipStyle
								? "py-1 [--viewport-inline-padding:--spacing(2)]"
								: "not-data-transitioning:overflow-y-auto",
							popoverProps.className,
						)}
						data-slot="popover-viewport"
					>
						{children}
					</PopoverBase.Viewport>
				</PopoverBase.Popup>
			</PopoverBase.Positioner>
		</PopoverBase.Portal>
	);
}
export function PopoverClose({
	...props
}: PopoverBase.Close.Props): React.ReactElement {
	return <PopoverBase.Close data-slot="popover-close" {...props} />;
}
export function PopoverTitle({
	className,
	...props
}: PopoverBase.Title.Props): React.ReactElement {
	return (
		<PopoverBase.Title
			className={cn("font-semibold text-lg leading-none", className)}
			data-slot="popover-title"
			{...props}
		/>
	);
}
export function PopoverDescription({
	className,
	...props
}: PopoverBase.Description.Props): React.ReactElement {
	return (
		<PopoverBase.Description
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="popover-description"
			{...props}
		/>
	);
}
export { PopoverBase, PopoverPopup as PopoverContent };
