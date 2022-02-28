export class ForumMessage {
    // When the forum is posted.
    postTime: Date;
    author: string;
    content: string;

    constructor(postTime: Date, author: string, content: string) {
        this.postTime = postTime;
        this.author = author;
        this.content = content;
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
        const messageHTML = messageElement.querySelector('.Msg').firstElementChild.innerHTML;

        return new ForumMessage(postTime, author, messageHTML);
    }

    // Extracts the time when the message was posted from its time string.
    static extractMessagePostTime(time: string): Date {
        const tokens = time.split(' ');
        // The time string on forum messages are formatted as follows:
        // YYYY-MM-DD at HH:MM AM/PM
        const dateStringTokens = tokens[0].split('-');
        const year = parseInt(dateStringTokens[0]);
        // Months start counting from 0. Subtract 1 from the parsed number.
        const monthIndex = parseInt(dateStringTokens[1]) - 1;
        const day = parseInt(dateStringTokens[2]);

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
}