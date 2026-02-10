import { AmountDisplay } from "@/components/custom/amount-display";
import {
  GroupDrawer,
  type GroupDrawerRef,
} from "@/components/custom/group-drawer";
import {
  DecimalModeSelector,
  DecimalSelector,
  LanguageSelector,
  MainCurrencySelector,
} from "@/components/custom/settings";
import { TagDrawer, type TagDrawerRef } from "@/components/custom/tag-drawer";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import {
  EraseDataDrawer,
  type EraseDataDrawerRef,
} from "@/components/custom/v2/erase-data-drawer";
import {
  ImportDataDrawer,
  type ImportDataDrawerRef,
} from "@/components/custom/v2/import-data-drawer";
import {
  ImportExportDrawer,
  type ImportExportDrawerRef,
} from "@/components/custom/v2/import-export-drawer";
import {
  PrivateKeyDrawer,
  type PrivateKeyDrawerRef,
} from "@/components/custom/v2/private-key-drawer";
import {
  RestoreKeyDrawer,
  type RestoreKeyDrawerRef,
} from "@/components/custom/v2/restore-key-drawer";
import { Button } from "@/components/ui/button";
import { useLocalization } from "@/hooks/use-localization";
import { cn, storageKeys } from "@/lib/utils";
import {
  IconCashBanknoteFilled,
  IconCategoryFilled,
  IconChevronRight,
  IconCloudDownload,
  IconContrastFilled,
  IconDatabaseImport,
  IconDecimal,
  IconEyeFilled,
  IconKeyFilled,
  IconLanguageHiragana,
  IconNumber123,
  IconTagsFilled,
  IconTrashXFilled,
  type TablerIcon,
} from "@tabler/icons-react";

import type React from "react";

import { useRef } from "react";

import { exportBackupData, exportLogicalData } from "@/lib/export";

function SettingsRow({
  title,
  Icon,
  iconBackground,
  children,
}: {
  title: string;
  Icon: TablerIcon;
  iconBackground: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between min-h-9 text-sm">
      <h1 className="flex items-center text-base font-medium gap-2">
        <div
          className={cn(
            "size-6 bg-zinc-400 rounded-xs flex items-center justify-center",
            iconBackground
          )}
        >
          <Icon className={cn("size-4 text-white")} />
        </div>
        {title}
      </h1>
      <div>{children}</div>
    </div>
  );
}
export function SettingsScreen() {
  const { mainCurrency, m, decimalMode } = useLocalization();
  const groupDrawerRef = useRef<GroupDrawerRef>(null);
  const tagDrawerRef = useRef<TagDrawerRef>(null);
  const eraseDataDrawerRef = useRef<EraseDataDrawerRef>(null);
  const importDataDrawerRef = useRef<ImportDataDrawerRef>(null);
  const importLogicalDataDrawerRef = useRef<ImportDataDrawerRef>(null);
  const importExportDrawerRef = useRef<ImportExportDrawerRef>(null);
  const privateKeyDrawerRef = useRef<PrivateKeyDrawerRef>(null);
  const restoreKeyDrawerRef = useRef<RestoreKeyDrawerRef>(null);

  return (
    <>
      <div className="flex-1 h-svh overflow-y-auto py-4 relative">
        <div className="px-4">
          <div className="text-3xl font-bold mb-4">Settings</div>

          <div className="flex flex-col gap-6 mb-4">
            <div>
              <h1 className="text-xs text-zinc-400 dark:text-zinc-600 uppercase font-bold mb-1">
                {m.General()}
              </h1>
              <div className="rounded px-2 -mx-2 text-sm flex flex-col gap-1">
                <SettingsRow
                  Icon={IconContrastFilled}
                  iconBackground="bg-sky-500"
                  title={m.Theme()}
                >
                  <ThemeToggle />
                </SettingsRow>
                <SettingsRow
                  Icon={IconLanguageHiragana}
                  iconBackground="bg-orange-500"
                  title={m.Localization()}
                >
                  <LanguageSelector />
                </SettingsRow>
              </div>
            </div>

            <div>
              <h1 className="text-xs text-zinc-400 dark:text-zinc-600 uppercase font-bold mb-1">
                {m.Currency()}
              </h1>
              <div className=" rounded px-2 -mx-2 text-sm flex flex-col gap-1">
                <SettingsRow
                  Icon={IconCashBanknoteFilled}
                  iconBackground="bg-green-500"
                  title={m.MainCurrency()}
                >
                  <MainCurrencySelector />
                </SettingsRow>
                <SettingsRow
                  Icon={IconDecimal}
                  iconBackground="bg-teal-500"
                  title={m.DecimalLength()}
                >
                  <DecimalSelector />
                </SettingsRow>
                <SettingsRow
                  Icon={IconNumber123}
                  iconBackground="bg-cyan-600"
                  title={m.NumberFormat()}
                >
                  <DecimalModeSelector />
                </SettingsRow>
                <SettingsRow
                  Icon={IconEyeFilled}
                  iconBackground="bg-zinc-500"
                  title={m.Preview()}
                >
                  <AmountDisplay
                    amount={"12345678"}
                    currencyCode={mainCurrency}
                    type="short"
                    decimalMode={decimalMode}
                    useVision={false}
                  />
                </SettingsRow>
              </div>
            </div>

            <div>
              <h1 className="text-xs text-zinc-400 dark:text-zinc-600 uppercase font-bold mb-1">
                {m.GroupsAndTags()}
              </h1>
              <div className="px-2 -mx-2 text-sm flex flex-col gap-1">
                <SettingsRow
                  Icon={IconCategoryFilled}
                  iconBackground="bg-fuchsia-500"
                  title={m.Groups()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded"
                    onClick={() => {
                      groupDrawerRef.current?.openDrawer();
                    }}
                  >
                    {m.Manage()}{" "}
                    <IconChevronRight className="size-4 ml-1  relative -mr-1" />
                  </Button>
                </SettingsRow>
                <SettingsRow
                  Icon={IconTagsFilled}
                  iconBackground="bg-indigo-500"
                  title={m.Tags()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded"
                    onClick={() => {
                      tagDrawerRef.current?.openDrawer();
                    }}
                  >
                    {m.Manage()}{" "}
                    <IconChevronRight className="size-4 ml-1 relative -mr-1" />
                  </Button>
                </SettingsRow>
              </div>
            </div>

            <div>
              <h1 className="text-xs text-zinc-400 dark:text-zinc-600 uppercase font-bold mb-1">
                Data
              </h1>
              <div className="px-2 -mx-2 text-sm flex flex-col gap-1">
                <SettingsRow
                  Icon={IconKeyFilled}
                  iconBackground="bg-pink-500"
                  title={m.ViewPrivateKey()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded"
                    onClick={() => {
                      privateKeyDrawerRef.current?.openDrawer();
                    }}
                  >
                    {m.View()}{" "}
                    <IconChevronRight className="size-4 ml-1  relative -mr-1" />
                  </Button>
                </SettingsRow>
                <SettingsRow
                  Icon={IconCloudDownload}
                  iconBackground="bg-teal-500"
                  title={m.RestoreData()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded"
                    onClick={() => {
                      restoreKeyDrawerRef.current?.openDrawer();
                    }}
                  >
                    {m.Restore()}{" "}
                    <IconChevronRight className="size-4 ml-1  relative -mr-1" />
                  </Button>
                </SettingsRow>
                <SettingsRow
                  Icon={IconTrashXFilled}
                  iconBackground="bg-red-500"
                  title={m.EraseData()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded"
                    onClick={() => {
                      eraseDataDrawerRef.current?.openDrawer();
                    }}
                  >
                    {m.Erase()}{" "}
                    <IconChevronRight className="size-4 ml-1  relative -mr-1" />
                  </Button>
                </SettingsRow>
                <SettingsRow
                  Icon={IconDatabaseImport}
                  iconBackground="bg-cyan-600"
                  title={`${m.Import()} / ${m.Export()}`}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded"
                    onClick={() => {
                      importExportDrawerRef.current?.openDrawer();
                    }}
                  >
                    {m.Manage()}{" "}
                    <IconChevronRight className="size-4 ml-1 relative -mr-1" />
                  </Button>
                </SettingsRow>
              </div>
            </div>
          </div>

          <div className="text-muted-foreground text-xs mt-8 flex flex-col items-center gap-1 text-center">
            <span>giderim v{__APP_VERSION__}</span>
            <p>
              Made by{" "}
              <a
                href="https://github.com/needim"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-foreground"
              >
                Nedim
              </a>
              , maintaining by{" "}
              <a
                href="https://github.com/erdinctekay"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-foreground"
              >
                Erdinc
              </a>
            </p>
          </div>
          <div className="text-muted-foreground text-xs mt-1 flex items-center gap-2 justify-center">
            <button
              onClick={() => {
                localStorage.removeItem(storageKeys.onboarding);
                localStorage.removeItem(storageKeys.firstShowAnimation);
                localStorage.removeItem(storageKeys.activeScreen);
                window.location.reload();
              }}
              className="underline"
            >
              {m.RestartOnboarding()}
            </button>
            <span>•</span>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="underline"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
      <GroupDrawer ref={groupDrawerRef} />
      <TagDrawer ref={tagDrawerRef} />
      <EraseDataDrawer ref={eraseDataDrawerRef} />
      <ImportDataDrawer ref={importDataDrawerRef} />
      <ImportDataDrawer ref={importLogicalDataDrawerRef} mode="logical" />
      <ImportExportDrawer
        ref={importExportDrawerRef}
        onExportBackup={() => {
          exportBackupData();
        }}
        onImportBackup={() => {
          importDataDrawerRef.current?.openDrawer();
        }}
        onExportJson={() => {
          exportLogicalData();
        }}
        onImportJson={() => {
          importLogicalDataDrawerRef.current?.openDrawer();
        }}
      />
      <PrivateKeyDrawer ref={privateKeyDrawerRef} />
      <RestoreKeyDrawer ref={restoreKeyDrawerRef} />
    </>
  );
}
