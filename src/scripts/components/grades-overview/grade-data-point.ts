// Represents a data point on the grade graph.
import {getMonthFromShortened} from '../../util/util';
import {GradeProgressionGraph} from './grade-progression-graph';

export class GradeDataPoint {
    // The grade of the student/average at this point in time, in decimal instead of percentage.
    grade: number;
    // The cumulated portion of the final grade that the student/group has obtained, in decimal instead of percentage.
    cumulatedPortionOfFinalGrade: number;
    // The date when this data point is released.
    releaseDate: Date;

    constructor(grade: number, cumulatedPortionOfFinalGrade: number, releaseDate: Date) {
        this.grade = grade;
        this.cumulatedPortionOfFinalGrade = cumulatedPortionOfFinalGrade;
        this.releaseDate = releaseDate;
    }

    // Loads a data point from its corresponding label on the grade chart.
    static fromDataPointLabel(label: HTMLDivElement): GradeDataPoint {
        // The label is structured as follows:
        // div.evo
        //   "Your average: <Percentage>%"
        //   <br/>
        //   "Cumulated percentage of the final grade: <Percentage>%"
        //   <br/>
        //   "Update: <3 Letter Month>-<Day>, <Year>"
        // Where the text in quotations are text nodes.

        // Extract the information by filtering for text nodes and extracting their
        const [gradeLine, cumulatedLine, dateLine] = Array.from(label.childNodes).filter((node) => node instanceof Text)
            .map((textNode) => (<Text>textNode).nodeValue);

        // The first line contains the grade, present as the last word in the string.
        // Split the line with spaces, select the last element, and remove the percentage sign, then divide by 100
        // to convert it into decimal.
        const grade = parseFloat(gradeLine.split(' ').pop().replace('%', '')) / 100;
        // The same rule applies to the cumulated portion of the grade on the second line.
        const cumulatedPortionOfFinalGrade = parseFloat(cumulatedLine.split(' ').pop().replace('%', '')) / 100;

        // To extract the date, split the third line by space and skip the first element.
        const [monthDayString, yearString] = dateLine.split(' ').slice(1);
        // Remove the comma and split by dash to extract the raw month and day.
        const [monthString, dayString] = monthDayString.replace(',', '').split('-');
        // Extract the full date.
        const date = new Date(parseInt(yearString), getMonthFromShortened(monthString), parseInt(dayString));

        return new GradeDataPoint(grade, cumulatedPortionOfFinalGrade, date);
    }

    // Get the position of this data point on the grade progression graph.
    get positionInGraph() {
        return GradeProgressionGraph.convertCoordinateToGraphCoordinate({
            x: this.cumulatedPortionOfFinalGrade,
            y: this.grade
        });
    }
}