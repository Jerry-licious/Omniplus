import {CourseGradesList} from './course-grades-list';
import {fetchDocumentFrom} from '../../util/util';

export class LeaGradesOverview {
    courses: CourseGradesList[] = [];

    constructor(courseListPromise: Promise<CourseGradesList[]>) {
        courseListPromise.then((courseList) => this.courses.push(...courseList));
    }

    static loadFromGradesOverviewPage(page: Document) {
        // A list of courses and their average grades are stored in a table with the style class tableau-notes.
        // The names of the courses can be clicked on and provide links to each course's grades overview, which are
        // stored in anchor elements that belong to the third column of the table.
        return new LeaGradesOverview(Promise.all(Array.from(page.querySelectorAll('.tableau-notes td:nth-child(3) a'))
            // Extract the link to the class's page and load them.
            .map((anchor) => fetchDocumentFrom((<HTMLAnchorElement>anchor).href)))
            .then((pages) => pages.map((page) => CourseGradesList.loadFromCourseAssessmentsPage(page))))
    }
}