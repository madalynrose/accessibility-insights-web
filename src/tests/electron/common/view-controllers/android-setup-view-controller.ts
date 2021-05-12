// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AndroidSetupStepId } from 'electron/platform/android/setup/android-setup-step-id';
import { rightFooterButtonAutomationId } from 'electron/views/device-connect-view/components/automation-ids';
import { Page } from 'playwright';
import { getAutomationIdSelector } from 'tests/common/get-automation-id-selector';
import { ViewController } from './view-controller';

export class AndroidSetupViewController extends ViewController {
    constructor(page: Page) {
        super(page);
    }

    public async waitForDialogVisible(dialogStep: AndroidSetupStepId): Promise<void> {
        await this.page.waitForSelector(getAutomationIdSelector(`${dialogStep}-content`), {
            state: 'attached',
            timeout: 20000,
        });
    }

    // validates and starts scanning
    public async startTesting(): Promise<void> {
        const startTestingId = rightFooterButtonAutomationId;
        await this.page.waitForFunction(async () => {
            return await this.page.isEnabled(startTestingId);
        });
        await this.page.click(getAutomationIdSelector(startTestingId));
    }
}
