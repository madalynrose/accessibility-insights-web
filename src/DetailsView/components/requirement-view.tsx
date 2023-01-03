// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AssessmentDefaultMessageGenerator } from 'assessments/assessment-default-message-generator';
import { AssessmentsProvider } from 'assessments/types/assessments-provider';
import { Assessment } from 'assessments/types/iassessment';
import { Requirement, VisualHelperToggleConfig } from 'assessments/types/requirement';
import {
    AssessmentData,
    AssessmentNavState,
    PersistedTabInfo,
} from 'common/types/store-data/assessment-result-data';
import { FeatureFlagStoreData } from 'common/types/store-data/feature-flag-store-data';
import { Tab } from 'common/types/store-data/itab';
import { PathSnippetStoreData } from 'common/types/store-data/path-snippet-store-data';
import {
    AssessmentViewUpdateHandler,
    AssessmentViewUpdateHandlerDeps,
    AssessmentViewUpdateHandlerProps,
} from 'DetailsView/components/assessment-view-update-handler';
import { RequirementTableSection } from 'DetailsView/components/left-nav/requirement-table-section';
import { NextRequirementButton } from 'DetailsView/components/next-requirement-button';
import { RequirementInstructions } from 'DetailsView/components/requirement-instructions';
import {
    RequirementViewTitle,
    RequirementViewTitleDeps,
} from 'DetailsView/components/requirement-view-title';
import { AssessmentInstanceTableHandler } from 'DetailsView/handlers/assessment-instance-table-handler';
import * as React from 'react';
import styles from './requirement-view.scss';
import {
    RequirementContextSection,
    RequirementContextSectionDeps,
} from 'DetailsView/components/requirement-context-section';
import { VisualizationType } from 'common/types/visualization-type';

export type RequirementViewDeps = {
    assessmentViewUpdateHandler: AssessmentViewUpdateHandler;
    getProvider: () => AssessmentsProvider;
    assessmentDefaultMessageGenerator: AssessmentDefaultMessageGenerator;
    mediumPassRequirementKeys: string[];
} & RequirementViewTitleDeps &
    RequirementContextSectionDeps &
    AssessmentViewUpdateHandlerDeps;

export interface RequirementViewProps {
    deps: RequirementViewDeps;
    assessmentNavState: AssessmentNavState;
    isRequirementEnabled: boolean;
    assessmentInstanceTableHandler: AssessmentInstanceTableHandler;
    featureFlagStoreData: FeatureFlagStoreData;
    pathSnippetStoreData: PathSnippetStoreData;
    scanningInProgress: boolean;
    assessmentData: AssessmentData;
    currentTarget: Tab;
    prevTarget: PersistedTabInfo;
    shouldShowRequirementContextBox: boolean;
}

export class RequirementView extends React.Component<RequirementViewProps> {
    public componentDidMount(): void {
        this.props.deps.assessmentViewUpdateHandler.onMount(this.getUpdateHandlerProps(this.props));
    }

    public componentDidUpdate(prevProps: RequirementViewProps): void {
        this.props.deps.assessmentViewUpdateHandler.update(
            this.getUpdateHandlerProps(prevProps),
            this.getUpdateHandlerProps(this.props),
        );
    }

    public componentWillUnmount(): void {
        this.props.deps.assessmentViewUpdateHandler.onUnmount(
            this.getUpdateHandlerProps(this.props),
        );
    }

    private getUpdateHandlerProps(props: RequirementViewProps): AssessmentViewUpdateHandlerProps {
        return {
            deps: props.deps,
            selectedRequirementIsEnabled: props.isRequirementEnabled,
            assessmentNavState: props.assessmentNavState,
            assessmentData: props.assessmentData,
            prevTarget: props.prevTarget,
            currentTarget: props.currentTarget,
        };
    }

    private renderTitle(requirement: Requirement): JSX.Element {
        return (
            <RequirementViewTitle
                deps={this.props.deps}
                name={requirement.name}
                guidanceLinks={requirement.guidanceLinks}
                infoAndExamples={requirement.infoAndExamples}
                shouldHideInfoButton={this.props.shouldShowRequirementContextBox}
            />
        );
    }

    private renderVisualHelperToggle(
        requirement: Requirement,
        requirementHasVisualHelper: boolean,
        isRequirementScanned: boolean,
    ): JSX.Element {
        const visualHelperToggleConfig: VisualHelperToggleConfig = {
            deps: this.props.deps,
            assessmentNavState: this.props.assessmentNavState,
            instancesMap: this.props.assessmentData.generatedAssessmentInstancesMap,
            isStepEnabled: this.props.isRequirementEnabled,
            isStepScanned: isRequirementScanned,
        };

        const visualHelperToggle = requirementHasVisualHelper
            ? requirement.getVisualHelperToggle(visualHelperToggleConfig)
            : null;
        return visualHelperToggle;
    }

    private renderRequirementContent(requirement: Requirement): JSX.Element {
        const requirementHasVisualHelper = !!requirement.getVisualHelperToggle;
        const isRequirementScanned =
            this.props.assessmentData.testStepStatus[requirement.key].isStepScanned;
        return (
            <>
                {requirement.description}
                {this.renderVisualHelperToggle(
                    requirement,
                    requirementHasVisualHelper,
                    isRequirementScanned,
                )}
                <RequirementInstructions howToTest={requirement.howToTest} />
                <RequirementTableSection
                    requirement={requirement}
                    assessmentNavState={this.props.assessmentNavState}
                    instancesMap={this.props.assessmentData.generatedAssessmentInstancesMap}
                    manualRequirementResultMap={this.props.assessmentData.manualTestStepResultMap}
                    assessmentInstanceTableHandler={this.props.assessmentInstanceTableHandler}
                    assessmentsProvider={this.props.deps.getProvider()}
                    featureFlagStoreData={this.props.featureFlagStoreData}
                    pathSnippetStoreData={this.props.pathSnippetStoreData}
                    scanningInProgress={this.props.scanningInProgress}
                    selectedRequirementHasVisualHelper={requirementHasVisualHelper}
                    isRequirementScanned={isRequirementScanned}
                    assessmentDefaultMessageGenerator={
                        this.props.deps.assessmentDefaultMessageGenerator
                    }
                />
            </>
        );
    }

    private renderNextRequirementButton(
        requirement: Requirement,
        assessment: Assessment,
    ): JSX.Element {
        const { mediumPassRequirementKeys, getProvider } = this.props.deps;
        let nextRequirement: Requirement;
        let currentTest: VisualizationType;
        if (this.props.shouldShowRequirementContextBox) {
            const requirementIndex = mediumPassRequirementKeys.findIndex(
                r => r === requirement.key,
            );
            if (requirementIndex === mediumPassRequirementKeys.length) {
                //TODO: special go to assessment button
                return null;
            }
            const nextRequirementKey = mediumPassRequirementKeys[requirementIndex + 1];
            const nextAssessment = getProvider().forRequirementKey(nextRequirementKey);
            nextRequirement = nextAssessment.requirements.find(r => r.key === nextRequirementKey);
            currentTest = nextAssessment.visualizationType;
        } else {
            const requirementIndex = assessment.requirements.findIndex(
                r => r.key === requirement.key,
            );
            nextRequirement = assessment.requirements[requirementIndex + 1] ?? null;
            currentTest = this.props.assessmentNavState.selectedTestType;
        }

        return (
            <div className={styles.nextRequirementButtonContainer}>
                <NextRequirementButton
                    deps={this.props.deps}
                    nextRequirement={nextRequirement}
                    currentTest={currentTest}
                    className={styles.nextRequirementButton}
                />
            </div>
        );
    }

    private renderRequirementContextBox(
        requirement: Requirement,
        assessment: Assessment,
    ): JSX.Element {
        return (
            <div className={styles.requirementContextBox}>
                <RequirementContextSection
                    whyItMattersText={assessment.gettingStarted}
                    requirement={requirement}
                    linkDataSource={requirement.guidanceLinks}
                    guidance={assessment.guidance}
                    guidanceName={assessment.title}
                    deps={this.props.deps}
                />
            </div>
        );
    }

    public render(): JSX.Element {
        const { deps } = this.props;
        const assessment: Readonly<Assessment> = deps
            .getProvider()
            .forType(this.props.assessmentNavState.selectedTestType);
        const requirement: Readonly<Requirement> = deps
            .getProvider()
            .getStep(
                this.props.assessmentNavState.selectedTestType,
                this.props.assessmentNavState.selectedTestSubview,
            );

        return (
            <div className={styles.requirementView}>
                <div>
                    {this.renderTitle(requirement)}
                    <div className={styles.mainContent}>
                        <div className={styles.requirementDescription}>
                            {this.renderRequirementContent(requirement)}
                        </div>
                        {this.props.shouldShowRequirementContextBox && (
                            <div className={styles.requirementContext}>
                                {this.props.shouldShowRequirementContextBox &&
                                    this.renderRequirementContextBox(requirement, assessment)}
                                {this.renderNextRequirementButton(requirement, assessment)}
                            </div>
                        )}
                    </div>
                    {!this.props.shouldShowRequirementContextBox &&
                        this.renderNextRequirementButton(requirement, assessment)}
                </div>
            </div>
        );
    }
}
