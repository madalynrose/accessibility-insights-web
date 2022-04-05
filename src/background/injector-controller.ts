// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AlarmAdapter } from 'background/alarm-utils';
import { InspectMode } from 'background/inspect-modes';
import { Logger } from 'common/logging/logger';
import { Messages } from '../common/messages';
import { ContentScriptInjector } from './injector/content-script-injector';
import { Interpreter } from './interpreter';
import { InspectStore } from './stores/inspect-store';
import { TabStore } from './stores/tab-store';
import { VisualizationStore } from './stores/visualization-store';

export class InjectorController {
    private static readonly injectionStartedWaitTime = 10;

    private oldInspectType = InspectMode.off;

    constructor(
        private readonly injector: ContentScriptInjector,
        private readonly visualizationStore: VisualizationStore,
        private readonly interpreter: Interpreter,
        private readonly tabStore: TabStore,
        private readonly inspectStore: InspectStore,
        private readonly alarmUtils: AlarmAdapter,
        private readonly logger: Logger,
    ) {}

    public initialize(): void {
        this.visualizationStore.addChangedListener(this.inject);
        this.inspectStore.addChangedListener(this.inject);
    }

    private inject = (): void => {
        const tabId: number = this.tabStore.getState().id;
        const inspectStoreState = this.inspectStore.getState();
        const visualizationStoreState = this.visualizationStore.getState();

        const inspectStoreInjectingRequested =
            this.oldInspectType !== inspectStoreState.inspectMode &&
            inspectStoreState.inspectMode !== InspectMode.off;

        const isInjectingRequested =
            inspectStoreInjectingRequested || visualizationStoreState.injectingRequested;

        if (isInjectingRequested && !visualizationStoreState.injectingStarted) {
            this.alarmUtils.createAlarmWithCallback(
                `injection-started-message-alarm-${tabId}`,
                InjectorController.injectionStartedWaitTime,
                () => {
                    this.interpreter.interpret({
                        messageType: Messages.Visualizations.State.InjectionStarted,
                        tabId: tabId,
                    });
                },
            );

            this.injector
                .injectScripts(tabId)
                .then(() => {
                    this.interpreter.interpret({
                        messageType: Messages.Visualizations.State.InjectionCompleted,
                        tabId: tabId,
                    });
                })
                .catch(this.logger.error);
        }

        this.oldInspectType = inspectStoreState.inspectMode;
    };
}
