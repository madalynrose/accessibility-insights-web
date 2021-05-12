// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AxeResults, ElementContext, source as axeCoreSource } from 'axe-core';
import { Page } from 'playwright';
import { AppController } from 'tests/electron/common/view-controllers/app-controller';
import {
    prettyPrintAxeViolations,
    PrintableAxeResult,
} from 'tests/end-to-end/common/pretty-print-axe-violations';

declare let axe;

export async function scanForAccessibilityIssuesInAllModes(app: AppController): Promise<void> {
    await scanForAccessibilityIssues(app, true);
    await scanForAccessibilityIssues(app, false);
}

async function scanForAccessibilityIssues(
    app: AppController,
    enableHighContrast: boolean,
): Promise<void> {
    await app.setHighContrastMode(enableHighContrast);
    await app.waitForHighContrastMode(enableHighContrast);

    const violations = await runAxeScan(app.page);
    expect(violations).toStrictEqual([]);
}

export async function runAxeScan(page: Page, selector?: string): Promise<PrintableAxeResult[]> {
    await injectAxeIfUndefined(page);

    const axeResults = (await page.evaluate(selectorInEvaluate => {
        return axe.run(
            { include: [selectorInEvaluate] } as ElementContext,
            {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa'] },
            } as ElementContext,
        );
    }, selector)) as AxeResults;

    return prettyPrintAxeViolations(axeResults);
}

async function injectAxeIfUndefined(page: Page): Promise<void> {
    const axeIsUndefined = await page.evaluate(() => {
        return (window as any).axe === undefined;
    }, null);

    if (axeIsUndefined) {
        await page.addInitScript(axeCoreSource);
    }
}
