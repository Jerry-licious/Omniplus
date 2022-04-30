import {LeaDocument} from './document';
import {fetchDocumentFrom, extractCourseCodeAndNameFromCourseTitle} from '../../util';
import {ElementBuilder} from '../rendering/element-builder';
import {Renderable} from '../rendering/renderable';
import {OverviewRenderInfo} from './render-info';

// Represents a course rendered on the documents overview..
export class CourseDocumentList extends Renderable<OverviewRenderInfo> {
    courseName: string;
    courseCode: string;
    documents: LeaDocument[];

    constructor(name: string, courseCode: string, documents: LeaDocument[] = []) {
        super('div', 'course');

        this.courseName = name;
        this.courseCode = courseCode;
        this.documents = documents;

        this.sortDocuments();
    }

    // Load a course from its *components* page.
    static fromDocumentPage(page: Document): CourseDocumentList {
        // The course code and course name are placed inside the second line of title on the top of the course
        // components page.
        const courseTitle = (<HTMLElement>page.querySelector('.TitrePageLigne2')).innerText;
        const courseCodeAndName = extractCourseCodeAndNameFromCourseTitle(courseTitle);
        // Extract the documents.
        const documents = LeaDocument.loadFromCourseDocumentPage(page);

        return new CourseDocumentList(courseCodeAndName[1], courseCodeAndName[0], documents);
    }

    // Extracts a course and its documents from a url to a course components page.
    static loadFromCourseDocumentsURL(url: string): Promise<CourseDocumentList> {
        return fetchDocumentFrom(url).then((parsedDocument) => CourseDocumentList.fromDocumentPage(parsedDocument));
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
            new ElementBuilder({
                tag: 'div',
                styleClasses: ['course-name'],
                text: this.courseName
            }).build(),
            new ElementBuilder({
                tag: 'div',
                styleClasses: ['documents-list'],
                // Filter the documents to show only ones that match.
                children: this.documents.filter((leaDocument) => leaDocument.nameContains(renderInfo.search))
                    .map((leaDocument) => leaDocument.render(renderInfo))
            }).build()
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