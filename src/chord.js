import colorMap from './colors';
import {chord as d3Chord, ribbon} from 'd3-chord';
import {lineRadial, curveBundle} from 'd3-shape'

// import {arc as d3Arc} from 'd3-arc';

export default function Chord(arg) {
    let options = arg || {},
        container = options.container || "body",
        data = options.data,
        vmap = options.vmap,
        radius = options.radius || 100,
        padding = options.padding || 0.1,
        ignoreDiagonal = options.ignoreDiagonal || false,
        colorDomain = options.colorDomain || null,
        colors = options.colors || ['steelblue', 'red'],
        hover = options.hover || function(d) {};

    let chord = d3Chord().padAngle(padding)
        // .sortSubgroups(d3Chord.descending)

    let matrix = {};
    matrix.size = data.map((rows, i) => {
        return rows.map((row, j) => {
            return  (i == j) ? 1 * ((ignoreDiagonal) ? 0 : 1) : 1;
        });
    });

    matrix.color =  data.map((rows, i) => {
        return rows.map((row, j) => {
            return (i == j) ? row * ((ignoreDiagonal) ? 0 : 1) : row;
        });
    });

    let colorValues = [];
    matrix.color.forEach((row) => { colorValues = colorValues.concat(row)});
    colorValues = colorValues.filter(d => d !== 0)

    let chords = chord(matrix.size);

    if(colorDomain === null) {
        colorDomain = [Math.min.apply(null, colorValues), Math.max.apply(null, colorValues)];
    }

    let interpolateColor = colorMap(colors, colorDomain);

    let getColor = function(d) {
        let send = matrix.color[d.source.index][d.target.index];
        let recv = matrix.color[d.target.index][d.source.index];
        return interpolateColor(Math.max(send, recv));
    } 
    let svg = container;
    let links;

    if(chords.groups.length < 10) {
        let core = svg.append("g")
            .attr("class", "chord")
            .selectAll("path")
            .data(chords)
            .enter();

        links = core.append("path").attr("class", "ribbons")
            .attr("d", ribbon().radius(radius))
            .style("fill",  getColor)
            .style("stroke", "#FFF")
            .style("opacity", 1);
    } else {
        let line = lineRadial()
            .curve(curveBundle.beta(0.5))
            .radius(d => d.radius)
            .angle(d => { return d.angle})

        let linkData = chords.map((conn) => {
            let source = chords.groups[conn.source.index];
            let sourceAngle = source.startAngle + (source.endAngle - source.startAngle) / 2;
            let target = chords.groups[conn.target.index];
            let targetAngle = target.startAngle + (target.endAngle - target.startAngle) / 2;
            return {
                points: [
                    {angle: sourceAngle, radius},
                    {angle: 0, radius: 0, link: conn}, // curve midpoint
                    {angle: targetAngle, radius}
                ], 
                link: conn 
            } 
        })

        links = svg.append("g")
            .selectAll(".links")
            .data(linkData)
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', d => line(d.points))
            .attr('fill', 'none')
            .style("stroke-width", 2)
            .style("stroke", d => getColor(d.link))
    }

    chords.colorDomain = colorDomain;
    chords.updateColor = function(colorDomain) {
        chords.colorDomain = colorDomain;
        interpolateColor.domain(colorDomain);
        links.style("fill", getColor);
    }
    return chords;
}