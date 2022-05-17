// Represents an objected that can be rendered on a DOM element.
// T represents the render information passed down to the object for it to adjust its rendering.
export abstract class Renderable<T> {
    // A DOM element is attached to the object so the whole tree does not need to be re-rendered or rebuilt when one
    // child element updates.
    domElement: Element;
    lastRenderInfo: T;

    constructor(tag: string, ...styleClasses: string[]) {
        this.domElement = document.createElement(tag);
        styleClasses.forEach((styleClass) => this.domElement.classList.add(styleClass));
    }

    protected clearDomElement(): void {
        while (this.domElement.hasChildNodes()) {
            this.domElement.removeChild(this.domElement.firstChild);
        }
    }

    // Updates the domElement based on the given information and returns it.
    render(renderInfo?: T): Element {
        this.lastRenderInfo = renderInfo;

        this.clearDomElement();
        this.updateDomElement(renderInfo);

        return this.domElement;
    }

    // Updates the domElement with the last render info.
    rerender() {
        this.render(this.lastRenderInfo);
    }

    // Updates the domElement based on the object's information. The domElement will be cleared before sending the
    // update.
    abstract updateDomElement(renderInfo?: T): void;
}