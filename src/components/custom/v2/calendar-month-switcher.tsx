import { Button } from "@/components/ui/button";
import { CalendarYearMonthPicker } from "@/components/custom/v2/calendar-year-month-picker";
import { useLocalization } from "@/hooks/use-localization";
import { useScreens } from "@/hooks/use-screens";
import { cn } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight, IconRestore } from "@tabler/icons-react";
import dayjs from "dayjs";

export function CalendarMonthSwitcher(): React.ReactElement {
	const {
		activeScreen,
		calendarIndex,
		setCalendarIndex,
		isViewingCurrentMonth,
	} = useScreens();
	const { m } = useLocalization();

	if (activeScreen !== "calendar") {
		return <></>;
	}

	return (
		<div className="w-full relative flex justify-center">
			<div className="inline-flex items-center justify-between">
				<Button
					onClick={() => {
						setCalendarIndex(dayjs(calendarIndex).subtract(1, "month").format("YYYY-MM"));
					}}
					size="icon"
					variant="ghost"
				>
					<span className="sr-only">{m.PreviousMonth()}</span>
					<IconChevronLeft className="size-6" />
				</Button>
				<CalendarYearMonthPicker>
					<button
						className={cn(
							"tabular-nums text-sm font-semibold min-w-48 h-10 space-x-2 text-center relative flex items-center justify-center",
							"rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
							isViewingCurrentMonth && "text-foreground",
						)}
					>
						<span className={cn("flex items-center", isViewingCurrentMonth ? "px-2" : "")}>
							{!isViewingCurrentMonth && (
								<IconRestore className="size-4 mr-1.5" />
							)}
							<span>{dayjs(new Date(calendarIndex)).format("MMMM, YYYY")}</span>
						</span>
					</button>
				</CalendarYearMonthPicker>
				<Button
					size="icon"
					variant="ghost"
					onClick={() => {
						setCalendarIndex(dayjs(calendarIndex).add(1, "month").format("YYYY-MM"));
					}}
				>
					<span className="sr-only">{m.NextMonth()}</span>
					<IconChevronRight className="size-6" />
				</Button>
			</div>
		</div>
	);
}
