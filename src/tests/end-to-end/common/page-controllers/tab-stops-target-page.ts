// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as Playwright from 'playwright';
import { PageOptions } from './page';
import { TargetPage, targetPageUrl } from './target-page';
import { hasSameBoundingBox } from 'tests/end-to-end/common/page-element-utils';
import { isEqual } from 'lodash';
import { DictionaryStringTo } from 'types/common-types';

// tab, down arrow, right arrow
const nextKey = {
    Tab: 'ArrowDown',
    ArrowDown: 'ArrowRight',
    ArrowRight: 'Tab',
};
export class TabStopsTargetPage extends TargetPage {
    private tabbableHandles: Playwright.ElementHandle<Node>[];
    private tabbableElementPaths: string[];
    private visitedTabStopPaths: string[];
    private visitedTabStops: Playwright.ElementHandle<Element>[];
    private activeElement: Playwright.ElementHandle<Element>;
    private activeElementPath: string;
    private firstTabbedElement: Playwright.ElementHandle<Element>;
    private firstTabbedElementPath: string;
    private firstBoundingBox: any = null;
    private currentNavKey: string = 'Tab';

    public static url = targetPageUrl({
        testResourcePath: 'tab-stops/out-of-order.html',
    });

    public constructor(underlyingPage: Playwright.Page, tabId: number, options?: PageOptions) {
        super(underlyingPage, tabId, options);
    }

    public initializeTabStops = async () => {
        this.visitedTabStops = [];
        this.visitedTabStopPaths = [];
        this.firstTabbedElement = null;
        this.firstTabbedElementPath = undefined;
        this.firstBoundingBox = null;
        await this.getTabbableElements();
        this.activeElement = await this.getActiveElementInFrame();
        this.activeElementPath = await this.getElementXpath(this.activeElement);
    };

    public getActiveElement(): Playwright.ElementHandle {
        return this.activeElement;
    }

    public async getTabbableElements(): Promise<void> {
        let tabbableLocators = this.underlyingPage
            .locator(
                'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [role="button"]:not(:disabled), [role="input"]:not(:disabled), [role="select"]:not(:disabled), [role="link"][href]',
            )
            .locator('visible=true');
        this.tabbableHandles = await tabbableLocators.elementHandles();
        this.tabbableElementPaths = await Promise.all(
            this.tabbableHandles.map(async handle => await this.getElementXpath(handle)),
        );
        console.log('tabbable paths: ', this.tabbableElementPaths);
    }

    // public async tryNavigatingWithArrows(): Promise<boolean> {
    //     await this.keyPress('ArrowDown');
    //     const { newActiveElementPath } = await this.getNewActiveElement();
    //     try {
    //         this.validateNewActiveElement(newActiveElementPath);
    //         return true;
    //     } catch (e) {
    //         console.log(e);
    //         return false;
    //     }
    // }

    public async refocusTabStop(): Promise<void> {
        await this.activeElement.focus();
    }

    public async getNewActiveElement() {
        const newActiveElement = await this.getActiveElementInFrame();
        const newActiveElementPath = await this.getElementXpath(newActiveElement);
        return { newActiveElement, newActiveElementPath };
    }

    public async validateNewActiveElement(newActiveElementPath: string): Promise<boolean> {
        if (!this.tabbableElementPaths.includes(newActiveElementPath)) {
            throw new Error('not a tabbable element');
        }
        const suggIndex = await this.getTabOrderApproximationForElement(newActiveElementPath);
        if (suggIndex > this.visitedTabStopPaths.length) {
            console.log('suggIndex: ', suggIndex, this.visitedTabStopPaths.length);
            throw new Error('tabbed out of order');
        }
        if (newActiveElementPath === this.activeElementPath) {
            throw new Error('did not move');
        }
        if (this.visitedTabStopPaths.includes(newActiveElementPath)) {
            throw new Error('already visited');
        }
        return true;
    }

    public async navigateWithKeyboard(): Promise<boolean> {
        return await this.navigateWithKey(this.currentNavKey);
    }

    public async navigateWithKey(key: string): Promise<boolean> {
        await this.keyPress(key);
        const { newActiveElement, newActiveElementPath } = await this.getNewActiveElement();
        try {
            await this.validateNewActiveElement(newActiveElementPath);
        } catch (e) {
            throw e;
        }
        this.activeElementPath = newActiveElementPath;
        this.activeElement = newActiveElement;
        if (!this.firstTabbedElementPath) {
            this.firstTabbedElementPath = this.activeElementPath;
            this.firstTabbedElement = this.activeElement;
        }
        this.visitedTabStopPaths.push(this.activeElementPath);
        this.visitedTabStops.push(this.activeElement);
        return true;
    }

    public async addTabStop(): Promise<boolean> {
        try {
            return await this.navigateWithKeyboard();
        } catch (e) {
            switch (e.message) {
                case 'not a tabbable element':
                case 'tabbed out of order':
                    await this.refocusTabStop();
                    this.currentNavKey = nextKey[this.currentNavKey];
                    return true;
                case 'already visited':
                    if (this.visitedTabStopPaths.length < this.tabbableElementPaths.length - 1) {
                        await this.refocusTabStop();
                        this.currentNavKey = nextKey[this.currentNavKey];
                        return true;
                    }
                    throw e;
                default:
                    console.log('error: ', e.message);
            }
            return false;
        }
    }

    public async loopThroughTabs() {
        let success = true;
        while (success) {
            try {
                success = await this.addTabStop();
                if (
                    this.visitedTabStops.length > 1 &&
                    isEqual(this.activeElementPath, this.firstTabbedElementPath)
                ) {
                    console.log('looped is first el');
                    success = false;
                }
            } catch (e) {
                console.log('looped! el already present', e);
                success = false;
            }
        }
        console.log(this.visitedTabStopPaths);
    }

    public getTabStops(): DictionaryStringTo<string[]> {
        return {
            tabbableElementPaths: this.tabbableElementPaths,
            visitedTabStopPaths: this.visitedTabStopPaths,
        };
    }

    public async isSameElement(element1: string, element2: string) {
        return element1 === element2;
    }

    public async getElementXpath(element: Playwright.JSHandle): Promise<string> {
        return await element.evaluate(node => {
            const getPathTo = (element: HTMLElement): string => {
                if (element.id !== '') return 'id("' + element.id + '")';
                if (element === document.body) return element.tagName;

                var ix = 0;
                var siblings = element.parentElement.children;
                for (var i = 0; i < siblings.length; i++) {
                    var sibling = siblings[i];
                    if (sibling === element)
                        return (
                            getPathTo(element.parentElement) +
                            '/' +
                            element.tagName +
                            '[' +
                            (ix + 1) +
                            ']'
                        );
                    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
                }
            };
            return `//${getPathTo(node)}`;
        });
    }

    public async getTabOrderApproximationForElement(element: string): Promise<number> {
        return this.tabbableElementPaths.findIndex(path => path === element);
    }
}
