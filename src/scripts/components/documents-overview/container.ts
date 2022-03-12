import {Renderable} from '../renderable';
import {CourseDocumentList} from './course-document-list';
import {OverviewRenderInfo} from './render-info';
import {ElementBuilder} from '../dom-builder';

export class LeaDocumentsContainer extends Renderable<OverviewRenderInfo> {
    courses: CourseDocumentList[] = [];
    // Whether the courses have been loaded or not.
    ready: boolean = false;

    constructor(documents: Promise<CourseDocumentList[]>) {
        // Start with the loading class.
        super('div', 'course-list-loading');

        // Add the documents asynchronously.
        documents.then((courses) => {
            // Mark as loaded.
            this.ready = true;

            courses.forEach((course) => this.courses.push(course));

            // Call for a re-render if the container has been rendered already.
            if (this.lastRenderInfo) {
                this.rerender();
            }
        });
    }

    // Loads all courses and all documents from the document overview page on Lea.
    static loadFromDocumentOverviewPage(page: Document): LeaDocumentsContainer {
        const coursePromises: Promise<CourseDocumentList>[] = [];

        // Courses are placed within either table row elements with either the itemDataGrid or the
        // .itemDataGridAltern class, which correspond to even and odd-numbered documents.
        page.querySelectorAll('.itemDataGrid, .itemDataGridAltern').forEach((rowElement) => {
            // The link to the course is stored in the <a> element with the class .DisDoc_Sommaire_NomCours.
            const courseLink = (<HTMLAnchorElement>rowElement.querySelector('.DisDoc_Sommaire_NomCours')).href;
            // Await everything together to load faster.
            coursePromises.push(CourseDocumentList.loadFromCourseDocumentsURL(courseLink));
        });

        // Wait for all of them at once.
        return new LeaDocumentsContainer(Promise.all(coursePromises));
    }

    updateDomElement(renderInfo: OverviewRenderInfo): void {
        if (this.ready) {
            if (this.domElement.classList.contains('course-list-loading')) {
                this.domElement.classList.remove('course-list-loading')
            }
            if (!this.domElement.classList.contains('course-list')) {
                // Restore the tag after loading is complete.
                this.domElement.classList.add('course-list');
            }

            // Render courses only after everything have been loaded.
            // Display only courses that have documents that match the search term.
            this.courses.filter((course) => course.hasDocumentMatch(renderInfo.search))
                .forEach((course) => this.domElement.appendChild(course.render(renderInfo)));
        } else {
            // While the container is loading, insert the loading element.
            this.domElement.appendChild(new ElementBuilder('div')
                .withStyleClasses('loading-spinner')
                .build());
        }

    }

    markAllDocumentsAsRead(): void {
        this.courses.forEach((course) => course.markAllDocumentsAsRead());
    }
}