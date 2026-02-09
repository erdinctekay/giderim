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
import { importDatabase } from "@/lib/import";
import { IconDatabaseImport } from "@tabler/icons-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface ImportDataDrawerRef {
	openDrawer: () => void;
	closeDrawer: () => void;
}

export const ImportDataDrawer = forwardRef<ImportDataDrawerRef, {}>(
	(_, ref) => {
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
				await importDatabase(selectedFile);
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
						<DrawerTitle>{m.ImportData()}</DrawerTitle>
						<DrawerDescription className="text-balance">
							{m.ImportDataDesc()}
						</DrawerDescription>
					</DrawerHeader>
					<div className="mx-4 flex flex-col gap-3">
						<input
							ref={fileInputRef}
							type="file"
							accept=".db,.sqlite,.sqlite3,.txt"
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
								: m.SelectDatabaseFile()}
						</Button>
						{error && (
							<p className="text-sm text-red-500 text-center">
								{error}
							</p>
						)}
						<p className="text-xs text-muted-foreground text-center text-balance">
							{m.ImportDataWarning()}
						</p>
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
