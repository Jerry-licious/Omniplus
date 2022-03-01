// Represents a whole forum subject.
import {ForumMessage} from './forum-message';
import {Renderable} from '../renderable';
import {removePrinterFriendlyButton} from '../page-patcher';
import {ElementBuilder} from '../dom-builder';

export class ForumSubject extends Renderable<null>{
    messages: ForumMessage[];
    expandedAll = false;
    scrolledToBottom = false;

    constructor(messages: ForumMessage[]) {
        super('div', 'omniplus-forum-subject', 'omniplus-lea-container');

        this.messages = messages;
    }

    static loadFromForumPostPage(page: Document): ForumSubject {
        return new ForumSubject(ForumMessage.loadFromForumPostPage(page));
    }

    updateDomElement() {
        this.domElement.append(
            new ElementBuilder('div')
                .withStyleClasses('controls')
                .withChildren(
                    new ElementBuilder('a')
                        .withStyleClasses('button', 'primary', 'material-icons')
                        .withEventListener('click', () => {
                            // Toggle expand all and rerender.
                            this.scrolledToBottom = !this.scrolledToBottom;

                            if (this.scrolledToBottom) {
                                this.domElement.scrollTo(0, this.domElement.scrollHeight);
                            } else {
                                this.domElement.scrollTo(0, 0);
                            }

                            this.render();
                        })
                        .withText(this.scrolledToBottom ? 'vertical_align_top' : 'vertical_align_bottom')
                        .withAttribute('title', this.scrolledToBottom ?
                            'Scroll to Bottom' : 'Scroll to Top')
                        .build(),
                    new ElementBuilder('a')
                        .withStyleClasses('button', 'secondary', 'material-icons')
                        .withEventListener('click', () => {
                            // Toggle expand all and rerender.
                            this.expandedAll = !this.expandedAll;

                            this.messages.forEach((message) => {
                                message.expanded = this.expandedAll;
                                // Rerender on the messages.
                                message.render();
                            });

                            this.render();
                        })
                        .withText(this.expandedAll ? 'expand_less' : 'expand_more')
                        .withAttribute('title', this.expandedAll ? 'Collapse All' : 'Expand All')
                        .build()
                )
                .build(),
            ...this.messages.map((msg) => msg.render())
        );
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