import {extractCourseCodeAndNameFromCourseTitle, getMonthIndexFromName} from '../../util/util';

export class Assignment {
    name: string;
    courseName: string;
    // Apparently assignments don't have to have descriptions. Making this one nullable too.
    description?: string;
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

    constructor(name: string, courseName: string, dueTime: Date, popupLink: string, description?: string,
                instructionLink?: string, submissionLink?: string, correctionLink?: string) {
        this.name = name;
        this.courseName = courseName;
        this.description = description;
        this.dueTime = dueTime;
        this.popupLink = popupLink;
        this.instructionLink = instructionLink;
        this.submissionLink = submissionLink;
        this.correctionLink = correctionLink;
    }

    static loadFromAssignmentPopup(popupLink: string, page: Document): Assignment {
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
        const description = descriptionElement ? (<HTMLElement>descriptionElement).innerText : null;

        // The instructions are linked to the element with the id #AlienFichierLie2.
        const instructionElementHref = (<HTMLAnchorElement>page.querySelector('#ALienFichierLie2')).href
        // If no instruction is attached, the href will be empty.
        const instructionLink = instructionElementHref.length > 0 ? instructionElementHref : null;

        // The due date of the assignment is stored in the element with the id #lblDateRemise.
        const {dueTime, timeSpecified} = this.extractDueDate((<HTMLElement>page.querySelector('#lblDateRemise')).innerText);

        // The anchor element that links to the latest submission shares neighbouring parents with an element with
        // the id #lblEnteteRemise. The label is always present, but the anchor isn't.
        const submissionAnchor = page.querySelector('#lblEnteteRemise').parentElement.nextElementSibling.querySelector('a');
        // The anchor will be null if it doesn't exist, use this to check if something has been submitted.
        const submissionLink = submissionAnchor ? submissionAnchor.href : null;

        // The anchor that links to the corrected copy shares a parent with an element with the id
        // #lblEnteteCopieCorrigee. The label is only present if the anchor is also present.
        const correctionLabel = page.querySelector('#lblEnteteCopieCorrigee');
        // The label will be an indicator of whether the assignment has been corrected, it will be null if it
        // doesn't exist.
        const correctionLink = correctionLabel ? correctionLabel.parentElement.querySelector('a').href : null;

        return new Assignment(name, courseName, dueTime, popupLink, description, instructionLink, submissionLink, correctionLink);
    }

    static extractDueDate(dueDateString: string): { dueTime: Date, timeSpecified: boolean } {
        // Due times have the following format:
        // <Day of the Week> <Month> <Day> <Year> [at] [hour:minute]
        // Where the time of the day can be entirely optional.
        const splits = dueDateString.split('at');
        // If the time is specified, the "at" will be present and the split will have 2 pieces.
        const timeSpecified = splits.length > 1;
        // Decompose the array to obtain the two parts and remove the spaces.
        const [dateString, timeString] = splits.map((str) => str.trim());

        // Split by spaces to decompose the date.
        const [_weekday, monthName, dayString, yearString] = dateString.split(' ');
        const monthIndex = getMonthIndexFromName(monthName);
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
}