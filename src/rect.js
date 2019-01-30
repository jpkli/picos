import getStats from './stats';
import * as colorScales from 'd3-scale-chromatic';
import {scaleLinear, scalePow} from 'd3-scale'; 
import {arc} from 'd3-shape';
import {select} from 'd3-selection';

export default function bars(arg) {
    var options = arg || {},
        container = options.container || "body",
        data = options.data,
        vmap = options.vmap,
        width = options.width || 800,
        height = options.height || width,
        outerRadius = options.outerRadius || Math.min(width/2, height/2),
        innerRadius = options.innerRadius || outerRadius / 4,
        padding = options.padding || 0.05,
        domain = options.domain || null,
        colorDomain = options.colorDomain || null,
        stats = options.stats || null,
        tooltip = options.tooltip || function() {},
        colors = options.colors || ['white', 'steelblue'],
        
        hover = options.hover || function(d) {};

    var getSize = function() { return outerRadius; },
        getColor = (typeof colors === 'function') ? colors : function() { return colors[0]};

    if(stats === null) {
        stats = getStats(data, Object.keys(vmap).map(function(k){ return vmap[k]; }));
    }

    if(vmap.color && typeof(colors) != 'function') {
        if(colorDomain === null) {
            if(stats[vmap.color].max == stats[vmap.color].min) stats[vmap.color].max+=0.000001;
            colorDomain = [stats[vmap.color].min, stats[vmap.color].max];
        }
        if(typeof colors == 'function') {
            getColor = colors;
        } else if(typeof colors == 'string') {
            var getRange = scaleLinear().domain(colorDomain).range([0, 1]);
            getColor = function(value) {
                if(typeof colorScales['interpolate' + colors] == 'function') {
                    return colorScales['interpolate' + colors](getRange(value));
                } else {
                    return 'steelblue';
                }
            }
        } else {
            getColor = scaleLinear()
                .domain(colorDomain)
                .range(colors);
        }
    }

    if(vmap.size) {
        getSize =  scalePow().exponent(0.9)
            .domain([stats[vmap.size].min, stats[vmap.size].max])
            .range([innerRadius, outerRadius]);
    }

    function createArc(d) {
        return arc()
            .innerRadius(innerRadius)
            .outerRadius(getSize(d[vmap.size]))
            (d);
    }


    var bars = container.append("g").selectAll(".bar")
        .data(data)
        .enter()


    var marks = bars.append("path").attr("class", "bars")
        .attr('class', 'bars')
        .style("fill", function(d) { return getColor(d[vmap.color]); })
        // .style("stroke", function(d) { return getColor(d[vmap.color]); })
        .style("stroke", '#000')
        .style("stroke-width", 0)
        // .style("fill-opacity", function(d){return getOpacity(d[opacityAttr])})
        .attr("d", createArc)
        .on("mouseover", function(d){
            let pos = this.getBBox();
            select(this).style('stroke-width', 2)
            tooltip.show(pos, d)
        })
        .on("mouseout", function() {
            tooltip.hide();
            select(this).style('stroke-width', 0)
        }); 

    bars.colorDomain = colorDomain;
    bars.updateColor = function(colorDomain) {
        bars.colorDomain = colorDomain;
        getColor.domain(colorDomain);
        marks.style("fill", function(d) { return getColor(d[vmap.color]); })
    }

    return bars;
}