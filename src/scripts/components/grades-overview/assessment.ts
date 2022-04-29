// Represents an assessment on Lea.
export class Assessment {
    name: string;
    // All number are in decimals (0-1) and *not* in percentage.
    weight: number;
    // Whether the assessment counts towards the course average.
    counted: boolean;
    grade?: number;
    average?: number;

    constructor(name: string, weight: number, counted: boolean, mark?: number, average?: number) {
        this.name = name;
        this.weight = weight;
        this.counted = counted;
        this.grade = mark;
        this.average = average;
    }

    // Extracts a grade represented on Lea as a ratio.
    static extractGrade(gradeText: string): number {
        // Grades have the following format: (grade/total)
        // Start by removing the parentheses.
        const gradeAndTotal = gradeText.substring(1, gradeText.length - 1)
            // Then split by slash to break them apart
            .split('/')
            // And parse them into numbers.
            .map((str) => parseFloat(str));

        // Simply divide them to get the ratio.
        return gradeAndTotal[0] / gradeAndTotal[1];
    }

    // Loads an assessment from its corresponding table row.
    static fromElement(element: HTMLTableRowElement): Assessment {
        // A row that contains the grades has the following hierarchy
        // tr[bg-colour = eeeeee]
        //   td
        //   td.td-nombre
        //   td
        //     font<assessment name>
        //     br font<This grade will be dropped> (only added if this grade is being dropped)
        //   td
        //     font<(personal grade/total)> OR font< - > if there's no grade
        //     br
        //     font<grade%>
        //   td
        //     font<average grade/total> OR font< - > if there's no average
        //   td
        //     font<weight%>
        //     font(weighted grade/total weight)

        // To obtain the information we need, we have to extract the 3rd to the 6th element of the row.
        const nameElement = <HTMLElement>element.childNodes.item(2);
        const name = (<HTMLElement>nameElement.firstElementChild).innerText;

        // If the grade is being dropped, there will be more elements in the name element that indicate that the
        // grade has been dropped.
        const counted = !(nameElement.childElementCount > 1);

        const gradeElement = <HTMLElement>element.childNodes.item(3);
        // If there is a grade, there will be more than one element specifying the grade marking and the percent grade.
        const grade = gradeElement.childNodes.length > 1 ?
            Assessment.extractGrade((<HTMLElement>gradeElement.firstElementChild).innerText) : undefined;

        // If there is an average, there will be more than one element specifying them.
        const averageElement = <HTMLElement>element.childNodes.item(4);
        const average = averageElement.childNodes.length > 1 ?
            Assessment.extractGrade((<HTMLElement>averageElement.firstElementChild).innerText) : undefined;

        const weightElement = <HTMLElement>element.childNodes.item(5);
        // The weight is displayed first in percentage "Weight%" alongside with the weighted vs. actual grade.
        // Extract the percentage from the first element, remove the percentage, and divide it by 100 to get the
        // actual ratio.
        const weight = parseFloat((<HTMLElement>weightElement.firstElementChild).innerText.replace('%', '')) / 100;

        return new Assessment(name, weight, counted, grade, average);
    }

    // Loads all assessments from a course assessments page.
    static loadFromCourseAssessmentsPage(page: Document): Assessment[] {
        // All grades are stored in a table with the class .table-notes.
        // Using the bgcolor requirement to select only ones that can contain grade.
        return Array.from(page.querySelectorAll(`.table-notes tr[bgcolor="#EEEEEE"]`))
            // However, some of these are empty and function as padding for some reason, so a second filter needs to
            // be applied. These padding rows have two children that fill out the row, so checking for more than 2
            // children should do the job.
            .filter((tr) => tr.childElementCount > 2)
            .map((tr) => Assessment.fromElement(<HTMLTableRowElement>tr));
    }

    get hasGrade(): boolean {
        return this.grade != undefined;
    }
    get hasAverage(): boolean {
        return this.average != undefined;
    }
}