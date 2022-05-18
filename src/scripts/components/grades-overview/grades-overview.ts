import {CourseGradesList} from './course-grades-list';
import {fetchDocumentFrom} from '../../util/util';
import {removePrinterFriendlyButton} from '../page-patcher';
import {Renderable} from '../rendering/renderable';
import {ElementBuilder} from '../rendering/element-builder';

export class LeaGradesOverview extends Renderable<null> {
    courses: CourseGradesList[] = [];
    loading = true;

    constructor(courseListPromise: Promise<CourseGradesList[]>) {
        super('div', 'omniplus-lea-container', 'omniplus-grades-overview');

        courseListPromise.then((courseList) => {
            this.courses.push(...courseList);
            this.loading = false;

            this.rerender();
        });
    }

    static loadFromGradesOverviewPage(page: Document) {
        // A list of courses and their average grades are stored in a table with the style class tableau-notes.
        // The names of the courses can be clicked on and provide links to each course's grades overview, which are
        // stored in anchor elements that belong to the third column of the table.
        return new LeaGradesOverview(Promise.all(Array.from(page.querySelectorAll('.tableau-notes td:nth-child(3) a'))
            // Extract the link to the class's page and load them.
            .map((anchor) => fetchDocumentFrom((<HTMLAnchorElement>anchor).href)))
            .then((pages) => pages.map((page) => CourseGradesList.loadFromCourseAssessmentsPage(page))));
    }

    injectToGradesOverviewPage() {
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

    updateDomElement(): void {
        if (this.loading) {
            // Render the loading spinner while loading.
            this.domElement.append(
                new ElementBuilder({
                    tag: 'div', styleClasses: ['loading'],
                    children: [
                        new ElementBuilder({
                            tag: 'div', styleClasses: ['loading-spinner']
                        }).build()
                    ]
                }).build()
            );
        } else {
            // Render the cards after it's done.
            this.courses.forEach((course) => this.domElement.appendChild(course.render()));
        }
    }
}