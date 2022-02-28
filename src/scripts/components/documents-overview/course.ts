import {LeaDocument} from './document';
import {fetchDocumentFrom, toTitleCase} from '../../util';
import {ElementBuilder} from '../dom-builder';
import {Renderable} from '../renderable';
import {OverviewRenderInfo} from './render-info';

const spaceRegex = new RegExp('\\s');

// Represents a course in Lea.
export class LeaCourse extends Renderable<OverviewRenderInfo> {
    name: string;
    courseCode: string;
    documents: LeaDocument[];

    constructor(name: string, courseCode: string, documents: LeaDocument[] = []) {
        super('div', 'course');

        this.name = name;
        this.courseCode = courseCode;
        this.documents = documents;

        this.sortDocuments();
    }

    // Load a course from its *components* page.
    static fromDocumentPage(page: Document): LeaCourse {
        // The course code and course name are placed inside the second line of title on the top of the course
        // components page.
        const courseTitle = (<HTMLElement>page.querySelector('.TitrePageLigne2')).innerText;
        // The course title has the following format:
        // <Course Code> <Course Name> section <section number>
        // To extract the course code and the name, split the title by 'section', pick the first part and then trim
        // off the extra space on the right.
        // Pre-split the course code and names, note that Omnivox sometimes uses non-breaking space instead of
        // regular space, hence the use of the \s regex.
        const courseCodeAndName = courseTitle.split('section')[0].trim().split(spaceRegex);
        // The course code and name are separated by a space, the first element is the course code.
        const courseCode = courseCodeAndName[0];
        // Since course names may contain spaces, the rest of the elements make up the course.
        // Convert the whole thing from all caps to title case.
        const courseName = toTitleCase(courseCodeAndName.slice(1).join(' ')
            // The course name itself is structured as follows:
            // [Program] [-] <Course Name>
            // The program and the dash may not exist, but as an unfortunate Arts and Science student, it bothers me
            // that it blocks the course name.
            // Split the course name by '-', pick the last part and trim off the extra space on the left.
            .split('-')
            // Meaning to pick the last element here but since there's no implementation of it this will suffice.
            .reverse()[0].trim());

        // Extract the documents.
        const documents = LeaDocument.loadFromCourseDocumentPage(page);

        return new LeaCourse(courseName, courseCode, documents);
    }

    // Extracts a course and its documents from a url to a course components page.
    static loadFromCourseDocumentsURL(url: string): Promise<LeaCourse> {
        return fetchDocumentFrom(url).then((parsedDocument) => LeaCourse.fromDocumentPage(parsedDocument));
    }

    // Sorts the documents based on their read-status and their upload date.
    sortDocuments() {
        this.documents.sort((a, b) => {
            // Note that the comparison is in reverse because we want to display later documents (with greater time
            // value) first.
            // If the two have the same read status, compare the date.
            if (a.read == b.read) {
                return b.uploadDate.valueOf() - a.uploadDate.valueOf();
            }
            // Otherwise compare the read status.
            else {
                return (b.read ? 0 : 1) - (a.read ? 0 : 1);
            }
        });
    }

    updateDomElement(renderInfo: OverviewRenderInfo) {
        this.domElement.append(
            new ElementBuilder('div')
                .withStyleClasses('course-name')
                .withText(this.name)
                .build(),
            new ElementBuilder('div')
                .withStyleClasses('documents-list')
                // Filter the documents to show only ones that match.
                .withChildren(...this.documents.filter((leaDocument) => leaDocument.nameContains(renderInfo.search))
                    .map((leaDocument) => leaDocument.render(renderInfo)))
                .build()
        );
    }

    // Returns true if the course has any documents with a name that includes the search term.
    hasDocumentMatch(search: string): boolean {
        return this.documents.some((leaDocument) => leaDocument.nameContains(search));
    }

    markAllDocumentsAsRead(): void {
        this.documents.forEach((leaDocument) => leaDocument.markAsRead());
    }
}