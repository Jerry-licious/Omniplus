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