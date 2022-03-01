// Represents a whole forum subject.
import {ForumMessage} from './forum-message';
import {Renderable} from '../renderable';
import {removePrinterFriendlyButton} from '../page-patcher';

export class ForumSubject extends Renderable<null>{
    messages: ForumMessage[];

    constructor(messages: ForumMessage[]) {
        super('div', 'omniplus-forum-subject', 'omniplus-lea-container');

        this.messages = messages;
    }

    static loadFromForumPostPage(page: Document): ForumSubject {
        return new ForumSubject(ForumMessage.loadFromForumPostPage(page));
    }

    updateDomElement() {
        this.domElement.append(...this.messages.map((msg) => msg.render()))
    }

    // Injects the container into the document overview page.
    injectToForumSubjectPage() {
        removePrinterFriendlyButton();

        // Fetch the original container of the subject.
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