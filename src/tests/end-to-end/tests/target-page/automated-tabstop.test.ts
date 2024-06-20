// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { Browser } from '../../common/browser';
import { launchBrowser } from '../../common/browser-factory';
import { TabStopsTargetPage } from 'tests/end-to-end/common/page-controllers/tab-stops-target-page';
import { targetPageUrl } from 'tests/end-to-end/common/page-controllers/target-page';

describe('Automated keyboard tab stops', () => {
    let browser: Browser;
    let targetPage: TabStopsTargetPage;

    beforeEach(async () => {
        browser = await launchBrowser({
            suppressFirstTimeDialog: true,
            addExtraPermissionsToManifest: 'all-origins',
        });
        targetPage = await browser.newTabStopsTargetPage();
    });

    afterEach(async () => {
        await browser?.close();
    });

    it('keyboard out of order test', async () => {
        await targetPage.initializeTabStops();

        await targetPage.loopThroughTabs();
        const activeEl = targetPage.getActiveElement();
        expect(activeEl).not.toBeNull();
    });

    it('radio buttons test', async () => {
        await targetPage.goto(
            targetPageUrl({ testResourcePath: 'native-widgets/input-type-radio.html' }),
        );
        await targetPage.waitForSelector('input[type="radio"]');
        await targetPage.initializeTabStops();
        await targetPage.loopThroughTabs();
    });

    it('all  test', async () => {
        await targetPage.goto(targetPageUrl({ testResourcePath: 'all.html' }));
        await targetPage.waitForSelector('input[type="radio"]');
        await targetPage.initializeTabStops();
        await targetPage.loopThroughTabs();
    });

    it('accessibilityinsights.io  test', async () => {
        await targetPage.goto('https://www.accessibilityinsights.io');
        await targetPage.initializeTabStops();
        await targetPage.loopThroughTabs();
        const { tabbableElementPaths, visitedTabStopPaths } = targetPage.getTabStops();
        expect(tabbableElementPaths).toEqual(visitedTabStopPaths);
    });
});

// async function addTabStop() {
//     await targetPage.keyPress('Tab');
//     const newActiveElement = await targetPage.getActiveElementInFrame();
//     const suggIndex = await getTabOrderApproximationForElement(newActiveElement);
//     console.log('suggIndex: ', suggIndex);
//     if (activeElement != null) {
//         if (await hasSameBoundingBox(newActiveElement, activeElement)) {
//             // do some extra maneuvering
//             console.log('did not move');
//         }
//     }
//     activeElement = newActiveElement;
//     if (await boundingBoxEquals(activeElement, firstBoundingBox)) {
//         console.log('looped');
//         return false;
//     }
//     visitedTabStops.add(activeElement);
//     return true;
// }

// firstTabbedElement = activeElement;
// firstBoundingBox = await firstTabbedElement.boundingBox();
// if (visitedTabStops.size < 1) {
//     // weeeeird
//     console.log('tab no move');
// }
// while (true) {
//     const added = await addTabStop();
//     if (!added) {
//         console.log('not added, looped');
//         break;
//     }
//     if (visitedTabStops.size > 10) {
//         console.log('too many tab stops');
//         break;
//     }
// }
// console.log(visitedTabStops.size);
