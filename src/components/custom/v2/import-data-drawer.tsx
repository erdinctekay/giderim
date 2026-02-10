import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useLocalization } from "@/hooks/use-localization";
import { importDatabase, importLogicalData } from "@/lib/import";
import { IconDatabaseImport } from "@tabler/icons-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface ImportDataDrawerRef {
	openDrawer: () => void;
	closeDrawer: () => void;
}

interface ImportDataDrawerProps {
	mode?: "backup" | "logical";
}

export const ImportDataDrawer = forwardRef<
	ImportDataDrawerRef,
	ImportDataDrawerProps
>(
	({ mode = "backup" }: ImportDataDrawerProps, ref) => {
		const [open, setOpen] = useState(false);
		const [selectedFile, setSelectedFile] = useState<File | null>(null);
		const [importing, setImporting] = useState(false);
		const [error, setError] = useState<string | null>(null);
		const fileInputRef = useRef<HTMLInputElement>(null);

		const { m } = useLocalization();

		useImperativeHandle(ref, () => ({
			openDrawer: () => {
				setSelectedFile(null);
				setError(null);
				setImporting(false);
				setOpen(true);
			},
			closeDrawer: () => {
				setOpen(false);
			},
		}));

		const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0] ?? null;
			setSelectedFile(file);
			setError(null);
		};

		const handleImport = async () => {
			if (!selectedFile) return;

			setImporting(true);
			setError(null);

			try {
				if (mode === "logical") {
					await importLogicalData(selectedFile);
					window.location.reload();
				} else {
					await importDatabase(selectedFile);
				}
			} catch (err) {
				setError(
					err instanceof Error ? err.message : m.ImportFailed(),
				);
				setImporting(false);
			}
		};

		return (
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerContent className="pb-6 max-w-md mx-auto">
					<DrawerHeader>
						<IconDatabaseImport className="text-cyan-600 w-12 h-12 mx-auto mb-2" />
						<DrawerTitle>{mode === "logical" ? m.ImportJsonTitle() : m.ImportBackupTitle()}</DrawerTitle>
						<DrawerDescription className="text-balance">
							{mode === "logical" ? m.ImportJsonDesc() : m.ImportBackupDesc()}
						</DrawerDescription>
					</DrawerHeader>
					<div className="mx-4 flex flex-col gap-3">
						<input
							ref={fileInputRef}
							type="file"
							accept={
								mode === "logical"
									? ".json"
									: ".db,.sqlite,.sqlite3,.txt"
							}
							onChange={handleFileSelect}
							className="hidden"
						/>
						<Button
							variant="outline"
							size="lg"
							onClick={() => fileInputRef.current?.click()}
							disabled={importing}
						>
							{selectedFile
								? selectedFile.name
								: mode === "logical"
									? m.SelectJsonFile()
									: m.SelectDatabaseFile()}
						</Button>
						{error && (
							<p className="text-sm text-red-500 text-center">
								{error}
							</p>
						)}
						<div className="rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-[12px] leading-relaxed text-orange-900 dark:text-orange-200">
							{mode === "logical" ? m.ImportJsonWarning() : m.ImportBackupWarning()}
						</div>
					</div>
					<DrawerFooter className="grid grid-cols-1">
						<Button
							variant="default"
							size="lg"
							disabled={!selectedFile || importing}
							onClick={handleImport}
						>
							{importing ? m.InProgress() : m.Import()}
						</Button>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		);
	},
);
