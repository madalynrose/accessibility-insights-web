// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import axe from 'axe-core';
import * as AxeUtils from '../axe-utils';
import { RuleConfiguration } from '../iruleresults';

const accessibleNamesCheckId: string = 'display-accessible-names';

export const accessibleNamesConfiguration: RuleConfiguration = {
    checks: [
        {
            id: accessibleNamesCheckId,
            evaluate: evaluateAccessibleNames,
        },
    ],
    rule: {
        id: accessibleNamesCheckId,
        //this list of roles and elements was derived from the ARIA 1.2 documentation (Section 5.2.8.4: Roles supporting name from author or content): https://www.w3.org/TR/wai-aria-1.2/#namefromauthor
        selector:
            '[role=alert], [role=alertdialog], [role=application], [role=article], article, [role=banner], [role=blockquote], blockquote, [role=button], button, [role=cell], [role=checkbox], [role=columnheader], [role=combobox], [role=command], [role=complementary], [role=composite], [role=contentinfo], [role=definition], [role=dialog], [role=directory],[role=document], [role=feed], [role=figure], figure, [role=form], form,[role=grid], table, [role=gridcell], td, [role=group], fieldset, [role=heading], h1,h2, h3, h4, h5, h6, [role=img],img,[role=input], [role=landmark], [role=link], a, link, [role=list], ol, ul, [role=listbox], [role=listitem], li, [role=log], [role=main], [role=marquee],[role=math], [role=meter], meter, [role=menu], [role=menubar], [role=menuitem], [role=menuitemcheckbox], [role=menuitemradio], [role=navigation], nav, [role=note], [role=option], option, [role=progressbar], [role=radio], [role=radiogroup], [role=range], [role=region], section, [role=row], tr, [role=rowgroup], tbody, tfoot, thead, [role=rowheader], th[scope="row"], [role=scrollbar], [role=searchbox], [role=search], [role=select], select, [role=sectionhead], [role=separator], hr, [role=slider], [role=status], [role=spinbutton, [role=switch], [role=tab], [role=table], [role=tablelist], [role=tabpanel], [role=term], dfn, td, [role=textbox], textarea, th, [role=time], time, [role=timer], [role=toolbar], [role=tooltip], [role=tree], [role=treegrid], [role=treeitem], input,[role=input],[role=window]',
        enabled: false,
        any: [accessibleNamesCheckId],
        matches: hasAccessibleName,
    },
};

function hasAccessibleName(node: HTMLElement): boolean {
    // this list of roles and elements were derived from the ARIA 1.2 documentation (Section 5.2.8.6: Roles which cannot be named): https://www.w3.org/TR/wai-aria-1.2/#namefromprohibited
    const nameProhibitedSelectors: string =
        'caption, figcaption, [role=caption], code, [role=code], del, [role=deletion], em, [role=emphasis],[role=generic], ins, [role=insertion], p, [role=paragraph], [role=presentation], [role=strong], strong, sub, sup, [role=subscript], [role=superscript], [role=none]';
    if (axe.utils.matchesSelector(node, nameProhibitedSelectors)) {
        return false;
    }
    if (AxeUtils.getAccessibleText(node) === '') {
        return false;
    }
    return true;
}

function evaluateAccessibleNames(node: HTMLElement): boolean {
    const accessibleName = AxeUtils.getAccessibleText(node);
    this.data({ accessibleName });
    return true;
}
