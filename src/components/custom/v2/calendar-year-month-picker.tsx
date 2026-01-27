import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useLocalization } from "@/hooks/use-localization";
import { useScreens } from "@/hooks/use-screens";
import dayjs from "dayjs";
import { type ReactNode, useState } from "react";

interface CalendarYearMonthPickerProps {
	children: ReactNode;
}

export function CalendarYearMonthPicker({ children }: CalendarYearMonthPickerProps) {
	const { calendarIndex, setCalendarIndex, isViewingCurrentMonth } = useScreens();
	const { m } = useLocalization();
	const [open, setOpen] = useState(false);

	const currentDate = dayjs(calendarIndex);
	const [selectedYear, setSelectedYear] = useState(currentDate.year().toString());
	const [selectedMonth, setSelectedMonth] = useState((currentDate.month() + 1).toString());

	// Generate years from 1900 to 2100
	const years = Array.from({ length: 201 }, (_, i) => (1900 + i).toString());

	// Generate months (1-12)
	const months = Array.from({ length: 12 }, (_, i) => {
		const monthNum = i + 1;
		const monthName = dayjs().month(i).format("MMMM");
		return { value: monthNum.toString(), label: monthName };
	});

	const handleApply = () => {
		const newDate = dayjs()
			.year(Number.parseInt(selectedYear))
			.month(Number.parseInt(selectedMonth) - 1)
			.format("YYYY-MM");
		setCalendarIndex(newDate);
		setOpen(false);
	};

	const handleGoToToday = () => {
		const currentMonth = dayjs().format("YYYY-MM");
		setCalendarIndex(currentMonth);
		setOpen(false);
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (newOpen) {
			// Update selected values when opening
			const current = dayjs(calendarIndex);
			setSelectedYear(current.year().toString());
			setSelectedMonth((current.month() + 1).toString());
		}
		setOpen(newOpen);
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				{children}
			</PopoverTrigger>
			<PopoverContent className="w-80 p-4" align="center">
				<div className="space-y-4">
					<div className="text-sm font-semibold text-center">
						{m.SelectYearMonth?.() || "Select year and month"}
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<label className="text-xs text-muted-foreground">
								{m.Year?.() || "Year"}
							</label>
							<Select value={selectedYear} onValueChange={setSelectedYear}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="max-h-60">
									{years.map((year) => (
										<SelectItem key={year} value={year}>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label className="text-xs text-muted-foreground">
								{m.Month?.() || "Month"}
							</label>
							<Select value={selectedMonth} onValueChange={setSelectedMonth}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{months.map((month) => (
										<SelectItem key={month.value} value={month.value}>
											{month.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="flex gap-2">
						{!isViewingCurrentMonth && (
							<Button onClick={handleGoToToday} variant="outline" className="flex-1">
								{m.Today?.() || "Today"}
							</Button>
						)}
						<Button onClick={handleApply} className="flex-1">
							{m.Apply?.() || "Apply"}
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
