export class ElementBuilder {
    tag: string;
    styleClasses: string[] = [];
    children: HTMLElement[] = [];
    text: string = "";
    attributes: Map<string, string> = new Map<string, string>();
    styleRules: Map<string, string> = new Map<string, string>();
    eventListeners: Map<string, EventListener> = new Map<string, EventListener>();

    innerHTML: string;

    constructor(tag: string) {
        this.tag = tag;
    }

    withStyleClasses(...classes: string[]): ElementBuilder {
        classes.forEach((styleClass) => this.styleClasses.push(styleClass));
        return this;
    }

    withChildren(...children: HTMLElement[]): ElementBuilder {
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

    withInnerHTML(html: string): ElementBuilder {
        this.innerHTML = html;
        return this;
    }

    build(): HTMLElement {
        const element = document.createElement(this.tag);
        this.styleClasses.forEach((styleClass) => element.classList.add(styleClass));
        this.children.forEach((child) => element.appendChild(child));

        if (this.innerHTML) {
            element.innerHTML = this.innerHTML;
        }

        if (this.text.length > 0) {
            element.appendChild(document.createTextNode(this.text));
        }

        this.attributes.forEach((value: string, attribute: string) => element.setAttribute(attribute, value));
        this.styleRules.forEach((value: string, rule: string) => element.style.setProperty(rule, value));

        this.eventListeners.forEach((listener, event) => element.addEventListener(event, listener))

        return element;
    }
}