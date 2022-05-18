import {Assessment} from './assessment';
import {extractCourseCodeAndNameFromCourseTitle, formatGrade} from '../../util/util';
import {Renderable} from '../rendering/renderable';
import {ElementBuilder} from '../rendering/element-builder';
import {GradeProgressionGraph} from './grade-progression-graph';

export class CourseGradesList extends Renderable<null> {
    // Basic information about the course.
    courseName: string;
    courseCode: string;

    // List of assessments in the course.
    assessments: Assessment[];
    // All grades are in decimals (from 0 to 1) instead of percentage.
    currentGrade: number;
    classAverage?: number;
    classMedian?: number;
    standardDeviation?: number;

    gradeProgressionGraph: GradeProgressionGraph;

    constructor(name: string, code: string, assessments: Assessment[], grade: number,
                average: number, median: number, standardDeviation: number, graph: GradeProgressionGraph) {
        super('div', 'card', 'course-grades-list');

        this.courseName = name;
        this.courseCode = code;
        this.assessments = assessments;
        this.currentGrade = grade;
        this.classAverage = average;
        this.classMedian = median;
        this.standardDeviation = standardDeviation;
        this.gradeProgressionGraph = graph;
    }

    // Gives the grade/value, in decimal of an element that has a percentage representation of a grade.
    static extractDecimalFromOverviewPercentageElement(element: Element): number {
        return parseFloat(
            // Convert it into an HTML element to extract its inner text.
            (<HTMLElement>element).innerText
                // Some elements have extra spaces/line breaks before/after the grade percentage.
                .trim()
                // Remove the percentage sign
                .replace('%', ''))
            // Divide by 100 to convert the number into decimal.
            / 100;
    }

    static loadFromCourseAssessmentsPage(page: Document): CourseGradesList {
        // The course name and code is stored in an element with the class centrePageLea, which has the following
        // structure:
        // span.centrePageLea
        //   span.titrePageLea "Detailed marks per assessment"
        //   span [Course Title]

        // Extract title by excluding the class titrePageLea:
        const courseCodeAndName = extractCourseCodeAndNameFromCourseTitle((<HTMLElement>
            page.querySelector('.centerPageLea span span:not(.titrePageLea)')).innerText);
        const courseCode = courseCodeAndName[0];
        const courseName = courseCodeAndName[1];

        // The student's and the class's average, median, and standard deviation grades are stored in a table with
        // the class tb-sommaire, which has the following structure:
        // table.tb-sommaire > tbody
        //   tr "Grade Summary"
        //   tr
        //     td (filler)
        //     td "Current Grade"
        //     td > font > b
        //       "Current Grade/Total"
        //       font [Current Grade]%
        //   tr > td
        //     font "Class Statistics"
        //     table > tbody
        //       Note: some professors may choose to not display the median and standard deviation, or to not
        //       display data related to the class average entirely, meaning that all the tr elements listed
        //       below are optional. However, no matter their decision, they are always presented in the order of
        //       average, median, and standard deviation.
        //       tr
        //         td (filler)
        //         td > font > "Class average:"
        //         td > font > [Class Average]%
        //       tr
        //         td > font > "Median:"
        //         td > font > [Median]%
        //       tr
        //         td > font > "Standard deviation:"
        //         td > font > [Standard Deviation]%

        // To extract the student's current grade, we can take advantage of the fact that it is the only element
        // within the table that is inside a font that is inside a font:
        const currentGrade = this.extractDecimalFromOverviewPercentageElement(page.querySelector('.tb-sommaire font font'))

        // To extract the class numbers (average, median, deviation), use the fact that they are in a separate
        // table, and are all the last elements of their parent.
        // Convert it to an array for easier access.
        const classStatistics = Array.from(page.querySelectorAll('.tb-sommaire table tr td:last-child font'));
        // The first number in the class statistics is always the class average.
        const classAverage = classStatistics.length > 0 ? this.extractDecimalFromOverviewPercentageElement(classStatistics[0]) : undefined;
        // The second is always the median.
        const classMedian = classStatistics.length > 1 ? this.extractDecimalFromOverviewPercentageElement(classStatistics[1]) : undefined;
        // The third is always the standard deviation.
        const standardDeviation = classStatistics.length > 2 ? this.extractDecimalFromOverviewPercentageElement(classStatistics[2]) : undefined;

        // Load in the assessments. Reverse the order to show the newest first.
        const assessments = Assessment.loadAllAssessmentsFromCourseAssessmentPage(page).reverse();

        // Put the ones that have been evaluated and counted on the top.
        assessments.sort((a, b) => {
            // First show assessments that have personal grades.
            if (a.hasGrade != b.hasGrade) {
                return (b.hasGrade ? 1 : 0) - (a.hasGrade ? 1 : 0)
            }
            // Then show assessments that are being counted.
            if (a.counted != b.counted) {
                return (b.counted ? 1 : 0) - (a.counted ? 1 : 0);
            }
            return 0;
        });

        // Load in the grades graph.
        const graph = GradeProgressionGraph.loadFromCourseAssessmentsPage(page);

        return new CourseGradesList(courseName, courseCode, assessments, currentGrade,
            classAverage, classMedian, standardDeviation, graph);
    }

    get hasAssessments(): boolean {
        return this.assessments.length > 0;
    }

    get hasAverage(): boolean {
        return this.classAverage != undefined;
    }

    get hasMedian(): boolean {
        return this.classMedian != undefined;
    }

    get hasStandardDeviation(): boolean {
        return this.standardDeviation != undefined;
    }

    get hasZScore(): boolean {
        return this.hasAverage && this.hasStandardDeviation;
    }
    get zScore(): number {
        return (this.currentGrade - this.classAverage) / this.standardDeviation;
    }

    updateDomElement(): void {
        this.domElement.append(
            new ElementBuilder({
                tag: 'div',
                styleClasses: ['title-bar'],
                children: [
                    new ElementBuilder({
                        tag: 'div',
                        styleClasses: ['course-name'],
                        text: this.courseName
                    }).build(),
                    new ElementBuilder({
                        tag: 'div',
                        styleClasses: ['course-grade'],
                        text: formatGrade(this.currentGrade, 0)
                    }).build()
                ]
            }).build(),
            // Render the graph if there is any data.
            ...this.gradeProgressionGraph.hasData ? [this.gradeProgressionGraph.render()] : [],
            // Render the class stats section if there is any data.
            ...(this.hasAverage && this.hasMedian && this.hasStandardDeviation) ? [
                // Divider
                new ElementBuilder({ tag: 'hr' }).build(),
                new ElementBuilder({
                    tag: 'table', styleClasses: ['class-stats'],
                    children: [
                        // Include the average if there is an average
                        ...this.hasAverage ? [new ElementBuilder({
                            tag: 'tr',
                            children: [
                                new ElementBuilder({
                                    tag: 'td', text: 'Class Average'
                                }).build(),
                                new ElementBuilder({
                                    tag: 'td', text: formatGrade(this.classAverage, 1)
                                }).build()
                            ]
                        }).build()] : [],
                        // Include the median if there is a median
                        ...this.hasMedian ? [new ElementBuilder({
                            tag: 'tr',
                            children: [
                                new ElementBuilder({
                                    tag: 'td', text: 'Median'
                                }).build(),
                                new ElementBuilder({
                                    tag: 'td', text: formatGrade(this.classMedian, 0)
                                }).build()
                            ]
                        }).build()] : [],
                        // Include the standard deviation if there is a standard deviation
                        ...this.hasStandardDeviation ? [new ElementBuilder({
                            tag: 'tr',
                            children: [
                                new ElementBuilder({
                                    tag: 'td', text: 'Standard Deviation'
                                }).build(),
                                new ElementBuilder({
                                    tag: 'td', text: formatGrade(this.standardDeviation, 1)
                                }).build()
                            ]
                        }).build()] : [],
                        // Include the z-score deviation if it can be calculated
                        ...this.hasZScore ? [new ElementBuilder({
                            tag: 'tr',
                            children: [
                                new ElementBuilder({
                                    tag: 'td', text: 'Z-Score'
                                }).build(),
                                new ElementBuilder({
                                    tag: 'td', text: this.zScore.toFixed(2)
                                }).build()
                            ]
                        }).build()] : []
                    ]
                }).build()
            ] : [],
            // Render the assessment table section if there are any assessments.
            ...this.hasAssessments ? [
                // Divider
                new ElementBuilder({ tag: 'hr' }).build(),
                new ElementBuilder({
                    tag: 'table', styleClasses: ['assessments-list'],
                    children: [
                        new ElementBuilder({
                            tag: 'tr',
                            children: [
                                new ElementBuilder({ tag: 'th', text: 'Assessment'} ).build(),
                                new ElementBuilder({ tag: 'th', text: 'Grade'} ).build(),
                                new ElementBuilder({ tag: 'th', text: 'Average'} ).build(),
                                new ElementBuilder({ tag: 'th', text: 'Weight'} ).build()
                            ]
                        }).build(),
                        ...this.assessments.map((assessment) => assessment.render())
                    ]
                }).build()
            ] : []
        );
    }
}