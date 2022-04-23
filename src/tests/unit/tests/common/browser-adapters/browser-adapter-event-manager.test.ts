// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { BrowserAdapterEventManager } from 'common/browser-adapters/browser-adapter-event-manager';
import { createDefaultPromiseFactory, PromiseFactory } from 'common/promises/promise-factory';
import { RecordingLogger } from 'tests/unit/common/recording-logger';
import { SimulatedBrowserEvent } from 'tests/unit/common/simulated-browser-event';
import { TimeSimulatingPromiseFactory } from 'tests/unit/common/time-simulating-promise-factory';

describe('BrowserAdapterEventManager', () => {
    let realPromiseFactory: PromiseFactory;
    let timeSimulatingPromiseFactory: TimeSimulatingPromiseFactory;
    let recordingLogger: RecordingLogger;
    let testEvent: SimulatedBrowserEvent<() => Promise<string>>;
    let testSubject: BrowserAdapterEventManager;

    beforeEach(() => {
        realPromiseFactory = createDefaultPromiseFactory();
        timeSimulatingPromiseFactory = new TimeSimulatingPromiseFactory();
        recordingLogger = new RecordingLogger();
        testEvent = new SimulatedBrowserEvent();
        testSubject = new BrowserAdapterEventManager(timeSimulatingPromiseFactory, recordingLogger);
    });

    it('delegates to pre-registered, Promise-based ApplicationListeners', async () => {
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');
        testSubject.registerEventToApplicationListener(
            'event-type',
            async () => 'app listener result',
        );

        await expect(testEvent.invoke()).resolves.toBe('app listener result');
        expect(recordingLogger.allMessages).toStrictEqual([]);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);
    });

    it('defers to a Promise-based ApplicationListener that registers after the event occurs', async () => {
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');

        const promiseReturnedToEvent = testEvent.invoke();
        testSubject.registerEventToApplicationListener(
            'event-type',
            async () => 'app listener result',
        );
        await expect(promiseReturnedToEvent).resolves.toBe('app listener result');

        expect(recordingLogger.allMessages).toStrictEqual([]);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);
    });

    it('continues deferring events past registration of unrelated event types', async () => {
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');

        const promiseReturnedToEvent = testEvent.invoke();

        testSubject.registerEventToApplicationListener(
            'unrelated-event-type',
            async () => 'unrelated app listener result',
        );

        expect(recordingLogger.allMessages).toStrictEqual([]);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);

        testSubject.registerEventToApplicationListener(
            'event-type',
            async () => 'app listener result',
        );
        await expect(promiseReturnedToEvent).resolves.toBe('app listener result');

        expect(recordingLogger.allMessages).toStrictEqual([]);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);
    });

    it('can track multiple outstanding deferrals', async () => {
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');

        const invokePromises = [testEvent.invoke(), testEvent.invoke(), testEvent.invoke()];

        let appListenerInvocations = 0;
        testSubject.registerEventToApplicationListener('event-type', async () => {
            return appListenerInvocations++;
        });

        await expect(Promise.all(invokePromises)).resolves.toStrictEqual([0, 1, 2]);
        expect(appListenerInvocations).toBe(3);
    });

    it('delegates to pre-registered, fire-and-forget ApplicationListeners with a 2 minute post-delay', async () => {
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');

        let appListenerFired = false;
        testSubject.registerEventToApplicationListener('event-type', () => {
            appListenerFired = true;
        });

        const promiseReturnedToEvent = testEvent.invoke();

        // The synchronous app listener should fire before we start delaying
        expect(appListenerFired).toBe(true);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);

        await expect(promiseReturnedToEvent).resolves.toBe(undefined);

        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(120000);
        expect(recordingLogger.allMessages).toStrictEqual([]);
    });

    it('delegates to post-registered, fire-and-forget ApplicationListeners with a 2 minute post-delay', async () => {
        // This test involves a 2 minute fire-and-forget delay and a 4-minute timeout racing each
        // other. This case is to test that the delay is present, so we make sure the delay wins
        // the race by forcing the timeout to take a nonzero amount of real time.
        timeSimulatingPromiseFactory.actualTimeoutMs = 1000;

        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');
        // event invoked before listener registered
        const promiseReturnedToEvent = testEvent.invoke();

        let appListenerFired = false;
        testSubject.registerEventToApplicationListener('event-type', () => {
            appListenerFired = true;
        });

        // The synchronous app listener should fire before we start delaying
        expect(appListenerFired).toBe(true);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);

        await expect(promiseReturnedToEvent).resolves.toBe(undefined);

        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(120000);
        expect(recordingLogger.allMessages).toStrictEqual([]);
    });

    it('delegates to post-registered, fire-and-forget ApplicationListeners with a 4 minute timeout', async () => {
        // This test involves a 2 minute fire-and-forget delay and a 4-minute timeout racing each
        // other. This case is to test that the timeout is present, so we make sure the timeout wins
        // the race by forcing the delay to take a nonzero amount of real time.
        timeSimulatingPromiseFactory.actualDelayMs = 1000;

        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');
        // event invoked before listener registered
        const promiseReturnedToEvent = testEvent.invoke();

        let appListenerFired = false;
        testSubject.registerEventToApplicationListener('event-type', () => {
            appListenerFired = true;
        });

        // The synchronous app listener should fire before we start delaying
        expect(appListenerFired).toBe(true);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);

        await expect(promiseReturnedToEvent).resolves.toBe(undefined);

        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(240000);
        expect(recordingLogger.errorMessages).toMatchInlineSnapshot(`
            Array [
              "Error while processing browser event-type event: {}",
            ]
        `);
    });

    it('times out after 4 minutes if no ApplicationListener registers in time', async () => {
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');

        // This shouldn't reject, despite timing out; if it does, the browser might tear down the
        // whole Service Worker with other work still in progress.
        await expect(testEvent.invoke()).resolves.toBe(undefined);

        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(240000);
        expect(recordingLogger.errorMessages).toMatchInlineSnapshot(`
            Array [
              "Error while processing browser event-type event: {}",
            ]
        `);

        let appListenerFired = false;
        testSubject.registerEventToApplicationListener('event-type', () => {
            appListenerFired = true;
        });

        expect(appListenerFired).toBe(false);
    });

    it('times out late-registered Promise-based ApplicationListeners after 4 minutes', async () => {
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');

        // Event invoked before app listener is registered
        const promiseReturnedToEvent = testEvent.invoke();

        const stalledAppListenerResponse = realPromiseFactory.externalResolutionPromise();
        testSubject.registerEventToApplicationListener(
            'event-type',
            () => stalledAppListenerResponse.promise,
        );
        await expect(promiseReturnedToEvent).resolves.toBe(undefined);

        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(240000);
        expect(recordingLogger.errorMessages).toMatchInlineSnapshot(`
            Array [
              "Error while processing browser event-type event: {}",
            ]
        `);

        stalledAppListenerResponse.resolveHook(null); // test cleanup, avoids Promise leak
    });

    it('times out pre-registered Promise-based ApplicationListeners after 4 minutes', async () => {
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');

        // App listener registered before event invoked
        const stalledAppListenerResponse = realPromiseFactory.externalResolutionPromise();
        testSubject.registerEventToApplicationListener(
            'event-type',
            () => stalledAppListenerResponse.promise,
        );

        // This shouldn't reject, despite timing out; if it does, the browser might tear down the
        // whole Service Worker with other work still in progress.
        await expect(testEvent.invoke()).resolves.toBe(undefined);

        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(240000);
        expect(recordingLogger.errorMessages).toMatchInlineSnapshot(`
            Array [
              "Error while processing browser event-type event: {}",
            ]
        `);

        stalledAppListenerResponse.resolveHook(null); // test cleanup, avoids Promise leak
    });

    it('logs an error and propogates sync value-returning ApplicationListeners', async () => {
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');
        testSubject.registerEventToApplicationListener('event-type', () => 'app listener result');

        await expect(testEvent.invoke()).resolves.toBe('app listener result');
        expect(recordingLogger.errorMessages).toMatchInlineSnapshot(`
            Array [
              "Unexpected sync ApplicationListener for event type event-type: ",
            ]
        `);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);
    });

    it('logs and eats an error for throwing ApplicationListeners', async () => {
        const appListenerError = new Error('from app listener');
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');
        testSubject.registerEventToApplicationListener('event-type', () => {
            throw appListenerError;
        });

        await expect(testEvent.invoke()).resolves.toBe(undefined);
        expect(recordingLogger.errorMessages).toMatchInlineSnapshot(`
            Array [
              "Error thrown from ApplicationListener for event type event-type: ",
              "Error while processing browser event-type event: {}",
            ]
        `);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);
    });

    it('logs and eats an error for Promise-based ApplicationListeners which reject', async () => {
        const appListenerError = new Error('from app listener');
        testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');
        testSubject.registerEventToApplicationListener('event-type', async () => {
            throw appListenerError;
        });

        await expect(testEvent.invoke()).resolves.toBe(undefined);
        expect(recordingLogger.errorMessages).toMatchInlineSnapshot(`
            Array [
              "Error while processing browser event-type event: {}",
            ]
        `);
        expect(timeSimulatingPromiseFactory.elapsedTime).toBe(0);
    });

    it('does not allow multiple registrations for the same event type', () => {
        testSubject.registerEventToApplicationListener('event-type', () => {});

        expect(() => {
            testSubject.registerEventToApplicationListener('event-type', () => {});
        }).toThrowErrorMatchingInlineSnapshot(`"Listener already registered for event-type"`);
    });

    describe('removeListener', () => {
        it('removes adapter listeners', () => {
            testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');
            expect(testEvent.hasListeners()).toBe(true);

            testSubject.removeListener(testEvent, 'event-type');
            expect(testEvent.hasListeners()).toBe(false);
        });

        it('removes app listeners', async () => {
            testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');
            testSubject.registerEventToApplicationListener(
                'event-type',
                async () => 'app listener result',
            );

            testSubject.removeListener(testEvent, 'event-type');

            testSubject.registerAdapterListenerForEvent(testEvent, 'event-type');
            await expect(testEvent.invoke()).resolves.not.toBe('app listener result');
        });
    });
});
