// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { render } from '@testing-library/react';
import {
    InstanceDetailsGroup,
    InstanceDetailsGroupDeps,
    InstanceDetailsGroupProps,
} from 'common/components/cards/instance-details-group';
import { CardSelectionMessageCreator } from 'common/message-creators/card-selection-message-creator';
import { CardRuleResult } from 'common/types/store-data/card-view-model';
import * as React from 'react';

import { InstanceDetails } from '../../../../../../common/components/cards/instance-details';
import {
    expectMockedComponentPropsToMatchSnapshots,
    mockReactComponents,
} from '../../../../mock-helpers/mock-module-helpers';
import { exampleUnifiedRuleResult } from './sample-view-model-data';

jest.mock('../../../../../../common/components/cards/instance-details');
describe('InstanceDetailsGroup', () => {
    mockReactComponents([InstanceDetails]);
    it('renders', () => {
        const rule: CardRuleResult = exampleUnifiedRuleResult;
        const depsStub: InstanceDetailsGroupDeps = {} as InstanceDetailsGroupDeps;

        const props: InstanceDetailsGroupProps = {
            deps: depsStub,
            rule: rule,
            userConfigurationStoreData: null,
            targetAppInfo: { name: 'app' },
            cardSelectionMessageCreator: {} as CardSelectionMessageCreator,
        };

        const renderResult = render(<InstanceDetailsGroup {...props} />);
        expectMockedComponentPropsToMatchSnapshots([InstanceDetails]);
        expect(renderResult.asFragment()).toMatchSnapshot();
    });
});
