// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as fs from 'fs';
import { DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS } from 'tests/electron/setup/timeouts';
import { screenshotOnError } from '../../../end-to-end/common/screenshot-on-error';
import { Page } from 'playwright';
export abstract class ViewController {
    constructor(public page: Page) {}

    public async waitForSelector(
        selector: string,
        timeout: number = DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS,
    ): Promise<void> {
        // Note: we're intentionally not using waitForVisible here because it has different
        // semantics than Puppeteer; in particular, it requires the element be in the viewport
        // but doesn't scroll the page to the element, so it's easy for it to fail in ways that
        // are dependent on the test environment.
        await this.screenshotOnError(
            async () => await this.page.waitForSelector(selector, { timeout }),
        );
    }

    public async waitForNumberOfSelectorMatches(
        selector: string,
        expectedNumber: number,
        timeout: number = DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS,
    ): Promise<void> {
        await this.screenshotOnError(async () => {
            await this.page.waitForFunction(
                async () => {
                    return (await this.page.$$(selector)).length === expectedNumber;
                },
                {
                    timeout,
                    timeoutMsg: `expected to find ${expectedNumber} matches for selector ${selector} within ${timeout}ms`,
                },
            );
        });
    }

    // Webdriver waits the full implicit waitForTimeout before returning not-found.
    // This means we need to wrap the waitForExist call with a longer timeout when
    // reverse is true. See webdriverio@2082 and ai-web@3599.
    public async waitForSelectorToDisappear(
        selector: string,
        timeout: number = DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS * 2,
    ): Promise<void> {
        await this.screenshotOnError(
            async () => await this.page.waitForSelector(selector, { timeout, state: 'detached' }),
        );
    }

    // You should avoid using this in most cases!
    //
    // This should only be used for cases where the product's intended functionality involves a
    // time-based delay (eg, a UI element animates in before becoming active), NOT sprinkled in
    // randomly in the hopes that it improves reliability.
    public async waitForMilliseconds(durationInMilliseconds: number): Promise<void> {
        await this.page.waitForTimeout(durationInMilliseconds);
    }

    public async click(selector: string): Promise<void> {
        await this.screenshotOnError(async () => this.page.click(selector));
    }

    public async isEnabled(selector: string): Promise<boolean> {
        return await this.screenshotOnError(async () => this.page.isEnabled(selector));
    }

    public async itemTextIncludesTarget(selector: string, target: string): Promise<boolean> {
        return await this.screenshotOnError(async () => {
            const itemText: string = await this.page.textContent(selector);
            return itemText.includes(target);
        });
    }

    private async screenshotOnError<T>(wrappedFunction: () => Promise<T>): Promise<T> {
        return await screenshotOnError(
            path => this.page.screenshot().then(buffer => fs.writeFileSync(path, buffer)),
            wrappedFunction,
        );
    }
}
