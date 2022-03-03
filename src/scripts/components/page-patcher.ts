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

// Lea's stylesheet makes all hovered <a> elements red. Remove the rule if it exists.
export function removeLeaAnchorHoverCSSRule() {
    for (const styleSheet of document.styleSheets) {
        for (let i = 0; i < styleSheet.cssRules.length; i++) {
            if (styleSheet.cssRules[i].cssText.includes('a:hover:not(.btn.waves-effect)')) {
                styleSheet.deleteRule(i);
            }
        }
    }
}

export function autoLogin() {
    const usernameElement = document.querySelector('#Identifiant');
    const passwordElement = document.querySelector('#Password');
    // If the elements exist and they have been filled.
    if (usernameElement && passwordElement) {
        const username = (<HTMLInputElement>usernameElement).value;
        const password = (<HTMLInputElement>passwordElement).value;
        if (username && password) {
            // Click the login button.
            (<HTMLButtonElement>document.querySelector('.btn.green')).click();
        }
    }
}