// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class AlarmAdapter {
    private alarmCallbacks = {};
    constructor() {
        chrome.alarms.onAlarm.addListener(this.handleAlarm);
    }
    public registerAlarmCallback(alarmName: string, callback: Function): void {
        this.alarmCallbacks[alarmName] = callback;
    }

    public handleAlarm = (alarm: chrome.alarms.Alarm): void => {
        if (this.alarmExists(alarm.name)) {
            this.alarmCallbacks[alarm.name]();
            delete this.alarmCallbacks[alarm.name];
            this.clearAlarm(alarm.name);
        }
    };

    public alarmExists(alarmName: string): boolean {
        const alarm = this.alarmCallbacks[alarmName];
        return alarm !== undefined;
    }

    public clearAlarm(name: string): void {
        chrome.alarms.clear(name);
    }

    public createAlarm(name: string, delayInMs: number) {
        chrome.alarms.create(name, { when: Date.now() + delayInMs });
    }

    public createAlarmWithCallback(name: string, delayInMs: number, callback: Function) {
        this.registerAlarmCallback(name, callback);
        this.createAlarm(name, delayInMs);
    }
}
