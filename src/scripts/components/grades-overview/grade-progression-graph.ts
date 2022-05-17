import {GradeDataPoint} from './grade-data-point';
import {SVGElementBuilder} from '../rendering/svg/svg-element-builder';
import {Renderable} from '../rendering/renderable';

// Represents a graph that shows the student's grades compared to the group's average. The detailed specifications
// of the graph can be seen in `src/grade-graph.svg`.

// Dimensions of the coordinates and of the graph.
const start = { x: 50, y: 50 };
const end = { x: 570, y: 450 };
const size = { x: end.x - start.x, y: end.y - start.y };

export class GradeProgressionGraph extends Renderable<null> {
    // The list of data points that represent the student's grade.
    individualDataPoints: GradeDataPoint[];
    // The list of data points that represent the class average.
    averageDataPoints: GradeDataPoint[];

    constructor(individualDataPoints: GradeDataPoint[], averageDataPoints: GradeDataPoint[]) {
        super('svg');

        // The SVG element has to be created with the SVG namespace, otherwise nothing shows up.
        this.domElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        this.individualDataPoints = individualDataPoints;
        this.averageDataPoints = averageDataPoints;

        // Initialise the SVG.
        this.domElement.setAttribute('viewBox', '0 0 600 400');
        this.domElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    static loadFromCourseAssessmentsPage(page: Document): GradeProgressionGraph {
        // Extract the chart data from the chart labels on each data point.
        // Conveniently, all labels for the student's individual grade have the style class .evoE, while the labels
        // for the group's grade have the style class .evoG.
        // Convert them into grade data point objects after being selected, then sort them by the cumulated portion.
        return new GradeProgressionGraph(
            Array.from(page.querySelectorAll('.evoE'))
                .map((label) => GradeDataPoint.fromDataPointLabel(<HTMLDivElement>label))
                .sort((a, b) => a.cumulatedPortionOfFinalGrade - b.cumulatedPortionOfFinalGrade),
            Array.from(page.querySelectorAll('.evoG'))
                .map((label) => GradeDataPoint.fromDataPointLabel(<HTMLDivElement>label))
                .sort((a, b) => a.cumulatedPortionOfFinalGrade - b.cumulatedPortionOfFinalGrade)
        );
    }

    // Converts a coordinate where x and y values are between 0 and 1 to a corresponding point on a graph.
    static convertCoordinateToGraphCoordinate(point: {x: number, y: number}) {
        return {
            x: start.x + size.x * point.x,
            // On the SVG, the y+ direction points down, while on a graph, the y+ direction points up.
            // Start at the bottom and subtract the portion of the size to go up.
            y: end.y - size.y * point.y
        }
    }

    get hasData() {
        return this.individualDataPoints.length > 0 || this.averageDataPoints.length > 0
    }

    renderAxesLines(): Element {
        return SVGElementBuilder.group({
            children: [
                // Horizontal axis line.
                SVGElementBuilder.line({
                    x1: 45, y1: 350, x2: 575, y2: 350, strokeWidth: 2,
                    styleClasses: ['heavy-line']
                })
            ]
        });
    }

    renderGridlines(): Element {
        return SVGElementBuilder.group({
            children: [
                // 100% line
                SVGElementBuilder.line({
                    x1: 45, y1: 50, x2: 575, y2: 50, strokeWidth: 1,
                    styleClasses: ['light-line']
                }),
                // 90% line
                SVGElementBuilder.line({
                    x1: 45, y1: 125, x2: 575, y2: 125, strokeWidth: 1,
                    styleClasses: ['light-line']
                }),
                // 80% line
                SVGElementBuilder.line({
                    x1: 45, y1: 200, x2: 575, y2: 200, strokeWidth: 1,
                    styleClasses: ['light-line']
                }),
                // 70% line
                SVGElementBuilder.line({
                    x1: 45, y1: 275, x2: 575, y2: 275, strokeWidth: 1,
                    styleClasses: ['light-line']
                })
            ]
        })
    }

    renderLeftLabels(): Element {
        return SVGElementBuilder.group({
            children: [
                SVGElementBuilder.text({
                    x: 40, y: 50, dy: '0.3em', text: '100', textAnchor: 'end',
                    styleClasses: ['label']
                }),
                SVGElementBuilder.text({
                    x: 40, y: 125, dy: '0.3em', text: '90', textAnchor: 'end',
                    styleClasses: ['label']
                }),
                SVGElementBuilder.text({
                    x: 40, y: 200, dy: '0.3em', text: '80', textAnchor: 'end',
                    styleClasses: ['label']
                }),
                SVGElementBuilder.text({
                    x: 40, y: 275, dy: '0.3em', text: '70', textAnchor: 'end',
                    styleClasses: ['label']
                }),
                SVGElementBuilder.text({
                    x: 40, y: 350, dy: '0.3em', text: '60', textAnchor: 'end',
                    styleClasses: ['label']
                })
            ]
        });
    }

    renderBottomLabels(): Element {
        return SVGElementBuilder.group({
            children: [
                SVGElementBuilder.text({
                    x: 50, y: 350, dy: '1.2em', text: '0', textAnchor: 'middle',
                    styleClasses: ['label']
                }),
                SVGElementBuilder.text({
                    x: 180, y: 350, dy: '1.2em', text: '25', textAnchor: 'middle',
                    styleClasses: ['label']
                }),
                SVGElementBuilder.text({
                    x: 310, y: 350, dy: '1.2em', text: '50', textAnchor: 'middle',
                    styleClasses: ['label']
                }),
                SVGElementBuilder.text({
                    x: 440, y: 350, dy: '1.2em', text: '75', textAnchor: 'middle',
                    styleClasses: ['label']
                }),
                SVGElementBuilder.text({
                    x: 570, y: 350, dy: '1.2em', text: '100', textAnchor: 'middle',
                    styleClasses: ['label']
                })
            ]
        });
    }

    renderLines(): Element {
        return SVGElementBuilder.group({
            children: [
                // Use a polyline to draw the line between the points.
                SVGElementBuilder.polyline({
                    points: this.averageDataPoints.map((point) => point.positionInGraph),
                    strokeWidth: 2,
                    styleClasses: ['average-line']
                }),
                // Do the same for the individual. Draw individual data last so they appear on top.
                SVGElementBuilder.polyline({
                    // Go through every point in the individual/group's grade
                    points: this.individualDataPoints.map((point) => point.positionInGraph),
                    strokeWidth: 2,
                    styleClasses: ['individual-line']
                })
            ]
        });
    }

    renderPoints() {
        return SVGElementBuilder.group({
            children: [
                // Group grades
                SVGElementBuilder.group({
                    children: this.averageDataPoints.map((point) => point.positionInGraph)
                        .map((position) => SVGElementBuilder.circle({
                            x: position.x, y: position.y, radius: 5, styleClasses: ['average-point']
                        }))
                }),
                // Individual grades. Draw individual data last so they appear on top.
                SVGElementBuilder.group({
                    children: this.individualDataPoints.map((point) => point.positionInGraph)
                        .map((position) => SVGElementBuilder.circle({
                            x: position.x, y: position.y, radius: 5, styleClasses: ['individual-point']
                        }))
                })
            ]
        });
    }

    updateDomElement(renderInfo?: null): void {
        this.domElement.append(
            this.renderGridlines(),
            this.renderAxesLines(),
            this.renderLeftLabels(),
            this.renderBottomLabels(),
            this.renderLines(),
            this.renderPoints()
        );
    }
}