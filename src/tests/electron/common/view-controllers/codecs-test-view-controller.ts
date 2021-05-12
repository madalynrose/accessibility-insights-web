// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { Page } from 'playwright';
import { ViewController } from './view-controller';

export class CodecTestViewController extends ViewController {
    constructor(page: Page) {
        super(page);
    }

    public async waitForAudioVisible(): Promise<void> {
        await this.waitForSelector('#audio');
    }
}
