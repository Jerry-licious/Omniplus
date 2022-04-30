export class ElementBuilder {
    tag: string;
    styleClasses: string[];
    children: Node[];
    text: string;

    // Href and title are attributes that are used very often, so it is added to the constructor despitr having a
    // method to modify attributes directly.
    href: string;
    title: string;

    // Onclick is a listener that gets used very often, so it is added to the constructor despite having a method
    // to add event listeners.
    onclick: EventListener;

    attributes: Map<string, string> = new Map<string, string>();
    styleRules: Map<string, string> = new Map<string, string>();
    eventListeners: Map<string, EventListener> = new Map<string, EventListener>();

    constructor({ tag, styleClasses = [], children = [], text = '', href = '', title = '', onclick }: {
        tag: string,
        styleClasses?: string[],
        children?: Node[],
        text?: string,
        href?: string,
        title?: string,
        onclick?: EventListener
    }) {
        this.tag = tag;
        this.styleClasses = styleClasses;
        this.children = children;
        this.text = text;
        this.href = href;
        this.title = title;
        this.onclick = onclick;
    }

    withStyleClasses(...classes: string[]): ElementBuilder {
        classes.forEach((styleClass) => this.styleClasses.push(styleClass));
        return this;
    }

    withChildren(...children: Node[]): ElementBuilder {
        children.forEach((child) => this.children.push(child));
        return this;
    }

    withText(text: string): ElementBuilder {
        this.text = text;
        return this;
    }

    withAttribute(attribute: string, value: string): ElementBuilder {
        this.attributes.set(attribute, value);
        return this;
    }

    withEventListener(event: string, listener: EventListener): ElementBuilder {
        this.eventListeners.set(event, listener);
        return this;
    }

    withStyle(rule: string, value: string): ElementBuilder {
        this.styleRules.set(rule, value);
        return this;
    }

    build(): HTMLElement {
        const element = document.createElement(this.tag);
        this.styleClasses.forEach((styleClass) => element.classList.add(styleClass));
        this.children.forEach((child) => element.appendChild(child));

        if (this.text) {
            element.appendChild(document.createTextNode(this.text));
        }
        if (this.href) {
            element.setAttribute('href', this.href);
        }
        if (this.title) {
            element.setAttribute('title', this.title);
        }
        if (this.onclick) {
            element.addEventListener('click', this.onclick);
        }

        this.attributes.forEach((value: string, attribute: string) => element.setAttribute(attribute, value));
        this.styleRules.forEach((value: string, rule: string) => element.style.setProperty(rule, value));

        this.eventListeners.forEach((listener, event) => element.addEventListener(event, listener))

        return element;
    }
}