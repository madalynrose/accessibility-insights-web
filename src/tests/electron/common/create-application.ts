// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { _electron as electron } from 'playwright';
//import { retry } from 'tests/common/retry';
//import { DEFAULT_CHROMEDRIVER_START_RETRIES } from 'tests/electron/setup/timeouts';

import { AppController } from './view-controllers/app-controller';

export async function createApplication(options?: any): Promise<AppController> {
    const targetApp = `${
        (global as any).rootDir
    }/drop/electron/unified-dev/product/bundle/main.bundle.js`;

    const unifiedOptions = {
        env: {
            ANDROID_HOME: `${(global as any).rootDir}/drop/mock-adb`,
        },
        ...options,
    };

    const appController = await createAppController(targetApp, unifiedOptions);

    if (options?.suppressFirstTimeDialog === true) {
        await appController.setTelemetryState(false);
    }

    return appController;
}

export async function createAppController(
    targetApp: string,
    options?: any,
): Promise<AppController> {
    const app = await electron.launch({
        args: [targetApp],
        env: options.env,
    });

    const page = await app.firstWindow();

    return new AppController(app, page);
}
