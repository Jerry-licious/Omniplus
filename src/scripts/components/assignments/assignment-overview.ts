// Renders the overview page for assignments.
import {Assignment} from './assignment';
import {fetchDocumentFrom} from '../../util/util';
import {Renderable} from '../rendering/renderable';
import {ElementBuilder} from '../rendering/element-builder';
import {removePrinterFriendlyButton} from '../page-patcher';
import {AssignmentStatus} from './assignment-status';

export class LeaAssignmentOverview extends Renderable<null> {
    assignments: Assignment[] = [];
    loading: boolean = true;

    constructor(assignmentsPromise: Promise<Assignment[]>) {
        super('div', 'omniplus-lea-container', 'omniplus-assignments-overview');

        assignmentsPromise.then((assignments) => {
            this.loading = false;

            this.assignments.push(...assignments);

            this.rerender();
        });
    }

    static loadAllAssignmentsFromAssignmentsSummaryPage(page: Document): LeaAssignmentOverview {
        // All the anchors in the page have the style class .RemTrav_Sommaire_NomCours and are inside a table with
        // the class .cvirContenuCVIR.
        // However, sometimes when an instruction has not been read, an anchor with the same class that contains an
        // image is also shown on the rightmost column, despite the fact that the style class obviously suggests
        // that it should only include items that display the name of the course (no, a hovered tooltip does not count).
        // To ensure that only one of each course gets selected, find the td elements that are the first children
        // and then extract their anchor children.
        return new LeaAssignmentOverview(Promise.all(Array.from(page.querySelectorAll('.cvirContenuCVIR td:first-child'))
            .map((td) => <HTMLAnchorElement>td.querySelector('a.RemTrav_Sommaire_NomCours'))
            // Not all first child tds have anchor children, filter off the nulls.
            .filter((anchor) => anchor != null)
            .map((anchor) => anchor.href)
            .map((assignmentListURL) => fetchDocumentFrom(assignmentListURL)
                .then((assignmentList) => Assignment.loadAllAssignmentsFromCourseAssignmentsList(assignmentList))))
            .then((assignments) => assignments.reduce((flat, toFlatten) => flat.concat(toFlatten), [])));
    }

    // Builds a section with the specified name, only showing assignments that have the specified status.
    buildSection(sectionName: string, sectionType: AssignmentStatus): Element {
        return new ElementBuilder({
            tag: 'div',
            styleClasses: ['assignment-section'],
            children: [
                new ElementBuilder({
                    tag: 'div',
                    styleClasses: ['title'],
                    text: sectionName
                }).build(),
                new ElementBuilder({
                    tag: 'div',
                    styleClasses: ['content'],
                    children: this.assignments.filter((assignment) => assignment.status == sectionType)
                        // Latest-due assignments show up first.
                        .sort((a, b) => b.effectiveDueTime.valueOf() - a.effectiveDueTime.valueOf())
                        .map((assignment) => assignment.render())
                }).build()
            ]
        }).build();
    }

    updateDomElement() {
        if (this.loading) {
            // While the container is loading, insert the loading element.
            this.domElement.appendChild(new ElementBuilder({
                tag: 'div',
                styleClasses: ['loading'],
                children: [
                    new ElementBuilder({
                        tag: 'div',
                        styleClasses: ['loading-spinner']
                    }).build()
                ]
            }).build());
        } else {
            this.domElement.append(
                // Assigned section
                this.buildSection('Assigned', AssignmentStatus.Assigned),
                // Corrected section
                // Show the corrected section before the completed section instead of using a regular kanban
                // task flow because students would rarely be interacting with assignments that have been submitted
                // but not corrected.
                this.buildSection('Corrected', AssignmentStatus.Corrected),
                // Completed section
                this.buildSection('Completed', AssignmentStatus.Submitted)
            );
        }
    }

    // Injects the container into the document overview page.
    injectToAssignmentsOverviewPage() {
        // The printer friendly version button blocks the view, not sure why it's there, why it exists, or what's
        // the purpose of printing out an overview like that.
        removePrinterFriendlyButton();

        // Fetch the original container of the overview table.
        const overviewContainer = document.querySelector('.cvirContenuCVIR');

        // Get rid of the centre align.
        overviewContainer.removeAttribute('align');

        // Clear everything off.
        while (overviewContainer.hasChildNodes()) {
            overviewContainer.removeChild(overviewContainer.firstChild);
        }

        overviewContainer.appendChild(this.domElement);
    }
}