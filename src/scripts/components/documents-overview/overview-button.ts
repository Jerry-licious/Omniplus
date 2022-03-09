// Adds a document overview button to the topleft section on Lea.
import {ElementBuilder} from '../dom-builder';

export function injectDocumentsOverviewButtonToLea() {
    // .SousMenuItemMesClasses are the menu options under the Lea menu to the left.
    const summaryAnchorContainer = Array.from(document.querySelectorAll('.SousMenuItemMesClasses'))
        // There are 19 of them without special identifiable features apart from their text content.
        .find((element) => element.textContent == 'Summary of documents' || element.textContent == 'Sommaire des enseignants');

    // Potential fix for the teacher version of the website where the summary may not be present.
    if (summaryAnchorContainer) {
        // That element is only not present when the user is already on the overview page, so redirecting back to
        // the current page will do the job.
        const overviewLink = summaryAnchorContainer ?
            (<HTMLAnchorElement>summaryAnchorContainer.firstElementChild).href : window.location.href;

        // All the buttons are contained in this element.
        const buttonsContainer = document.querySelector('#region-raccourcis-services-skytech');
        buttonsContainer.insertBefore(
            new ElementBuilder('a')
                // Mirror the style of the Lea button.
                .withStyleClasses('raccourci', 'id-service_CVIP', 'code-groupe_lea', 'documents-overview-icon-parent')
                .withAttribute('href', overviewLink)
                .withAttribute('title', 'Documents Overview')
                .withChildren(
                    new ElementBuilder('div')
                        // Mirror the style of the Lea button, but with the material icons class added.
                        .withStyleClasses('svg-icon', 'material-icons')
                        // Documents icon name
                        .withText('description')
                        .build(),
                    new ElementBuilder('div')
                        .withStyleClasses('titre')
                        .withText('Docs')
                        .build()
                )
                .build(),
            // The last child is the MIO button, put the overview before the MIO button so it's together with Lea.
            buttonsContainer.lastElementChild);
    }
}