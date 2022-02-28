import {LeaDocumentsOverview} from './components/documents-overview/overview';
import {LeaDocumentsContainer} from './components/documents-overview/container';
import {injectOmniplusLogo} from './components/logo-patcher';
import {injectDocumentsOverviewButtonToLea} from './components/documents-overview/overview-button';
import {removeAllLineBreaks, removeHeaderImage} from './components/page-patcher';
import {ForumMessage} from './components/forum-page/forum-message';

require('./omniplus.css');

removeHeaderImage();
injectOmniplusLogo();

// @ts-ignore
window['ForumMessage'] = ForumMessage;

// If the script is being run on Lea.
if (window.location.href.includes('ovx.omnivox.ca')) {
    injectDocumentsOverviewButtonToLea();
}

// If the script is being run on the document overview page.
if (window.location.href.includes('SommaireDocuments.aspx')) {
    removeAllLineBreaks();

    const overview = new LeaDocumentsOverview(LeaDocumentsContainer.loadFromDocumentOverviewPage(document));
    overview.injectToDocumentOverviewPage();
    overview.render();
}
