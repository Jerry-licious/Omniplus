import {LeaDocumentsOverview} from './components/documents-overview/overview';
import {LeaDocumentsContainer} from './components/documents-overview/container';
import {injectOmniplusLogo} from './components/logo-patcher';
import {injectDocumentsOverviewButtonToLea} from './components/documents-overview/overview-button';
import {
    autoLogin,
    removeAllLineBreaks,
    removeHeaderImage,
    removeLeaAnchorHoverCSSRule
} from './components/page-patcher';
import {ForumSubject} from './components/forum-page/forum-subject';
import {LeaGradesOverview} from './components/grades-overview/grades-overview';
import {LeaAssignmentOverview} from './components/assignments/assignment-overview';

require('./omniplus.css');

removeHeaderImage();
injectOmniplusLogo();


// If the script is being run on Lea.
if (window.location.href.includes('ovx.omnivox.ca')) {
    injectDocumentsOverviewButtonToLea();
    removeLeaAnchorHoverCSSRule();

    // If the script is being run on the document overview page.
    if (window.location.href.includes('SommaireDocuments.aspx')) {
        removeAllLineBreaks();

        const overview = new LeaDocumentsOverview(LeaDocumentsContainer.loadFromDocumentOverviewPage(document));
        overview.injectToDocumentOverviewPage();
        overview.render();
    }

    // If the script is being run on the class forum.
    if (window.location.href.includes('ForumClasse.aspx')) {
        // If this is a forum subject page.
        if (window.location.href.includes('a=msg')) {
            const subject = ForumSubject.loadFromForumPostPage(document);
            subject.injectToForumSubjectPage();
            subject.render();
        }
    }

    // If the script is being run on the grades overview page.
    if (window.location.href.includes('ListeEvalCVIR.ovx') &&
        window.location.href.includes('SOMMAIREEVAL')) {
        removeAllLineBreaks();

        const overview = LeaGradesOverview.loadFromGradesOverviewPage(document);
        overview.injectToGradesOverviewPage();
        overview.render();
    }

    if (window.location.href.includes('SommaireTravaux.aspx')) {
        removeAllLineBreaks();

        const overview = LeaAssignmentOverview.loadAllAssignmentsFromAssignmentsSummaryPage(document);
        overview.injectToAssignmentsOverviewPage();
        overview.render();
    }
}
// If the script is being run on Omnivox/MIO
else {
    // If this is the login page.
    if (window.location.href.includes('Login')) {
        autoLogin();
    }
}