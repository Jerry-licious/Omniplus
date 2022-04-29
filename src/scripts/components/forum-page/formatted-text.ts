import {FontType} from './font-type';
import {ElementBuilder} from '../rendering/dom-builder';

// List of fonts supported by Omnivox Forum Posts:
// Sans Serif fonts: Arial, MS Sans Serif, Segoe UI, Tahoma, Verdana
// Serif fonts: Garamond, Georgia, Times New Roman
// Monospace: Courier New
// Though there are subtle differences between the fonts, we will be using variants of Roboto for all of
// them for the sake of consistency.
const sansSerifTypefaces = ['Arial', 'MS Sans Serif', 'Segoe UI', 'Tahoma', 'Verdana'];
const serifTypefaces = ['Garamond', 'Georgia', 'Times New Roman'];
const monospaceTypefaces = ['Courier New'];

export class FormattedText {
    isTextNode: boolean = false;
    // Element Tag
    tag?: string;
    // Text content (if this is a text node).
    content?: string;
    // Typeface category.
    fontType?: FontType;
    // Text decoration declared in CSS that cannot be included in the tag.
    additionalTextDecoration?: string;

    children: FormattedText[] = [];

    constructor(isTextNode: boolean, tag?: string, content?: string, fontType?: FontType, additionalDecoration?: string, children?: FormattedText[]) {
        this.isTextNode = isTextNode;
        this.tag = tag;
        this.content = content;
        this.fontType = fontType;
        this.additionalTextDecoration = additionalDecoration;
        this.children = children;
    }

    static textNode(content: string) {
        return new FormattedText(true, null, content);
    }

    static element(tag: string, fontType: FontType, additionalDecoration: string, children: FormattedText[]) {
        return new FormattedText(false, tag, null, fontType, additionalDecoration, children);
    }

    // Extracts text formatting from the formatted text.
    static fromContentNode(node: Node) {
        // If this is an element.
        if (node instanceof HTMLElement) {
            // Copy the tag.
            let tag = node.tagName.toLowerCase();

            const elementStyle = getComputedStyle(node);

            // CSS font rules are complex and differ in different browsers, using if contains for the best
            // compatibility.

            const fontFamilyCSSRule = elementStyle.getPropertyValue('font-family');
            let fontType = FontType.SansSerif;
            if (sansSerifTypefaces.some((typeface) => fontFamilyCSSRule.includes(typeface))) {
                fontType = FontType.SansSerif;
            } else if (serifTypefaces.some((typeface) => fontFamilyCSSRule.includes(typeface))) {
                fontType = FontType.Serif;
            } else {
                fontType = FontType.Monospace;
            }

            // Copy any special text decorations.
            const additionalTextDecoration = elementStyle.getPropertyValue('text-decoration');

            const children: FormattedText[] = [];
            // Dotted borders means that the element is a quote, which means that it should be organised differently
            // from the rest.
            if (elementStyle.getPropertyValue('border-style').includes('dotted')) {
                // Use the block quote tag instead when the message is a quote.
                tag = 'blockquote';

                // The author's name is contained in the first div element in the dotted container with an image.
                // Using innerText and trim to extract it.
                const authorSaidElement = node.querySelector('div');
                const authorSaid = authorSaidElement.innerText.trim();

                // Since the author name is getting special treatment, remove it so it doesn't get counted twice.
                node.removeChild(authorSaidElement);

                children.push(FormattedText.element('div', FontType.SansSerif, '', [
                    FormattedText.element('strong', FontType.SansSerif, '', [
                        FormattedText.textNode(authorSaid)
                    ])
                ]));
            }

            // And copy all the node's children.
            Array.from(node.childNodes).forEach((node) => children.push(FormattedText.fromContentNode(node)));

            return FormattedText.element(tag, fontType, additionalTextDecoration, children);
        }
        // If this is a text node.
        else {
            return FormattedText.textNode((<Text>node).nodeValue);
        }
    }

    // Returns the corresponding Roboto family based on the font category.
    get fontFamily(): string {
        switch (this.fontType) {
            case FontType.SansSerif:
                return `'Roboto', 'Helvetica', sans-serif`;
            case FontType.Serif:
                return `'Roboto Slab', 'Times New Roman', serif`;
            case FontType.Monospace:
                return `'Roboto Mono', monospace`;
        }
    }

    render(): Node {
        if (this.isTextNode) {
            return document.createTextNode(this.content);
        } else {
            return new ElementBuilder(this.tag)
                .withStyle('font-family', this.fontFamily ? this.fontFamily : 'inherit')
                .withStyle('text-decoration', this.additionalTextDecoration ? this.additionalTextDecoration : 'inherit')
                .withChildren(...this.children.map((node) => node.render()))
                .build();
        }
    }
}