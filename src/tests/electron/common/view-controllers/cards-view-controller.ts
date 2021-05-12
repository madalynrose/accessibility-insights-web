// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { Page } from 'playwright';
import { ScreenshotViewSelectors } from 'tests/electron/common/element-identifiers/screenshot-view-selectors';
import { AutomatedChecksViewSelectors } from '../element-identifiers/automated-checks-view-selectors';
import { ViewController } from './view-controller';

export class CardsViewController extends ViewController {
    constructor(page: Page) {
        super(page);
    }
    public async waitForRuleGroupCount(count: number): Promise<void> {
        await this.waitForNumberOfSelectorMatches(AutomatedChecksViewSelectors.ruleGroup, count);
    }

    public async waitForHighlightBoxCount(count: number): Promise<void> {
        await this.waitForNumberOfSelectorMatches(ScreenshotViewSelectors.highlightBox, count);
    }

    public async queryRuleGroupContents(): Promise<any[]> {
        return this.page.$$(AutomatedChecksViewSelectors.ruleContent);
    }

    public async toggleRuleGroupAtPosition(position: number): Promise<void> {
        const selector = AutomatedChecksViewSelectors.nthRuleGroupCollapseExpandButton(position);
        await this.waitForSelector(selector);
        await this.page.click(selector);
    }

    public async assertExpandedRuleGroup(
        position: number,
        expectedTitle: string,
        expectedFailures: number,
    ): Promise<void> {
        const title = await this.page.textContent(
            AutomatedChecksViewSelectors.nthRuleGroupTitle(position),
        );

        expect(title).toEqual(expectedTitle);

        const failures = await this.page.$$(
            AutomatedChecksViewSelectors.nthRuleGroupInstances(position),
        );

        expect(failures).toHaveLength(expectedFailures);
    }

    public async assertCollapsedRuleGroup(position: number, expectedTitle: string): Promise<void> {
        const title = await this.page.textContent(
            AutomatedChecksViewSelectors.nthRuleGroupTitle(position),
        );

        expect(title).toEqual(expectedTitle);

        const failures = await this.page.$$(
            AutomatedChecksViewSelectors.nthRuleGroupInstances(position),
        );

        expect(failures).toHaveLength(0);
    }
}
