// The root URL of Lea pages.
export const leaRoot = 'https://www-mpo-ovx.omnivox.ca/cvir/ddle/';

// Fetches and parses a components from the given url.
export function fetchDocumentFrom(url: string): Promise<Document> {
    return fetch(url).then((response) => response.text())
        .then((text) => new DOMParser().parseFromString(text, 'text/html'));
}

export function toTitleCase(text: string): string {
    return text.split(' ').map((word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()).join(' ')
}

// Escapes regular tex to regex expression.
export function regexEscape(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

const monthsShortened = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
// Returns the month from its shortened, 3-character representation.
export function getMonthFromShortened(month: string): number {
    return monthsShortened.indexOf(month);
}


const spaceRegex = new RegExp('\\s');

// Extracts the course code and name from the course title, with the following format:
// <Course Code> <Course Name> section/sect. <section number>
// Returns a tuple of (course code, course name)
export function extractCourseCodeAndNameFromCourseTitle(courseTitle: string): [string, string] {
    // To extract the course code and the name, split the title by 'section/sect.', pick the first part and then trim
    // off the extra space on the right.
    // Pre-split the course code and names, note that Omnivox sometimes uses non-breaking space instead of
    // regular space, hence the use of the \s regex.
    const courseCodeAndName = courseTitle.split(/section|sect\./g)[0].trim().split(spaceRegex);
    // The course code and name are separated by a space, the first element is the course code.
    const courseCode = courseCodeAndName[0];
    // Since course names may contain spaces, the rest of the elements make up the course.
    // Convert the whole thing from all caps to title case.
    const courseName = toTitleCase(courseCodeAndName.slice(1).join(' ')
        // The course name itself is structured as follows:
        // [Program] [-] <Course Name>
        // The program and the dash may not exist, but as an unfortunate Arts and Science student, it bothers me
        // that it blocks the course name.
        // Split the course name by '-', pick the last part and trim off the extra space on the left.
        .split('-')
        // Meaning to pick the last element here but since there's no implementation of it this will suffice.
        .reverse()[0].trim());

    return [courseCode, courseName];
}