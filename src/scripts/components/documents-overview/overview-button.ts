// Adds a document overview button to the topleft section on Lea.
import {ElementBuilder} from '../rendering/element-builder';

export function injectDocumentsOverviewButtonToLea() {
    // The link to the overview page is stored in the element with the id lienDDLE.
    const summaryAnchor = document.querySelector('#lienDDLE');

    // Potential fix for the teacher version of the website where the summary may not be present.
    if (summaryAnchor) {
        const overviewLink = (<HTMLAnchorElement>summaryAnchor).href;

        // All the buttons are contained in this element.
        const buttonsContainer = document.querySelector('#region-raccourcis-services-skytech');
        buttonsContainer.insertBefore(
            new ElementBuilder({
                tag: 'a',
                // Mirror the style of the Lea button.
                styleClasses: ['raccourci', 'id-service_CVIP', 'code-groupe_lea', 'documents-overview-icon-parent'],
                href: overviewLink,
                title: 'Documents Overview',
                children: [
                    new ElementBuilder({
                        tag: 'div',
                        // Mirror the style of the Lea button, but with the material icons class added.
                        styleClasses: ['svg-icon', 'material-icons'],
                        // Documents icon name
                        text: 'description'
                    }).build(),
                    new ElementBuilder({
                        tag: 'div',
                        styleClasses: ['titre'],
                        text: 'Docs'
                    }).build()
                ]
            }).build(),
            // The last child is the MIO button, put the overview before the MIO button so it's together with Lea.
            buttonsContainer.lastElementChild);
    }
}