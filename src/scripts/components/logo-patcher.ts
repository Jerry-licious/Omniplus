// 6-petaled Omnivox Flower
const omniplusLogoSource = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 34 34" style="enable-background:new 0 0 34 34;" xml:space="preserve">
<style type="text/css">
.flower{fill-rule:evenodd;clip-rule:evenodd;fill:#FC8D33;}
</style>
<path class="flower" d="M17,23.2c0.2,17.3,20.2,5.7,5.4-3.1c-0.1,0-0.2-0.1-0.3-0.2c0.1,0,0.2,0.1,0.3,0.1c15.1,8.4,15.1-14.7,0-6.2
\tl0,0l0,0c14.8-8.8-5.2-20.3-5.4-3c-0.2-17.3-20.2-5.7-5.4,3.1l0,0c-15.1-8.5-15.1,14.7,0,6.2l0,0C-3.3,29,16.8,40.5,17,23.2z
\t M11.7,17c0-0.9,0.2-1.8,0.6-2.5c0.9-1.6,2.6-2.8,4.6-2.8s3.7,1.1,4.6,2.8c0.4,0.7,0.6,1.6,0.6,2.5c0,0.5-0.1,1.1-0.2,1.6
\tc-0.7,2.2-2.7,3.7-5,3.7C14.1,22.3,11.7,19.9,11.7,17z"/>
</svg>`;

const domParser = new DOMParser();

function getOmniplusLogoElement(): HTMLElement {
    const xmlDocument = domParser.parseFromString(omniplusLogoSource, 'image/svg+xml');
    const svg = (<HTMLElement>xmlDocument.firstElementChild);

    // Set the svg to its correct size.
    // No need to touch the size because the element maintains its ratio.
    svg.style.width = '36px';

    return svg;
}

export function injectOmniplusLogo() {
    const omnivoxLogoContainer = document.querySelector('#headerOmnivoxLogo');
    if (omnivoxLogoContainer) {
        const originalLogo = omnivoxLogoContainer.querySelector('img');
        // Put the new logo before the original logo.
        omnivoxLogoContainer.insertBefore(getOmniplusLogoElement(), originalLogo);
        // Remove the original logo.
        omnivoxLogoContainer.removeChild(originalLogo);
    }
}