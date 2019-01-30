import * as cs from 'd3-scale-chromatic';
import {select} from 'd3-selection';
import {format as d3Format} from 'd3-format';

var gradientID = 0;
export default function colorLegend({
    container = null,
    width = 200,
    height = 20,
    pos = [0, 0],
    padding = {left: 25, right: 25, top: 20, bottom: 0},
    colors = ['#eee', 'steelblue'],
    domain = ['min', 'max'],
    noLabel = false,
    format = d3Format('.2s'),
    title = ''
}){
    width -= padding.left + padding.right;
    height -= padding.top + padding.bottom;
    
    let legend;
    if(container === null) {
        legend = select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
        legend.attr("width", width).attr("height", height);
    } else {
        legend = container;
        if(typeof container.appendChild === 'function') {
            container.appendChild(legend);
        } else if(typeof container === 'string') {
            document.getElementById(container).appendChild(legend);
        }
    } 
       
    function linearGradient(colors) {
        let gradient = legend.append("defs")
            .append("linearGradient")
                .attr("id", "gradlegend" + gradientID)
                .attr("x1", "0%")
                .attr("x2", "100%")
                .attr("y1", "0%")
                .attr("y2", "0%");

        if(Array.isArray(colors)) {
            colors.forEach(function(c, i){
                gradient.append("stop")
                    .attr("offset", i / colors.length )
                    .attr("stop-color", c);
            });
        } else if(typeof colors == 'string' ) {
            if(typeof cs['interpolate' + colors] == 'function') {
                for(var i = 0; i < 128; i++) {
                    gradient.append("stop")
                    .attr("offset", i / 128 )
                    .attr("stop-color", cs['interpolate' + colors](i/128));
                }
            }
        }

        return gradientID++;
    }

    var rect = legend.append("g");
    rect.attr('transform', 'translate(' + padding.left + ', ' + padding.right + ')')
        .append("rect")
        .attr("x", pos[0])
        .attr("y", pos[1])
        .attr("width", width-padding.left)
        .attr("height", height)
        .style("fill","url(#gradlegend" + linearGradient(colors) + ")");

    if(!noLabel) {
        rect.append("text")
            .attr("x", pos[0])
            .attr("y", pos[1] + height/2 + 5)
            .style("fill", "#222")
            .style("text-anchor", 'end')
            // .style("font-size", ".9em")
            .text(format(domain[0]) || 0);

        rect.append("text")
            .attr("x", pos[0] + width - padding.left)
            .attr("y", pos[1] + height/2 + 5)
            .style("fill", "#222")
            .style("text-anchor", 'begin')
            // .style("font-size", ".9em")
            .text(format(domain[1]) || 'max');
    }

    if(title) {
        rect.append("g")
            .append("text")
            .attr("y", pos[1] - height/2 - 5)
            .attr("x", pos[0] + width/2 - 5)
            .attr("dy", "0.7em")
            .style("text-anchor", "middle")
            .style("font-size", "0.7em")
            .text(title);
    }

    return legend;
}