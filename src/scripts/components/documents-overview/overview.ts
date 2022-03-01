import {ElementBuilder} from '../dom-builder';
import {Renderable} from '../renderable';
import {LeaDocumentsContainer} from './container';
import {OverviewRenderInfo} from './render-info';
import {removePrinterFriendlyButton} from '../page-patcher';

export class LeaDocumentsOverview extends Renderable<OverviewRenderInfo> {
    container: LeaDocumentsContainer;

    constructor(documentsContainer: LeaDocumentsContainer) {
        super('div', 'omniplus-documents-overview', 'omniplus-lea-container');

        this.container = documentsContainer;
    }

    // Injects the container into the document overview page.
    injectToDocumentOverviewPage() {
        // The printer friendly version button blocks the view, not sure why it's there, why it exists, or what's
        // the purpose of printing out an overview like that.
        removePrinterFriendlyButton();

        // Fetch the original container of the overview table.
        const overviewContainer = document.querySelector('.cvirContenuCVIR');

        // Get rid of the centre align.
        overviewContainer.removeAttribute('align');

        // Clear everything off.
        while (overviewContainer.hasChildNodes()) {
            overviewContainer.removeChild(overviewContainer.firstChild);
        }

        overviewContainer.appendChild(this.domElement);
    }

    updateDomElement() {
        this.domElement.append(
            new ElementBuilder('div')
                .withStyleClasses('control-bar')
                .withChildren(
                    new ElementBuilder('input')
                        .withStyleClasses('search-bar')
                        .withAttribute('type', 'text')
                        .withAttribute('placeholder', 'Search')
                        .withEventListener('input', (event) => {
                            // Call for a rerender on the container whenever the input changes.
                            // (because the inputs do not need to be rebuilt.)
                            this.container.render(new OverviewRenderInfo((<HTMLInputElement>event.target).value));
                        })
                        .build(),
                    // Using an anchor so the element unfocuses after the mouse button has been lifted.
                    // Otherwise the focused style will remain active.
                    new ElementBuilder('a')
                        .withStyleClasses('button')
                        .withText('Mark All as Read')
                        // Add a href so the focus can apply.
                        .withAttribute('href', '#')
                        .withEventListener('click', (event) => {
                            this.container.markAllDocumentsAsRead();
                            // Call a rerender.
                            this.container.render(new OverviewRenderInfo(
                                // The button and the input share a common parent.
                                (<HTMLInputElement>(<HTMLElement>event.target).parentElement.firstElementChild).value));
                            // Unfocus after the click has been processed.
                            (<HTMLElement>event.target).blur();
                        })
                        .build()
                ).build(),
            this.container.render(new OverviewRenderInfo(""))
        )
    }
}