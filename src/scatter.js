import getStats from './stats';

export default function scatter(arg) {
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
        colors = options.colors || ['white', 'steelblue'],
        hover = options.hover || function(d) {};

    var scatter = {};
    var getSize = function() { return 5; },
        getPosX = function() { return 0; },
        getPosY = function() { return 0; },
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
        } else if(colors == 'string') {
            var getRange = d3.scale.linear().domain(colorDomain).range([0, 1]);
            getColor = function(value) {
                if(typeof colorScales['interpolate' + colors] == 'function') {
                    return colorScales['interpolate' + colors](getRange(value));
                } else {
                    return 'steelblue';
                }
            }
        } else {
            getColor =  d3.scale.linear()
                .domain(colorDomain)
                .range(colors);
        }
    }

    if(vmap.x) {
        var xScale = d3.scale.linear()
        .domain([stats[vmap.x].min, stats[vmap.x].max]);

        getPosX = function(d) {
            var v = xScale.range([ d.startAngle, d.endAngle])(d[vmap.x]);
            return v;
        }
    }

    if(vmap.y) {
        getPosY = d3.scale.linear()
            .domain([stats[vmap.y].min, stats[vmap.y].max])
            .range([innerRadius, outerRadius]);
    }

    function createArc(d) {
        return d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(getSize(d[vmap.size]))
            (d);
    }

    var visualElement = container.append("g").selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", function(d){return getSize(d[vmap.size])})
        .attr("cx", function(d){return getPosY(d[vmap.y]) * Math.cos(getPosX(d))})
        .attr("cy",function(d){return getPosY(d[vmap.y]) * Math.sin(getPosX(d))})
        .style("fill", function(d){return getColor(d[vmap.color])});

    scatter.colorDomain = colorDomain;
    scatter.updateColor = function(colorDomain) {
        scatter.colorDomain = colorDomain;
        getColor.domain(colorDomain);
        visualElement.style("fill", function(d) { 
            return getColor(d[vmap.color]); 
        })
    }

    return scatter;
}

