// Removes the header image on Omnivox to free up more space.
export function removeHeaderImage() {
    const headerImageElement = document.querySelector('#headerImage');
    if (headerImageElement) {
        // Set its height to 0.
        (<HTMLElement> headerImageElement).style.height = '0';
    }
}

// Removes all line break elements that extend the size of the page for no reason.
export function removeAllLineBreaks() {
    Array.from(document.querySelectorAll('br'))
        .forEach((element) => element.parentElement.removeChild(element));
}

// Certain Lea pages have an unnecessary print version button.
export function removePrinterFriendlyButton() {
    const printerFriendlyButton = document.querySelector('.td-liens');
    if (printerFriendlyButton) {
        (<HTMLElement>printerFriendlyButton).style.display = 'none';
    }
}