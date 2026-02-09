import { Toaster } from "@/components/ui/toaster";
import { storageKeys } from "@/lib/utils.tsx";

import {
	type AvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "@/paraglide/runtime.js";
import { FiltersProvider } from "@/providers/filters.tsx";
import { LocalizationProvider } from "@/providers/localization.tsx";
import { type Theme, ThemeProvider } from "@/providers/theme.tsx";
import UpdatePrompt from "@/update-prompt.tsx";
import { EvoluProvider } from "@evolu/react";
import "dayjs/locale/en";
import "dayjs/locale/tr";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "unfonts.css";
import App from "./App.tsx";
import "./index.css";
import { debugOPFS, processPendingImport } from "@/lib/import";

const localTheme =
	(localStorage.getItem(storageKeys.theme) as Theme) || "system";
const localLang =
	(localStorage.getItem(storageKeys.lang) as AvailableLanguageTag) ||
	sourceLanguageTag;
setLanguageTag(localLang);

window.oncontextmenu = () => false;

async function bootstrap() {
	console.log("[bootstrap] Starting...");

	// Process any pending database import BEFORE Evolu initializes.
	// This writes the imported SQLite file to OPFS while no locks are held.
	const imported = await processPendingImport();
	console.log(`[bootstrap] Import result: ${imported}`);

	// Dump OPFS state for debugging
	await debugOPFS();

	console.log("[bootstrap] Loading Evolu...");
	// Import evolu-db AFTER the pending import is processed,
	// so createEvolu() picks up the replaced database.
	const { evolu } = await import("@/evolu-db.ts");
	console.log("[bootstrap] Evolu loaded, rendering app...");

	ReactDOM.createRoot(document.getElementById("root")!).render(
		<React.StrictMode>
			<EvoluProvider value={evolu}>
				<FiltersProvider>
					<ThemeProvider defaultTheme={localTheme}>
						<LocalizationProvider defaultLang={localLang}>
							<App />
							<Toaster />
							<Suspense>
								<UpdatePrompt />
							</Suspense>
						</LocalizationProvider>
					</ThemeProvider>
				</FiltersProvider>
			</EvoluProvider>
		</React.StrictMode>,
	);
}

bootstrap();
