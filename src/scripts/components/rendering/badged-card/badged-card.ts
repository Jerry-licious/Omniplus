import {ElementBuilder} from '../element-builder';
import {Badge} from './badge';
import {Renderable} from '../renderable';

// Easier way of building badged cards that collapse some boilerplate code.
// Instead of building the full element through updateDomElement, inheritors of this class will implement
// buildBadges and buildContent instead to provide the mutable parts of the card.
export abstract class BadgedCard<T> extends Renderable<T> {
    protected constructor({styleClasses = []} : { styleClasses?: string[] }) {
        super('div', 'badged-card', ...styleClasses);
    }

    // Returns the badges on the card.
    abstract buildBadges(renderInfo?: T): Badge[];
    // Returns the content elements inside the card.
    abstract buildContent(renderInfo?: T): Element[];

    updateDomElement(renderInfo?: T) {
        this.domElement.append(
            new ElementBuilder({
                tag: 'div',
                styleClasses: ['badge-holder'],
                children: this.buildBadges(renderInfo).map((badge) => badge.build())
            }).build(),
            new ElementBuilder({
                tag: 'div',
                styleClasses: ['card'],
                children: this.buildContent(renderInfo)
            }).build()
        )
    }
}