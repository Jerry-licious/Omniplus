import {ElementBuilder} from '../element-builder';

// Quick class to build badges that incorporates some shared properties to make badge building easier.
export class Badge extends ElementBuilder {
    constructor({ clickable = true, newTab = false, icon, styleClasses = [], href = '#', title = '', onclick }: {
        // ID of the icon in Material Icons.
        icon: string,
        clickable?: boolean,
        // Whether the href will open a new tab with its link.
        newTab?: boolean,
        styleClasses?: string[],
        href?: string,
        title?: string,
        onclick?: EventListener
    }) {
        super({
            // Use an anchor if it's clickable so the cursor changes based on the badge's behaviour.
            tag: clickable ? 'a' : 'div',
            styleClasses: ['badge', 'material-icons', ...styleClasses],
            text: icon,
            href, title,
            onclick: clickable ? (e) => {
                onclick(e);
                // Unfocus after the click has been processed.
                (<HTMLAnchorElement>e.target).blur();
            } : null
        });

        if (newTab) {
            // Target a new page if this badge opens a new tab.
            this.withAttribute('target', '_blank');
        }
    }
}