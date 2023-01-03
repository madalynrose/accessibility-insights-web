// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { NamedFC } from 'common/react/named-fc';
import { HyperlinkDefinition } from 'common/types/hyperlink-definition';
import * as React from 'react';
import { HelpLinks, HelpLinksDeps } from './overview-content/help-links';
import styles from './requirement-context-section.scss';
import { ContentPanelButton, ContentPanelButtonDeps } from 'views/content/content-panel-button';
import { Requirement } from 'assessments/types/requirement';
import { ContentReference } from 'views/content/content-page';
import { ContentLink } from 'views/content/content-link';

export type RequirementContextSectionDeps = HelpLinksDeps & ContentPanelButtonDeps;

export interface RequirementContextSectionProps {
    deps: RequirementContextSectionDeps;
    requirement: Requirement;
    linkDataSource: HyperlinkDefinition[];
    guidance: ContentReference;
    guidanceName: string;
    whyItMattersText: JSX.Element;
}

export const RequirementContextSection = NamedFC(
    'RequirementContextSection',
    (props: RequirementContextSectionProps) => {
        return (
            <section className={styles.requirementContextContainer}>
                <h3 className={styles.contextHeading}>Why it matters</h3>
                {props.whyItMattersText}
                <h3 className={styles.contextHeading}>Helpful resources</h3>
                <ContentLink
                    deps={props.deps}
                    reference={props.guidance}
                    linkText={`Learn more about ${props.guidanceName}`}
                    hideTooltip={true}
                    className={styles.infoAndExamplesButton}
                />
                <ContentPanelButton
                    deps={props.deps}
                    reference={props.requirement.infoAndExamples}
                    contentTitle="Info and examples"
                    className={styles.infoAndExamplesButton}
                >
                    Info and examples
                </ContentPanelButton>
                <HelpLinks linkInformation={props.linkDataSource} deps={props.deps} />
            </section>
        );
    },
);
