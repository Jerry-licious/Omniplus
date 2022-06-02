import {fetchDocumentFrom, getMonthIndexFromShortenedName, regexEscape} from '../../util/util';
import {ElementBuilder} from '../rendering/element-builder';
import {OverviewRenderInfo} from './render-info';
import {LeaDocumentType} from './document-type';
import {Badge} from '../rendering/badged-card/badge';
import {BadgedCard} from '../rendering/badged-card/badged-card';

// Represents a components under a course on Lea.
export class LeaDocument extends BadgedCard<OverviewRenderInfo> {
    name: string;
    description: string;
    read: boolean;
    uploadDate: Date;
    // The href attached to the <a> element on the components that opens it.
    originalOpenAction: string;
    // The actual URL that is supposed to be opened for ease of use.
    url: string;
    type: LeaDocumentType;

    constructor(name: string, description: string, read: boolean, uploadDate: Date,
                originalOpenAction: string, type: LeaDocumentType) {
        super({
            styleClasses: ['document']
        });

        this.name = name;
        this.description = description;
        this.read = read;
        this.uploadDate = uploadDate;
        this.originalOpenAction = originalOpenAction;
        this.type = type;

        // The url takes a bit of time to obtain, setting it to '#' as a filler.
        this.url = '#';
        // Extract the url asynchronously.
        LeaDocument.extractDocumentURL(originalOpenAction, type)
            .then((url) => {
                // Update the url.
                this.url = url;
                // And call for a rerender if the document has been rendered already.
                if (this.lastRenderInfo) {
                    this.rerender();
                }
            });
    }

    // Loads relevant information of a components from its table row element.
    static fromElement(rowElement: HTMLTableRowElement): LeaDocument {
        // Fetch the name from the <a> element responsible for the title of the components.
        const name = (<HTMLElement>rowElement.querySelector('.lblTitreDocumentDansListe')).innerText.trim();
        // The description of the child element is in a text node that is the parent of the name element.
        const description = rowElement.querySelector('.divDescriptionDocumentDansListe')
            // This means that innerText of the element will also include the name of the components.
            // Luckily, the description text node is the last child of the element.
            // However, this description node's content also includes many `\t` characters at its start and end, which
            // need to be removed with `trim()`.
            .lastChild.textContent.trim();
        // The status of the components is indicated by a star icon that appears if it has not been read. Check if that
        // icon is present to see if the components has been read.
        const read = rowElement.querySelector('.classeEtoileNouvDoc') == null;

        const date = LeaDocument.extractDocumentDate((<HTMLSpanElement>rowElement.querySelector('.DocDispo')).innerText);

        // The download url of the components is placed in an <a> element that is in the element with the class
        // .colVoirTelecharger.
        const originalOpenAction = (<HTMLAnchorElement>rowElement.querySelector('.colVoirTelecharger a')).href;

        const type = LeaDocument.determineDocumentTypeFromOpenAction(originalOpenAction);

        return new LeaDocument(name, description, read, date, originalOpenAction, type);
    }

    // Scrapes all elements from documents page of a given course.
    static loadFromCourseDocumentPage(page: Document): LeaDocument[] {
        const documents: LeaDocument[] = [];

        // Documents are placed within either table row elements with either the itemDataGrid or the
        // .itemDataGridAltern class, which correspond to even and odd-numbered documents.
        page.querySelectorAll('.itemDataGrid, .itemDataGridAltern').forEach(
            (rowElement) => documents.push(LeaDocument.fromElement(<HTMLTableRowElement>rowElement)));

        return documents;
    }

    // Extracts all documents on the page from an url to a course components page.
    static loadFromCourseDocumentsURL(url: string): Promise<LeaDocument[]> {
        return fetchDocumentFrom(url).then((parsedDocument) => LeaDocument.loadFromCourseDocumentPage(parsedDocument));
    }

    // Determines the type of the document from the href of the anchor element that opens it.
    static determineDocumentTypeFromOpenAction(href: String): LeaDocumentType {
        // Both file and link documents have a link in their href that includes
        // VisualiseDocument.aspx.
        if (href.includes('VisualiseDocument.aspx')) {
            // Link documents though refer to VisualiseDocument.aspx, have a
            // JavaScript execution in their href. More specifically, they have a
            // special line of code that contains the link to be redirected to.
            // Their href look something like this:
            // javascript:CallPageVisualiseDocument('VisualiseDocument.aspx?...');
            // ValiderLienDocExterne('Link Encoded in URI');
            // which means that they can be identified by their use of
            // 'ValiderLienDocExterne'.
            if (href.includes('ValiderLienDocExterne')) {
                return LeaDocumentType.Link;
            }
            // File documents have a direct link in their href that sends the user to
            // a new tab to directly download the document. Their links look
            // something like this:
            // VisualiseDocument.aspx?...
            else {
                return LeaDocumentType.File;
            }
        }
        // Both YouTube and media document types have the href containing a
        // JavaScript execution that contains the link to VisualiseVideo.aspx.
        else if (href.includes('VisualiseVideo.aspx')) {
            // Links that open a media has the second argument of the JavaScript
            // code set to false, which makes it looks like this:
            // javascript:VisualiserVideo('VisualiseVideo.aspx?...', false);
            if (href.includes('false')) {
                return LeaDocumentType.Video;
            }
                // While links that open a YouTube video has the second argument of the
                // JavaScript code set to true, which makes it look like this:
            // javascript:VisualiserVideo('VisualiseVideo.aspx?...', true);
            else if (href.includes('true')) {
                return LeaDocumentType.YouTube;
            }
        }

        // Default to file if all checks fail.
        return LeaDocumentType.File;
    }

    static quotationMarksRegex = new RegExp("'.+?'", 'g');
    // Extracts the link of the document based on its type. Used to fetch the link and YouTube url for non-files.
    static extractDocumentURL(openAction: string, type: LeaDocumentType): Promise<string> {
        // Decoding the component before matching because SOME browsers decide to encode the quotation
        // marks in URI too.
        const openActionDecoded = decodeURIComponent(openAction);
        switch (type) {
            case LeaDocumentType.File:
                // Files do not need any modifications.
                return new Promise((resolve, reject) => resolve(openAction));
            case LeaDocumentType.Link:
                // Link documents have a href that looks like this:
                // javascript:CallPageVisualiseDocument('VisualiseDocument.aspx?...');
                // ValiderLienDocExterne('Link Encoded in URI');
                return new Promise((resolve, reject) => {
                    // The link can be extracted by matching for the second string contained in single quotation marks.
                    resolve(openActionDecoded.match(LeaDocument.quotationMarksRegex)[1]
                            // Remove the quotation marks.
                            .replaceAll("'", ''));
                });
            case LeaDocumentType.Video:
                // Video href have the following format:
                // javascript:VisualiserVideo('VisualiseVideo.aspx?...', false);
                // The link to the video preview can be obtained by matching for
                // everything inside the quotation marks and trimming out the quotation
                // marks.
                return new Promise((res, rej) => res(
                    openActionDecoded.match(this.quotationMarksRegex)[0].replaceAll("'", '')
                    // However, since the tokens and info are exactly the same after
                    // the .aspx, the true download link can simply be obtained by
                    // swapping the 'VisualiseVideo' with 'VisualiseDocument'.
                    .replace('VisualiseVideo', 'VisualiseDocument')));
            case LeaDocumentType.YouTube:
                // YouTube href have the following format.
                // javascript:VisualiserVideo('VisualiseVideo.aspx?...', true);
                // The link in the script can be extracted by matching for quotation
                // marks, trimming them out, and then adding to the root link.
                return fetchDocumentFrom(openActionDecoded.match(this.quotationMarksRegex)[0].replaceAll("'", ''))
                    // The true YouTube link is stored in the href of the anchor element
                    // with the class .Gen_Btn...
                    .then((document) => document.querySelector('.Gen_Btn'))
                    .then((anchor) => (<HTMLAnchorElement>anchor).href)
                    // in the following format:
                    // javascript:OpenCentre('YouTube Link Encoded in URI', ...); Close();
                    .then((href) => decodeURIComponent(href.match(LeaDocument.quotationMarksRegex)[0].replaceAll("'", '')));
        }
    }

    static extractDocumentDate(dateString: string) {
        // On Marianopolis's documents page, document dates are formatted in one
        // of the two following ways:
        // since<Month> <Day>, <Year>
        // from <Month> <Day>, <Year> to <Month> <Date>, <Year>
        // For the first case, there is no space between the "since" and the month, so it is necessary to trim the
        // since out and then fetch the month, day, and year from the indices 0, 1, and 2.
        if (dateString.startsWith('since')) {
            // \u00A0 is a non-breaking space.
            // Trim out the first 5 characters ('since').
            const words = dateString.substring(5).split(/[\u00A0 \n]/g);
            // Months on Omnivox are presented in their abbreviated form.
            const month = getMonthIndexFromShortenedName(words[0]);
            // Remove the comma by removing the last character.
            const day = parseInt(words[1].substring(0, words[1].length - 1));
            const year = parseInt(words[2]);

            return new Date(year, month, day);
        } else {
            const words = dateString.split(/[\u00A0 \n]/g);
            const month = getMonthIndexFromShortenedName(words[1]);
            const day = parseInt(words[2].substring(0, words[2].length - 1));
            const year = parseInt(words[3]);

            return new Date(year, month, day);
        }
    }

    // Marks the document as read locally and remotely.
    markAsRead(): void {
        // Condition to avoid sending too many requests to server.
        if (!this.read) {
            this.read = true;

            // If this is a file, fetch on the download link directly.
            if (this.type == LeaDocumentType.File) {
                fetch(this.url);
            } else {
                // Otherwise fetch the first quoted part in the open action to mark the document as read.
                // Remove the quotation marks after matching.
                fetch(this.originalOpenAction.match(LeaDocument.quotationMarksRegex)[0].replaceAll("'", ''));
            }
            // Ignoring the responses of the fetch because the request is only sent to notify the server.
        }
    }

    // Returns the style class (colour) that corresponds to the document type.
    get documentIconTypeStyleClass(): string {
        switch (this.type) {
            case LeaDocumentType.File:
                return 'file-background';
            case LeaDocumentType.Link:
                return 'link-background';
            case LeaDocumentType.Video:
            case LeaDocumentType.YouTube:
                return 'video-background';
        }
    }

    // Returns the material icon displayed on the document type badge.
    get documentTypeIcon(): string {
        switch (this.type) {
            case LeaDocumentType.File:
                return 'description';
            case LeaDocumentType.Link:
                return 'link';
            case LeaDocumentType.Video:
                return 'video_file';
            case LeaDocumentType.YouTube:
                return 'video_library';
        }
    }

    // Returns the material icon displayed on the download badge.
    get documentActionIcon(): string {
        switch (this.type) {
            case LeaDocumentType.File:
                return 'file_download';
            case LeaDocumentType.Link:
                return 'open_in_new';
            case LeaDocumentType.Video:
                return 'play_circle';
            case LeaDocumentType.YouTube:
                return 'open_in_new';
        }
    }

    get formattedDate(): string {
        const dateStringParts = this.uploadDate.toDateString().split(' ');
        // The date string has the following format:
        // Weekday Month Date Year
        // We desire the following format:
        // Month Date, Year
        return `${dateStringParts[1]} ${dateStringParts[2]}, ${dateStringParts[3]}`;
    }

    buildBadges(renderInfo: OverviewRenderInfo): Badge[] {
        return [
            new Badge({
                clickable: false,
                // The first badge represents the type of the document.
                styleClasses: [this.documentIconTypeStyleClass],
                icon: this.documentTypeIcon
            }),
            new Badge({
                newTab: true,
                // Open the link in a new tab.
                styleClasses: ['clickable'],
                icon: this.documentActionIcon,
                href: this.url,
                onclick: (event) => {
                    // Mark the document as read.
                    this.markAsRead();
                    // Call for a re-render when the read status has been updated.
                    this.rerender();
                }
            })
        ];
    }

    buildContent(renderInfo: OverviewRenderInfo): Element[] {
        return [
            // Render the date with the title inside another div so the gap from the card do not
            // separate them.
            new ElementBuilder({
                tag: 'div',
                children: [
                    // Document Name
                    this.renderNameHighlight(renderInfo.search),
                    // Upload Date
                    new ElementBuilder({
                        tag: 'div',
                        styleClasses: ['date'],
                        text: this.formattedDate
                    }).build()
                ]
            }).build(),
            // Only render the description if there is a description.
            ...this.description.length > 0 ? [new ElementBuilder({
                tag: 'div',
                styleClasses: ['description'],
                text: this.description
            }).build()] : []
        ];
    }

    // Renders the name of the document in DOM while highlighting the search term.
    renderNameHighlight(search: string): HTMLElement {
        const titleElement: HTMLElement = <HTMLElement>new ElementBuilder({
            tag: 'div',
            // Add the bold tag if the document has not been read.
            styleClasses: ['name', ...this.read ? [] : ['bold']]
        }).build();

        // Save the trouble of building the regex and dealing with 0-length matches here.
        if (search.length > 0) {
            // Add the ig flags to ignore case and match globally.
            // Since we are ignoring case, use replace to maintain the original match.
            titleElement.innerHTML = this.name.replace(new RegExp(regexEscape(search), 'ig'),
                // God I have sinned in using HTML to make elements. Please forgive me.
                (match: string) => `<mark>${match}</mark>`);
        } else {
            titleElement.appendChild(document.createTextNode(this.name));
        }
        
        return titleElement;
    }

    nameContains(search: string): boolean {
        // Ignore casing for this check.
        return this.name.toLowerCase().includes(search.toLowerCase());
    }
}