// Represents a whole forum subject.
import {ForumMessage} from './forum-message';
import {Renderable} from '../rendering/renderable';
import {removePrinterFriendlyButton} from '../page-patcher';
import {ElementBuilder} from '../rendering/element-builder';

export class ForumSubject extends Renderable<null>{
    messages: ForumMessage[];
    // The href attached to the reply button for the whole subject.
    replyAction: string;

    expandedAll = false;
    scrolledToBottom = false;

    constructor(messages: ForumMessage[], replyAction: string) {
        super('div', 'omniplus-forum-subject', 'omniplus-lea-container');

        this.messages = messages;
        this.replyAction = replyAction;
    }

    static loadFromForumPostPage(page: Document): ForumSubject {
        // The reply button is an anchor element in the toolbar.
        const replyAction = (<HTMLAnchorElement>document.querySelector('.toolbarStrip a')).href;

        return new ForumSubject(ForumMessage.loadFromForumPostPage(page), replyAction);
    }

    updateDomElement() {
        this.domElement.append(
            new ElementBuilder({
                tag: 'div',
                styleClasses: ['controls'],
                children: [
                    // Reply to subject button
                    new ElementBuilder({
                        tag: 'a',
                        styleClasses: ['button', 'primary', 'material-icons'],
                        title: 'Reply to Subject',
                        href: this.replyAction,
                        text: 'comment',
                        onclick: (event) => (<HTMLElement>event.target).blur()
                    }).build(),
                    // Scroll to top/buttom button.
                    new ElementBuilder({
                        tag: 'a',
                        styleClasses: ['button', 'primary', 'material-icons'],
                        text: this.scrolledToBottom ? 'vertical_align_top' : 'vertical_align_bottom',
                        title: this.scrolledToBottom ? 'Scroll to Bottom' : 'Scroll to Top',
                        onclick: () => {
                            // Toggle expand all and rerender.
                            this.scrolledToBottom = !this.scrolledToBottom;

                            if (this.scrolledToBottom) {
                                this.domElement.scrollTo(0, this.domElement.scrollHeight);
                            } else {
                                this.domElement.scrollTo(0, 0);
                            }

                            this.render();
                        }
                    }).build(),
                    // Expand/collapse all button.
                    new ElementBuilder({
                        tag: 'a',
                        styleClasses: ['button', 'secondary', 'material-icons'],
                        text: this.expandedAll ? 'expand_less' : 'expand_more',
                        title: this.expandedAll ? 'Collapse All' : 'Expand All',
                        onclick: () => {
                            // Toggle expand all and rerender.
                            this.expandedAll = !this.expandedAll;

                            this.messages.forEach((message) => {
                                message.expanded = this.expandedAll;
                                // Rerender on the messages.
                                message.render();
                            });

                            this.render();
                        }
                    }).build()
                ]
            }).build(),
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