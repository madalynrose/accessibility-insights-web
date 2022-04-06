// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { WebExtensionBrowserAdapter } from 'common/browser-adapters/webextension-browser-adapter';
import { ExtensionTypes } from 'webextension-polyfill';

export class ServiceWorkerBrowserAdapter extends WebExtensionBrowserAdapter {
    public getManageExtensionUrl(): string {
        return `chrome://extensions/?id=${chrome.runtime.id}`;
    }

    public executeScriptInTab(
        tabId: number,
        details: ExtensionTypes.InjectDetails,
    ): Promise<any[]> {
        const injectionInfo = {
            target: { tabId, allFrames: details.allFrames },
            files: [details.file],
        };
        this.verifyPathCompatibility(details.file);
        return chrome.scripting.executeScript(injectionInfo);
    }

    public insertCSSInTab(tabId: number, details: ExtensionTypes.InjectDetails): Promise<void> {
        this.verifyPathCompatibility(details.file);
        const injectionInfo = {
            target: { tabId, allFrames: details.allFrames },
            files: [details.file],
        };
        return chrome.scripting.insertCSS(injectionInfo);
    }
}
