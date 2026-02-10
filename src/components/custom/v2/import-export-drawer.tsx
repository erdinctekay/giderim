import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useLocalization } from "@/hooks/use-localization";
import { cn } from "@/lib/utils";
import {
	IconChevronRight,
	IconDatabaseCog,
	IconDatabaseImport,
	IconSquareArrowUpFilled,
	type TablerIcon,
} from "@tabler/icons-react";
import { forwardRef, useImperativeHandle, useState } from "react";

interface ActionRowProps {
	title: string;
	Icon: TablerIcon;
	iconBackground: string;
	actionLabel: string;
	onAction: () => void;
}

function ActionRow({
	title,
	Icon,
	iconBackground,
	actionLabel,
	onAction,
}: ActionRowProps) {
	return (
		<div className="flex items-center justify-between min-h-9 text-sm">
			<h1 className="flex items-center text-base font-medium gap-2">
				<div
					className={cn(
						"size-6 bg-zinc-400 rounded-xs flex items-center justify-center",
						iconBackground,
					)}
				>
					<Icon className={cn("size-4 text-white")} />
				</div>
				{title}
			</h1>
			<Button size="sm" variant="outline" className="rounded" onClick={onAction}>
				{actionLabel}{" "}
				<IconChevronRight className="size-4 ml-1 relative -mr-1" />
			</Button>
		</div>
	);
}

export interface ImportExportDrawerRef {
	openDrawer: () => void;
	closeDrawer: () => void;
}

interface ImportExportDrawerProps {
	onExportBackup: () => void;
	onImportBackup: () => void;
	onExportJson: () => void;
	onImportJson: () => void;
}

export const ImportExportDrawer = forwardRef<
	ImportExportDrawerRef,
	ImportExportDrawerProps
>(({ onExportBackup, onImportBackup, onExportJson, onImportJson }, ref) => {
	const { m } = useLocalization();
	const [open, setOpen] = useState(false);

	useImperativeHandle(ref, () => ({
		openDrawer: () => {
			setOpen(true);
		},
		closeDrawer: () => {
			setOpen(false);
		},
	}));

	const closeThenRun = (action: () => void) => {
		setOpen(false);
		window.setTimeout(() => {
			action();
		}, 180);
	};

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerContent className="pb-6 max-w-md mx-auto">
				<DrawerHeader>
					<IconDatabaseCog className="text-cyan-600 w-12 h-12 mx-auto mb-2" />
					<DrawerTitle>{`${m.Import()} / ${m.Export()}`}</DrawerTitle>
					<DrawerDescription className="text-balance">
						{m.ImportExportDesc()}
					</DrawerDescription>
				</DrawerHeader>
				<div className="mx-4 flex flex-col gap-1 mb-4">
					<div className="mb-2 rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-[12px] leading-relaxed text-orange-900 dark:text-orange-200">
						{m.ImportExportWarning()}
					</div>
					<ActionRow
						Icon={IconSquareArrowUpFilled}
						iconBackground="bg-cyan-500"
						title={m.ExportBackupTitle()}
						actionLabel={m.Export()}
						onAction={() => closeThenRun(onExportBackup)}
					/>
					<ActionRow
						Icon={IconDatabaseImport}
						iconBackground="bg-lime-500"
						title={m.ImportBackupTitle()}
						actionLabel={m.Import()}
						onAction={() => closeThenRun(onImportBackup)}
					/>
					<ActionRow
						Icon={IconSquareArrowUpFilled}
						iconBackground="bg-blue-500"
						title={m.ExportJsonTitle()}
						actionLabel={m.Export()}
						onAction={() => closeThenRun(onExportJson)}
					/>
					<ActionRow
						Icon={IconDatabaseImport}
						iconBackground="bg-emerald-500"
						title={m.ImportJsonTitle()}
						actionLabel={m.Import()}
						onAction={() => closeThenRun(onImportJson)}
					/>
				</div>
			</DrawerContent>
		</Drawer>
	);
});
