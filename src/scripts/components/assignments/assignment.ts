import {
    extractCourseCodeAndNameFromCourseTitle,
    fetchDocumentFrom,
    getCurrentLeaRoot,
    getMonthIndexFromShortenedName,
    millisecondsInADay,
    monthsShortened,
    openCenteredPopup,
    quotationMarksRegex
} from '../../util/util';
import {AssignmentStatus} from './assignment-status';
import {BadgedCard} from '../rendering/badged-card/badged-card';
import {Badge} from '../rendering/badged-card/badge';
import {ElementBuilder} from '../rendering/element-builder';
import {FormattedText} from '../rendering/formatted-text';

// Represents an assignment on Lea.
// The design of a card can be seen in assignments-overview.html.
export class Assignment extends BadgedCard<null>{
    name: string;
    courseName: string;
    // Apparently assignments don't have to have descriptions. Making this one nullable too.
    description?: FormattedText;
    dueTime: Date;

    // Link to the pop-up window for the submission.
    popupLink: string;
    // Link to the instruction document, nullable because not all assignments have instructions attached.
    instructionLink?: string;
    // Link to the submitted copy of the assignment, nullable because not all assignments have submissions or allow
    // you to submit.
    submissionLink?: string;
    // Link to the correction document, nullable because not all assignments return corrections.
    correctionLink?: string;

    // Whether the assignment is due at a specific time in the day. If it isn't, we will assume that it's due at the
    // end of that day (midnight).
    dueTimeSpecified: boolean;
    // Whether the assignment should be submitted on Lea or not.
    leaSubmission: boolean;

    constructor(name: string, courseName: string, dueTime: Date, dueTimeSpecified: boolean, popupLink: string,
                leaSubmission: boolean, description?: FormattedText, instructionLink?: string, submissionLink?: string, correctionLink?: string) {
        super({
            styleClasses: ['assignment']
        });

        this.name = name;
        this.courseName = courseName;
        this.leaSubmission = leaSubmission;
        this.description = description;
        this.dueTime = dueTime;
        this.dueTimeSpecified = dueTimeSpecified;
        this.popupLink = popupLink;
        this.instructionLink = instructionLink;
        this.submissionLink = submissionLink;
        this.correctionLink = correctionLink;
    }

    static loadFromAssignmentPopup(popupLink: string, page: Document,
                                   dueTimeFromList: {dueTime: Date, timeSpecified: boolean}): Assignment {
        // Really have to give credit to Omnivox for having IDs for each component of the page, makes searching much
        // much much easier.

        // The course name is placed in the element with the style class .TitrePageLigne2.
        const [_courseCode, courseName] = extractCourseCodeAndNameFromCourseTitle(
            (<HTMLElement>page.querySelector('.TitrePageLigne2')).innerText);
        // The assignment name is placed in the element with the id #lblTitre.
        const name = (<HTMLElement>page.querySelector('#lblTitre')).innerText;

        // The description is in the element with the id #lblEnonce.
        const descriptionElement = page.querySelector('#lblEnonce');
        // It doesn't always exist, so use its existence as a marker for whether a description is being provided.
        const description = descriptionElement ? FormattedText.fromContentNode(descriptionElement) : null;

        // The instructions are linked to the element with the id #AlienFichierLie2.
        const instructionElementHref = (<HTMLAnchorElement>page.querySelector('#ALienFichierLie2')).href
        // If no instruction is attached, the href will be empty.
        const instructionLink = instructionElementHref.length > 0 ? instructionElementHref : null;

        // The due date of the assignment is stored in the element with the id #lblDateRemise.
        // If the assignment is due in class, the element that displays the due date will not be present.
        // Checking the presence of this element is surprisingly more persistent than checking the presence of the
        // submit button since the submit button disappears once Lea stops accepting submissions.
        const leaSubmission = page.querySelector('#lblDateRemise') != null;

        const {dueTime, timeSpecified} = dueTimeFromList;

        // The anchor element that links to the latest submission shares neighbouring parents with an element with
        // the id #lblEnteteRemise.
        // The label may not be present when there is no submission or when the assignment is supposed to be
        // submitted in-person.
        const submissionLabel = page.querySelector('#lblEnteteRemise');
        // However, even if the label does exist, the anchor may not.
        // The anchor will be null if it doesn't exist, use this to check if something has been submitted.
        // I refuse to use a proper if/else for this and I'm sticking with this ugly ternary just because I'm very
        // upset.
        const submissionLink = submissionLabel != null ? (
            submissionLabel.parentElement.nextElementSibling.querySelector('a') != null ?
                submissionLabel.parentElement.nextElementSibling.querySelector('a').href : null
        ) : null;

        // The anchor that links to the corrected copy shares a parent with an element with the id
        // #lblEnteteCopieCorrigee. The label is only present if the anchor is also present.
        const correctionLabel = page.querySelector('#lblEnteteCopieCorrigee');
        // The label will be an indicator of whether the assignment has been corrected, it will be null if it
        // doesn't exist.
        const correctionLink = correctionLabel ? correctionLabel.parentElement.querySelector('a').href : null;

        return new Assignment(name, courseName, dueTime, timeSpecified, popupLink, leaSubmission,
            description, instructionLink, submissionLink, correctionLink);
    }

    static loadAllAssignmentsFromCourseAssignmentsList(page: Document): Promise<Assignment[]> {
        // The assignment list uses a table, which has columns with the classes .LigneListTrav1, .LigneListTrav2, or
        // .LigneListTrav1Last. Sometimes they have multiple anchor children, which can include the submitted copy.
        // Exclude that by excluding elements with the class .lienTruncate.
        // They also include a list of due dates in each corresponding assignment, which are spans without the class
        // .RemTrav_Sommaire_ProchainsTravauxDesc.
        const dates = Array.from(page.querySelectorAll(
            '.LigneListTrav1 span:not(.RemTrav_Sommaire_ProchainsTravauxDesc), ' +
            '.LigneListTrav2 span:not(.RemTrav_Sommaire_ProchainsTravauxDesc), ' +
            '.LigneListTrav1Last span:not(.RemTrav_Sommaire_ProchainsTravauxDesc)'))
            .map((span) => (<HTMLElement>span).innerText);

        return Promise.all(Array.from(page.querySelectorAll(
            '.LigneListTrav1 a:not(.lienTruncate), .LigneListTrav2 a:not(.lienTruncate), .LigneListTrav1Last a:not(.lienTruncate)'))
            // Excluding the .lienTruncate class doesn't eliminate the additional "download corrected copy" buttons.
            // Since they have no easily identifiable style or structure, I will just manually filter off anything
            // that doesn't have an onclick attribute.
            .filter((anchor) => anchor.getAttribute('onclick') != null)
            .map((anchor) => (<HTMLAnchorElement>anchor).getAttribute('onclick'))
            // The onclick attribute of the anchor has the following formatting:
            // OpenCentre('DepotTravail.aspx?...', 'DepotTravailPopup', 'toolbar=no...', 700, 780, true)
            // Match for the quotation marks to get the tail of the target link and remove the quotation marks.
            .map((onClickCode) => onClickCode.match(quotationMarksRegex)[0].replaceAll("'", ''))
            // Add the end of the url to the current root to obtain the actual link to the popup.
            // Add the slash because it's been trimmed when the location was split.
            .map((urlEnd) => `${getCurrentLeaRoot()}/${urlEnd}`)
            .map((url, index) => fetchDocumentFrom(url).then((popupPage) =>
                this.loadFromAssignmentPopup(url, popupPage, this.extractDueDateFromAssignmentListDateString(dates[index])))));
    }

    static extractDueDateFromAssignmentListDateString(dueDateString: string): {dueTime: Date, timeSpecified: boolean} {
        // Due times on the assignment list have the following format:
        // <Month Shortened>-<Date>, <Year> [at] [hh:mm]
        // Where the time of the day can be entirely optional.
        const splits = dueDateString.split('at').map((part) => part.trim());
        // If the time is specified, the "at" will be present and the split will have 2 pieces.
        const timeSpecified = splits.length > 1;
        const [dateString, timeString] = splits;

        const [datePart, yearString] = dateString.split(',').map((part) => part.trim());
        const [monthShortened, dayString] = datePart.split('-');

        const monthIndex = getMonthIndexFromShortenedName(monthShortened);
        const day = parseInt(dayString);
        const year = parseInt(yearString);

        // Also decompose the time if it exists.
        if (timeSpecified) {
            // Split with the colon and then parse them to obtain the numbers.
            const [hours, minutes] = timeString.split(':').map((str) => parseInt(str.trim()));
            return {
                dueTime: new Date(year, monthIndex, day, hours, minutes),
                timeSpecified: true
            }
        } else {
            return {
                dueTime: new Date(year, monthIndex, day),
                timeSpecified: false
            }
        }
    }

    get hasDescription(): boolean {
        return this.description != undefined;
    }

    get hasInstructions(): boolean {
        return this.instructionLink != undefined;
    }

    get submitted(): boolean {
        return this.submissionLink != undefined;
    }

    get corrected(): boolean {
        return this.correctionLink != undefined;
    }

    // Completion status of the assignment, used to filter the assignments into their corresponding sections.
    get status(): AssignmentStatus {
        if (this.corrected) {
            return AssignmentStatus.Corrected;
        } else if (this.submitted) {
            return AssignmentStatus.Submitted;
        } else {
            return AssignmentStatus.Assigned;
        }
    }

    // The instruction badge is the first badge on the right.
    buildInstructionBadge(): Badge {
        // Return a clickable badge that leads to the instructions if instructions are available.
        // If no instruction is given, the button will not be interactive, and a tooltip will indicate that no
        // instructions are attached.
        return new Badge({
            clickable: this.hasInstructions,
            newTab: true,
            icon: 'info',
            styleClasses: this.hasInstructions ? ['clickable'] : ['clickable-disabled'],
            href: this.hasInstructions ? this.instructionLink : '#',
            title: this.hasInstructions ? '' : 'No Instructions Attached'
        });
    }

    // The action badge represents what can be done with the assignment. While multiple actions are available,
    // namely submitting the assignment, uploading additional versions, downloading your submission, or checking
    // corrections, usually only one of these is used at each stage of the assignment.
    // This means that there will only be *one* secondary action available on the card despite the possibilities.
    buildActionBadge() {
        switch (this.status) {
            case AssignmentStatus.Assigned: {
                // In the assignment stage, the secondary action will be to upload the assignment.
                return new Badge({
                    // Only allow the upload to be clicked if the assignment is going to be submitted on Lea.
                    clickable: this.leaSubmission,
                    icon: this.leaSubmission ? 'file_upload' : 'class',
                    styleClasses: this.leaSubmission ? ['clickable-secondary'] : ['clickable-secondary-disabled'],
                    title: this.leaSubmission ? '' : 'In-class Submission',
                    onclick: this.leaSubmission ? () => {
                        openCenteredPopup(this.popupLink);
                    } : () => {}
                });
            }
            case AssignmentStatus.Submitted: {
                // After the assignment has been submitted, students may still want to submit newer versions with
                // corrections or take a last time extension, etc. This means that the secondary action is still to
                // open the popup, but the icon will be adjusted to indicate that the assignment is already in.
                return new Badge({
                    // Only allow the upload to be clicked if the assignment is going to be submitted on Lea.
                    clickable: this.leaSubmission,
                    icon: this.leaSubmission ? 'assignment_turned_in' : 'class',
                    styleClasses: this.leaSubmission ? ['clickable-secondary'] : ['clickable-secondary-disabled'],
                    title: this.leaSubmission ? '' : 'In-class Submission',
                    onclick: this.leaSubmission ? () => {
                        openCenteredPopup(this.popupLink);
                    } : () => {}
                });
            }
            case AssignmentStatus.Corrected: {
                // After the assignment has been corrected, the secondary action will be to download the corrected copy.
                return new Badge({
                    icon: 'assignment_returned',
                    styleClasses: ['clickable-secondary'],
                    onclick: () => {
                        openCenteredPopup(this.correctionLink);
                    }
                });
            }
        }
    }

    // An assignment is effectively due at the end of the day if the time of the day is not specified.
    get effectiveDueTime(): Date {
        if (this.dueTimeSpecified) {
            return this.dueTime;
        } else {
            // Just making a new date and set the time to the last second of the day to avoid all the contingencies.
            return new Date(this.dueTime.getFullYear(), this.dueTime.getMonth(), this.dueTime.getDate(), 23, 59, 59);
        }
    }

    get overdue(): boolean {
        // An assignment is only overdue if it hasn't been submitted.
        return this.status == AssignmentStatus.Assigned && Date.now() > this.effectiveDueTime.valueOf();
    }

    // Returns the day that the assignment is due without the specified time.
    get dueDate(): Date {
        return new Date(this.dueTime.getFullYear(), this.dueTime.getMonth(), this.dueTime.getDate());
    }

    // Displays the due time in a string, showing the date (and omitting the time if ot specified).
    get dueTimeDisplayed(): string {
        // Difference in milliseconds between the due date and now.
        const difference = this.dueDate.valueOf() - Date.now();
        let dateString: string;
        // If it was due a day ago, say yesterday.
        if (difference >= -millisecondsInADay && difference < 0) {
            dateString = 'Yesterday';
        } // If it's due in a day, say today.
        else if (difference >= 0 && difference < millisecondsInADay) {
            dateString = 'Today';
        } // If it's due in two days, say tomorrow.
        else if (difference >= millisecondsInADay && difference < 2 * millisecondsInADay) {
            dateString = 'Tomorrow';
        } // Otherwise, just format the date.
        // TODO: Stating in relative time should provide a better sense of urgency than just formatting the dates.
        //  Come up with a comprehensive system that formats due time within 2 weeks in the most urgent way possible.
        else {
            // Since a school year crosses over winter, we'll include the year always just to be clear.
            dateString = `${this.dueTime.getDate()} ${monthsShortened[this.dueTime.getMonth()]}, ${this.dueTime.getFullYear()}`;
        }
        // Append the time if specified.
        if (this.dueTimeSpecified) {
            let dueTimeMinutes = this.dueTime.getMinutes().toString();
            // Make sure that the minutes part always has 2 characters.
            if (dueTimeMinutes.length == 1) {
                dueTimeMinutes = '0' + dueTimeMinutes;
            }

            return `${dateString} at ${this.dueTime.getHours()}:${dueTimeMinutes}`;
        } else {
            return dateString;
        }
    }

    buildBadges(): Badge[] {
        return [this.buildInstructionBadge(), this.buildActionBadge()];
    }

    buildContent(): Element[] {
        return [
            new ElementBuilder({
                tag: 'div',
                children: [
                    new ElementBuilder({
                        tag: 'div',
                        styleClasses: ['name'],
                        text: this.name
                    }).build(),
                    new ElementBuilder({
                        tag: 'div',
                        styleClasses: ['course-name'],
                        text: this.courseName
                    }).build(),
                    new ElementBuilder({
                        tag: 'div',
                        // If an assignment is overdue, add an error colour to highlight it.
                        styleClasses: ['date', ...this.overdue ? ['overdue'] : []],
                        text: this.dueTimeDisplayed
                    }).build(),
                    // Only add the description if it exists.
                    ... this.hasDescription ? [
                        new ElementBuilder({
                            tag: 'div',
                            styleClasses: ['description'],
                            children: [this.description.render()]
                        }).build()
                    ] : []
                ]
            }).build()
        ];
    }
}