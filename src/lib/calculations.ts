import type { TGroupId, TTagId } from "@/evolu-db";
import type { TPopulatedEntry } from "@/lib/populateEntries";
import dayjs, { type Dayjs } from "dayjs";

export const calculateTotals = (
  groupedEntries: Record<string, TPopulatedEntry[]>
) => {
  return Object.entries(groupedEntries).reduce((acc, [currency, entries]) => {
    acc[currency] = entries.reduce(
      (acc, e) => acc + Number(e.details.amount),
      0
    );
    return acc;
  }, {} as Record<string, number>);
};

export const calculatedFullfilledTotals = (
  groupedEntries: Record<string, TPopulatedEntry[]>
) => {
  return Object.entries(groupedEntries).reduce((acc, [currency, entries]) => {
    acc[currency] = entries
      .filter((e) => e.details.fullfilled)
      .reduce((acc, e) => acc + Number(e.details.amount), 0);
    return acc;
  }, {} as Record<string, number>);
};

export type TCALCULATIONS_OUTPUT = Record<
  number,
  {
    month: Dayjs;
    income: TPopulatedEntry[];
    expense: TPopulatedEntry[];
    assets: TPopulatedEntry[]; // not implemented yet
    grouped: {
      income: Record<
        string,
        {
          entries: TPopulatedEntry[];
          expected: number;
          fullfilled: number;
          remaining: number;
        }
      >;
      expense: Record<
        string,
        {
          entries: TPopulatedEntry[];
          expected: number;
          fullfilled: number;
          remaining: number;
        }
      >;
    };
    // ---
    result: {
      inMainCurrency: {
        actual: {
          income: number;
          expense: number;
          total: number;
        };
        foresight: {
          income: number;
          expense: number;
          total: number;
        };
      };
      actual: Record<string, number>;
      foresight: Record<string, number>;
    };
  }
>;

const createEmptyMonthCalculation = (month: Dayjs): TCALCULATIONS_OUTPUT[number] => ({
  month,
  income: [],
  expense: [],
  assets: [],
  grouped: {
    income: {},
    expense: {},
  },
  result: {
    inMainCurrency: {
      actual: {
        income: 0,
        expense: 0,
        total: 0,
      },
      foresight: { income: 0, expense: 0, total: 0 },
    },
    actual: {},
    foresight: {},
  },
});

export const getCalculations = ({
  rates,
  viewportStartDate,
  populatedEntries,
  groupFilters,
  tagFilters,
  mainCurrency,
  requiredIndexes = [],
}: {
  rates: Record<string, number>;
  viewportStartDate: dayjs.Dayjs;
  populatedEntries: TPopulatedEntry[];
  groupFilters?: (TGroupId | "no-group")[];
  tagFilters?: (TTagId | "no-tag")[];
  mainCurrency: string;
  requiredIndexes?: number[];
}) => {
  const CALC: TCALCULATIONS_OUTPUT = {};

  if (groupFilters && groupFilters.length > 0) {
    populatedEntries = populatedEntries.filter((entry) =>
      groupFilters.includes(entry.details.groupId || "no-group")
    );
  }

  if (tagFilters && tagFilters.length > 0) {
    populatedEntries = populatedEntries.filter((entry) =>
      tagFilters.includes(entry.details.tagId || "no-tag")
    );
  }

  populatedEntries.forEach((entry) => {
    const month = dayjs(entry.date).startOf("month");
    const i = month.diff(viewportStartDate, "month");

    if (!CALC[i]) {
      CALC[i] = createEmptyMonthCalculation(month);
    }

    const currency = entry.details.currencyCode;
    const type = entry.details.type;
    const isFullfilled = !!entry.details.fullfilled;
    const amount = Number(entry.details.amount);
    const actualAmount = isFullfilled ? amount : 0;

    CALC[i][type].push(entry);

    CALC[i].grouped[type][currency] ??= {
      entries: [],
      expected: 0,
      fullfilled: 0,
      remaining: 0,
    };

    CALC[i].grouped[type][currency].entries.push(entry);
    CALC[i].grouped[type][currency].expected += amount;
    CALC[i].grouped[type][currency].fullfilled += isFullfilled ? amount : 0;
    CALC[i].grouped[type][currency].remaining += isFullfilled ? 0 : amount;

    CALC[i].result.actual[currency] ??= 0;
    CALC[i].result.foresight[currency] ??= 0;

    CALC[i].result.actual[currency] +=
      type === "expense" ? -1 * actualAmount : actualAmount;
    CALC[i].result.foresight[currency] +=
      type === "expense" ? -1 * amount : amount;

    CALC[i].result.inMainCurrency.actual[type] += actualAmount;
    CALC[i].result.inMainCurrency.foresight[type] += amount;
  });

  requiredIndexes.forEach((i) => {
    if (!CALC[i]) {
      CALC[i] = createEmptyMonthCalculation(
        viewportStartDate.add(i, "month")
      );
    }
  });

  Object.values(CALC).forEach((monthCalc) => {
    const usedCurrencies = new Set<string>([
      ...Object.keys(monthCalc.grouped.income),
      ...Object.keys(monthCalc.grouped.expense),
    ]);

    const isDifferentCurrencyUsed = Array.from(usedCurrencies).some(
      (currency) => currency !== mainCurrency
    );

    if (!isDifferentCurrencyUsed) {
      monthCalc.result.inMainCurrency.actual.total =
        monthCalc.result.inMainCurrency.actual.income -
        monthCalc.result.inMainCurrency.actual.expense;

      monthCalc.result.inMainCurrency.foresight.total =
        monthCalc.result.inMainCurrency.foresight.income -
        monthCalc.result.inMainCurrency.foresight.expense;
      return;
    }

    if (Object.keys(rates).length === 0) {
      return;
    }

    monthCalc.result.inMainCurrency.actual.income = Object.entries(
      monthCalc.grouped.income
    ).reduce((acc, [currency, data]) => {
      acc += data.fullfilled * (rates[currency] ?? 0);
      return acc;
    }, 0);

    monthCalc.result.inMainCurrency.actual.expense = Object.entries(
      monthCalc.grouped.expense
    ).reduce((acc, [currency, data]) => {
      acc += data.fullfilled * (rates[currency] ?? 0);
      return acc;
    }, 0);

    monthCalc.result.inMainCurrency.actual.total =
      monthCalc.result.inMainCurrency.actual.income -
      monthCalc.result.inMainCurrency.actual.expense;

    monthCalc.result.inMainCurrency.foresight.income = Object.entries(
      monthCalc.grouped.income
    ).reduce((acc, [currency, data]) => {
      acc += data.expected * (rates[currency] ?? 0);
      return acc;
    }, 0);

    monthCalc.result.inMainCurrency.foresight.expense = Object.entries(
      monthCalc.grouped.expense
    ).reduce((acc, [currency, data]) => {
      acc += data.expected * (rates[currency] ?? 0);
      return acc;
    }, 0);

    monthCalc.result.inMainCurrency.foresight.total =
      monthCalc.result.inMainCurrency.foresight.income -
      monthCalc.result.inMainCurrency.foresight.expense;
  });

  return CALC;
};
