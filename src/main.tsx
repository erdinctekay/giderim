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
import { processPendingImport } from "@/lib/import";

let redirecting = false;
const appUrl = import.meta.env.VITE_APP_URL;
if (!import.meta.env.DEV && appUrl) {
	const canonical = new URL(appUrl);
	if (window.location.origin !== canonical.origin) {
		redirecting = true;
		window.location.replace(
			canonical.origin + window.location.pathname + window.location.search,
		);
	}
}

const localTheme =
	(localStorage.getItem(storageKeys.theme) as Theme) || "system";
const localLang =
	(localStorage.getItem(storageKeys.lang) as AvailableLanguageTag) ||
	sourceLanguageTag;
setLanguageTag(localLang);

window.oncontextmenu = () => false;

async function bootstrap() {
	// Process any pending database import BEFORE Evolu initializes.
	// This writes the imported SQLite file to OPFS while no locks are held.
	await processPendingImport();
	// Import evolu-db AFTER the pending import is processed,
	// so createEvolu() picks up the replaced database.
	const { evolu } = await import("@/evolu-db.ts");

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

if (!redirecting) bootstrap();
