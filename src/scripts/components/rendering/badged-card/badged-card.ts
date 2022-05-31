import {ElementBuilder} from '../element-builder';
import {Badge} from './badge';

// Easier way of building badged cards that collapse some boilerplate code.
export class BadgedCard extends ElementBuilder {
    constructor({styleClasses = [], content, badges} : {
        styleClasses?: string[],
        content: Element[],
        badges: Badge[]
    }) {
        super({
            tag: 'div',
            styleClasses: ['badged-card', ...styleClasses],
            children: [
                new ElementBuilder({
                    tag: 'div',
                    styleClasses: ['badge-holder'],
                    children: badges.map((badge) => badge.build())
                }).build(),
                new ElementBuilder({
                    tag: 'div',
                    styleClasses: ['card'],
                    children: content
                }).build()
            ]
        });
    }
}