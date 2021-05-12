// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { Page } from 'playwright';
import { TabStopsViewSelectors } from 'tests/electron/common/element-identifiers/tab-stops-view-selectors';
import { ViewController } from './view-controller';

export class TabStopsViewController extends ViewController {
    constructor(page: Page) {
        super(page);
    }

    public async clickToggleTabStops(): Promise<void> {
        await this.waitForSelector(TabStopsViewSelectors.tabStopsToggle);
        await this.page.click(TabStopsViewSelectors.tabStopsToggle);
    }
}
