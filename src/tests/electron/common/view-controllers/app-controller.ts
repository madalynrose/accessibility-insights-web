// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AndroidSetupStepId } from 'electron/platform/android/setup/android-setup-step-id';
import { ElectronApplication, Page } from 'playwright';
import { AndroidSetupViewController } from 'tests/electron/common/view-controllers/android-setup-view-controller';
import { DeviceConnectionDialogController } from 'tests/electron/common/view-controllers/device-connection-dialog-controller';
import { ResultsViewController } from 'tests/electron/common/view-controllers/results-view-controller';
import { DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS } from 'tests/electron/setup/timeouts';
import { DEFAULT_PAGE_ELEMENT_WAIT_TIMEOUT_MS } from 'tests/end-to-end/common/timeouts';
declare let window: Window & {
    featureFlagsController;
    insightsUserConfiguration;
};

export class AppController {
    constructor(public app: ElectronApplication, public page: Page) {}

    public async stop(): Promise<void> {
        if (this.page) {
            await this.page.close();
        }
    }

    public async waitForTitle(expectedTitle: string): Promise<void> {
        const timeout = DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS;
        await this.page.waitForFunction(
            async () => {
                const title = await this.page.title();
                return title === expectedTitle;
            },
            null,
            {
                timeout,
                timeoutMsg: `was expecting window title to transition to ${expectedTitle} within ${timeout}ms`,
            },
        );
    }

    public async openDeviceConnectionDialog(): Promise<DeviceConnectionDialogController> {
        const deviceConnectionDialog = new DeviceConnectionDialogController(this.page);
        await deviceConnectionDialog.waitForDialogVisible();

        return deviceConnectionDialog;
    }

    public async openAndroidSetupView(
        step: AndroidSetupStepId,
    ): Promise<AndroidSetupViewController> {
        const androidSetupController = new AndroidSetupViewController(this.page);
        await androidSetupController.waitForDialogVisible(step);
        return androidSetupController;
    }

    public async openResultsView(): Promise<ResultsViewController> {
        const androidSetupViewController = await this.openAndroidSetupView(
            'prompt-connected-start-testing',
        );
        await androidSetupViewController.startTesting();

        return this.waitForResultsView();
    }

    public async waitForResultsView(): Promise<ResultsViewController> {
        const resultsView = new ResultsViewController(this.page);
        await resultsView.waitForViewVisible();

        return resultsView;
    }

    public async setHighContrastMode(enableHighContrast: boolean): Promise<void> {
        await this.waitForInitialization();

        await this.page.evaluate(
            `window.insightsUserConfiguration.setHighContrastMode(${enableHighContrast})`,
        );
    }

    public async waitForHighContrastMode(expectedHighContrastMode: boolean): Promise<void> {
        const highContrastThemeClass = 'high-contrast-theme';

        await this.page.waitForFunction(
            async () => {
                const classes = await this.page.getAttribute('body', 'class');
                return expectedHighContrastMode === classes.includes(highContrastThemeClass);
            },
            {
                timeout: DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS,
                timeoutMsg: `was expecting body element ${
                    expectedHighContrastMode ? 'with' : 'without'
                } class high-contrast-theme`,
            },
        );
    }

    public async waitForEnabled(selector: string): Promise<void> {
        await this.page.waitForFunction(
            async () => {
                return await this.page.isEnabled(selector);
            },
            {
                timeout: DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS,
                timeoutMsg: `was expecting ${selector} to be enabled within ${DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS}ms`,
            },
        );
    }

    public async setTelemetryState(enableTelemetry: boolean): Promise<void> {
        await this.waitForInitialization();

        await this.page.evaluate(
            `window.insightsUserConfiguration.setTelemetryState(${enableTelemetry})`,
        );
    }

    public async setFeatureFlag(flag: string, enabled: boolean): Promise<void> {
        await this.waitForFeatureFlags();

        const action = enabled ? 'enable' : 'disable';
        await this.page.evaluate(`window.featureFlagsController.${action}Feature('${flag}')`);
    }

    public async waitForInitialization(): Promise<void> {
        await this.page.waitForFunction(
            () => {
                const initialized = window.insightsUserConfiguration != null;
                return initialized;
            },
            null,
            { timeout: DEFAULT_PAGE_ELEMENT_WAIT_TIMEOUT_MS },
        );
    }

    public async waitForFeatureFlags(): Promise<void> {
        await this.page.waitForFunction(
            () => {
                const initialized = window.featureFlagsController != null;
                return initialized;
            },
            null,
            {
                timeout: DEFAULT_WAIT_FOR_ELEMENT_TO_BE_VISIBLE_TIMEOUT_MS,
            },
        );
    }
}
