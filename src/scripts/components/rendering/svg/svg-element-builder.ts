import {ElementBuilder} from '../element-builder';

// Builder for elements in the SVG namespace, with helper methods for creating certain SVG elements quickly.
export class SVGElementBuilder extends ElementBuilder {
    constructor({ tag, styleClasses = [], children = [], text = '', href = '', title = '', onclick }: {
        tag: string,
        styleClasses?: string[],
        children?: Node[],
        text?: string,
        href?: string,
        title?: string,
        onclick?: EventListener
    }) {
        super({
            tag, namespace: 'http://www.w3.org/2000/svg',
            styleClasses, children, text, href, title, onclick
        });
    }

    static group({children, styleClasses = []}: {
        children: Element[],
        styleClasses?: string[]
    }) {
        return new SVGElementBuilder({ tag: 'g', children, styleClasses }).build();
    }

    static line({x1, y1, x2, y2, strokeWidth, styleClasses = []}: {
        x1: number, y1: number, x2: number, y2: number,
        strokeWidth: number, styleClasses?: string[]
    }): Element {
        const line = new SVGElementBuilder({
            tag: 'line',
            styleClasses
        }).build();

        line.setAttribute('x1', x1.toString());
        line.setAttribute('y1', y1.toString());
        line.setAttribute('x2', x2.toString());
        line.setAttribute('y2', y2.toString());

        line.setAttribute('stroke-width', strokeWidth.toString());

        return line;
    }

    static polyline({points, strokeWidth, styleClasses = []}: {
        points: {x: number, y: number}[],
        strokeWidth: number, styleClasses?: string[]
    }): Element {
        const line = new SVGElementBuilder({
            tag: 'polyline',
            styleClasses
        }).build();

        line.setAttribute('points', points.map((point) => `${point.x},${point.y}`).join(' '))
        line.setAttribute('stroke-width', strokeWidth.toString());

        return line;
    }

    static text({x, y, dx = '0', dy = '0', text, textAnchor = 'start', styleClasses = []}: {
        x: number, y: number, dx?: string, dy?: string,
        text: string, textAnchor?: string, styleClasses?: string[]
    }): Element {
        const textElement = new SVGElementBuilder({
            tag: 'text', text, styleClasses
        }).build();

        textElement.setAttribute('x', x.toString());
        textElement.setAttribute('y', y.toString());
        textElement.setAttribute('dx', dx);
        textElement.setAttribute('dy', dy);

        textElement.setAttribute('text-anchor', textAnchor);

        return textElement;
    }

    static circle({x, y, radius, styleClasses = []}: {
        x: number, y: number, radius: number, styleClasses?: string[]
    }): Element {
        const circle = new SVGElementBuilder({
            tag: 'circle', styleClasses
        }).build();

        circle.setAttribute('cx', x.toString());
        circle.setAttribute('cy', y.toString());
        circle.setAttribute('r', radius.toString());

        return circle;
    }
}