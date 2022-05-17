// Represents a message within a forum post.
import {Renderable} from '../rendering/renderable';
import {ElementBuilder} from '../rendering/element-builder';
import {FormattedText} from './formatted-text';

export class ForumMessage extends Renderable<null> {
    // When the forum is posted.
    postTime: Date;
    author: string;
    content: FormattedText;
    // The href of the anchor that allows you to quote the message.
    quoteAction: string;

    contentExceedsHeight = false;
    expanded: boolean = false;

    constructor(postTime: Date, author: string, originalContentElement: Element, quoteAction: string) {
        super('div', 'badged-card', 'message');

        this.postTime = postTime;
        this.author = author;
        this.content = FormattedText.fromContentNode(originalContentElement);
        this.quoteAction = quoteAction;

        const contentElement = new ElementBuilder({
            tag: 'div',
            styleClasses: ['content'],
            children: [this.content.render()]
        }).build();

        // Add the element to the document so the height can be measured.
        document.body.appendChild(contentElement);
        // Cap content height at 200px.
        if (!this.expanded && contentElement.clientHeight > 200) {
            this.contentExceedsHeight = true;
        }
        // Get rid of it after.
        document.body.removeChild(contentElement);
    }

    // Forum messages are not grouped together under common elements per message. Instead a list of table rows are
    // placed under one table to display everything. This makes each forum message take two elements.
    static fromPostElements(timeElement: HTMLTableRowElement, messageElement: HTMLTableRowElement): ForumMessage {
        // The post time of the message is stored in the element with the class .titreMsg. Parse the information
        // from it to extract the post time.
        const postTime = ForumMessage.extractMessagePostTime((<HTMLElement>timeElement.querySelector('.titreMsg')).innerText);

        // The name of the author is placed in the element with the class .nomAuteur alongside with the profile
        // button and the MIO button. They can be excluded by accessing the innerText property and trimming out the
        // extra tabs and spaces.
        const author = (<HTMLElement>messageElement.querySelector('.nomAuteur')).innerText.trim();
        // The actual message of the message is stored in an element with the class .Msg inside the message element
        // alongside a "quote" button. Choosing the first child to select the message and exclude the button.
        // Not confusing at all, right?
        const contentElement = messageElement.querySelector('.Msg').firstElementChild;

        // The reply button is stored in the anchor element in the message section in an element with the class
        // .liensMsg.
        const quoteAction = (<HTMLAnchorElement>messageElement.querySelector('.liensMsg a')).href;

        return new ForumMessage(postTime, author, contentElement, quoteAction);
    }

    // Extracts the time when the message was posted from its time string.
    static extractMessagePostTime(time: string): Date {
        const tokens = time.split(' ');
        // The time string on forum messages are formatted as follows:
        // YYYY-MM-DD at HH:MM AM/PM OR <yesterday/today>
        const dateStringTokens = tokens[0].split('-');

        let year, monthIndex, day;
        if (tokens[0] === 'yesterday') {
            // Subtract one day to obtain yesterday.
            const yesterday = new Date(Date.now() - 86400000);

            year = yesterday.getFullYear();
            monthIndex = yesterday.getMonth();
            day = yesterday.getDate();
        } else if (tokens[0] === 'today') {
            const today = new Date(Date.now());

            year = today.getFullYear();
            monthIndex = today.getMonth();
            day = today.getDate();
        } else {
            year = parseInt(dateStringTokens[0]);
            // Months start counting from 0. Subtract 1 from the parsed number.
            monthIndex = parseInt(dateStringTokens[1]) - 1;
            day = parseInt(dateStringTokens[2]);
        }

        const timeStringTokens = tokens[2].split(':');
        const isPM = tokens[3] == 'PM';

        // Mod the parsed hours by 12 before so 12AM becomes 0, and 12PM becomes 0 + 12.
        // Add 12 hours to the hour count if the post is made in PM.
        const hour = parseInt(timeStringTokens[0]) % 12 + (isPM ? 12 : 0);
        const minute = parseInt(timeStringTokens[1]);

        return new Date(year, monthIndex, day, hour, minute);
    }

    // Scrapes all forum messages from documents page of a given course.
    static loadFromForumPostPage(page: Document): ForumMessage[] {
        // The time of the forum elements have class .enteteMsg and are always table row elements. Only selecting
        // the class adds noise.
        const timeElements = page.querySelectorAll('tr.enteteMsg');
        // Everything else is contained in row elements with .Msg class. Only selecting the class adds noise.
        const messageElements = page.querySelectorAll('tr.Msg');

        // Iterate through both at the same time.
        return Array.from(timeElements).map((timeElement, index) => ForumMessage.fromPostElements(
            <HTMLTableRowElement>timeElement, <HTMLTableRowElement>messageElements[index]));
    }

    // Formatted post time.
    get formattedTime(): string {
        // The date string has the following format:
        // Weekday Month Date Year
        // We desire the following format:
        // Month Date, Year
        const dateStringParts = this.postTime.toDateString().split(' ');
        // The time string has the following format:
        // HH:MM:SS GMT-NNNN (Time Zone Name)
        // We desire the following format:
        // HH:MM
        // To obtain the parts, first split by space, then by colon.
        const timeStringParts = this.postTime.toTimeString().split(' ')[0].split(':');


        return `${timeStringParts[0]}:${timeStringParts[1]} ${dateStringParts[1]} ${dateStringParts[2]}, ${dateStringParts[3]}`;
    }

    renderContentElement(): Element {
        return new ElementBuilder({
            tag: 'div',
            // Shorten if the content exceeds the height limit and the current message has not been expanded.
            styleClasses: ['content', ...(!this.expanded && this.contentExceedsHeight) ? ['shortened'] : []],
            children: [this.content.render()]
        }).build();
    }

    renderExpandButton(): Element {
        return new ElementBuilder({
            tag: 'a',
            styleClasses: ['badge', 'material-icons', 'clickable', 'expand'],
            onclick: (event) => {
                // Invert the state
                this.expanded = !this.expanded;
                // And call for a rerender.
                this.render();
                // Unfocus after click.
                (<HTMLAnchorElement>event.target).blur();
            },
            text: this.expanded ? 'expand_less' : 'expand_more'
        }).build();
    }

    updateDomElement() {
        this.domElement.append(
            new ElementBuilder({
                tag: 'div',
                styleClasses: ['badge-holder'],
                children: [
                    new ElementBuilder({
                        tag: 'a',
                        styleClasses: ['badge', 'material-icons', 'clickable'],
                        href: this.quoteAction,
                        // Unfocus after click.
                        onclick: event => (<HTMLAnchorElement>event.target).blur(),
                        text: 'format_quote'
                    }).build(),
                    // Add the expand button if the content exceeds the height limit.
                    ... this.contentExceedsHeight ? [this.renderExpandButton()] : []
                ]
            }).build(),
            new ElementBuilder({
                tag: 'div',
                styleClasses: ['card'],
                children: [
                    new ElementBuilder({
                        tag: 'div',
                        styleClasses: ['header'],
                        children: [
                            // Boldface the author name.
                            new ElementBuilder({
                                tag: 'b',
                                styleClasses: ['author'],
                                text: this.author
                            }).build(),
                            new ElementBuilder({
                                tag: 'span',
                                styleClasses: ['filler']
                            }).build(),
                            new ElementBuilder({
                                tag: 'span',
                                styleClasses: ['time'],
                                text: this.formattedTime
                            }).build()
                        ]
                    }).build(),
                    this.renderContentElement()
                ]
            }).build()
        );
    }
}