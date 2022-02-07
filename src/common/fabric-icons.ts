// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { initializeIcons } from '@fluentui/font-icons-mdl2';
import { registerIcons } from '@fluentui/style-utilities';

export function initializeFabricIcons(): void {
    initializeIcons(undefined, { disableWarnings: true });
    registerIcons({
        style: {
            MozOsxFontSmoothing: 'grayscale',
            WebkitFontSmoothing: 'antialiased',
            fontStyle: 'normal',
            fontWeight: 'normal',
            speak: 'none',
        },
        fontFace: {
            fontFamily: 'FabricMDL2Icons',
        },
        icons: {
            add: '\uE710',
            back: '\uE72B',
            calculatorAddition: '\uE948',
            cancel: '\uE711',
            cat: '\uED7F',
            cellPhone: '\uE8EA',
            checkBox: '\uE739',
            checkMark: '\uE73E',
            chevronDown: '\uE70D',
            chevronDownMed: '\uE972',
            chevronRight: '\uE76C',
            chevronRightMed: '\uE974',
            chevronUp: '\uE70E',
            chromeClose: '\uE8BB',
            chromeMinimize: '\uE921',
            circleRing: '\uEA3A',
            completedSolid: '\uEC61',
            copy: '\uE8C8',
            contactCard: '\uEEBD',
            delete: '\uE74D',
            devices3: '\uEA6C',
            diagnostic: '\uE9D9',
            edit: '\uE70F',
            export: '\uEDE1',
            FabricFolder: '\uF0A9',
            FabricOpenFolderHorizontal: '\uF0A8',
            feedback: '\uED15',
            fileHTML: '\uF2ED',
            gear: '\uE713',
            giftboxOpen: '\uF133',
            globalNavButton: '\uE700',
            hide2: '\uEF89',
            home: '\uE80F',
            incidentTriangle: '\uE814',
            info: '\uE946',
            keyboardClassic: '\uE765',
            ladybugSolid: '\uF44A',
            mail: '\uE715',
            medical: '\uEAD4',
            more: '\uE712',
            offlineStorage: '\uEC8C',
            play: '\uE768',
            refresh: '\uE72C',
            rocket: '\uF3B3',
            save: '\uE74E',
            scopeTemplate: '\uF2B0',
            search: '\uE721',
            send: '\uE724',
            skypeCheck: '\uEF80',
            statusCircleCheckMark: '\uF13E',
            statusErrorFull: '\uEB90',
            stop: '\uE71A',
            tag: '\uE8EC',
            testBeaker: '\uF3A5',
            testBeakerSolid: '\uF3A6',
            textDocument: '\uF029',
            undo: '\uE7A7',
            unknown: '\uE9CE',
            upArrow: '\uE74A',
            view: '\uE890',
        },
    });
}
