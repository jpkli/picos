import chord from './chord';
import textLabel from './text';
import rect from './rect';
import scatter from './scatter';
import colorlegend from './colorlegend';
import colorMap from './colors';
import {select} from 'd3-selection';

function getExtent(data, field) {
    var tuple = data.map(function (d) {
        return d[field];
    });
    var min = Math.min.apply(null, tuple);
    var max = Math.max.apply(null, tuple);
    if (max == min) max += 1e-4;

    return [min, max];
}

export default function Picos(spec) {
    let layers = spec.layers;
    let rings = new Array(layers.length);

    var config = spec.config;
    var width = config.width || 800;
    var height = config.height || width;
    var padding = config.padding || 10;
    var outerRadius = config.outerRadius || Math.min(width / 2, height / 2);
    var innerRadius = config.innerRadius || Math.min(width / 4, height / 4);
    var container = config.container || "body";
    var parentRing = container;
    var chartTitle = config.chartTitle || false;
    var colorDomains = config.colorDomains || [];
    var groups = [];

    outerRadius -= padding;

    
    var offset = Math.min((width / 2), (height / 2));
    var baseSVG = select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + offset + "," + offset + ")");

    var cirRange = outerRadius - innerRadius - padding,
        cirOffset = innerRadius,
        sectionRadius = cirOffset,
        cirSize = layers
        .map(function (layer) {
            return layer.size;
        })
        .reduce(function (a, b) {
            return a + b;
        });

    var tipBox;    
    var tip = null;
    let tipTextBox;
    let tipTexts = [];
    
    let tooltip = {
        show(pos, dataItem) {
            if (tip === null) {
                tip = tipBox.append('rect')
                    .attr("class", "tooltip")
                    .attr('fill', '#EEE')
                    .attr('stroke', '#222')
                    .attr('width', 100)
                    .attr('height', 50)
                    .style("opacity", 0);

                tipTextBox = tipBox.append('text')
                    .attr('x', 10)
                    .attr('y', 10)
            }
            tip.style("opacity", .9)
            tipBox.attr('transform', 'translate (' +  [pos.x + pos.width, pos.y + pos.height].join(',') + ')')

            let texts = Object.entries(dataItem).slice(0, 10)
            texts.forEach((text, i) => {
                let label = tipTextBox.append('tspan')
                    .attr('y', i * 15)
                    .attr('x', 15)
                    .attr('dy', 20)
                    .text(text.join(': '));
                tipTexts.push(label)
            })
            let textBBox = tipTextBox.node().getBBox();
            tip.attr('width', textBBox.width + 15*2)
                .attr('height', textBBox.height + 15*2)
 
        },

        hide () {
            tip.style("opacity", .0)
            tipTexts.forEach((t) => t.remove())
        }
    }

    layers.forEach(function (layer, li) {
        var sectionRadiusRange = cirOffset + layer.size / cirSize * cirRange,
            cirPadding = 0.05 * sectionRadiusRange,
            sectionRadius = sectionRadiusRange,
            colorDomain = ['min', 'max'];

        var colors = layer.colors;
        var getColor;

        if (layer.type == 'link') {
            let linkOption = Object.assign({
                container: baseSVG,
                radius: cirOffset,
                colorDomain: colorDomains[li],
            }, layer)
            rings[li] = chord(linkOption);
            parentRing = rings[li];
            groups = parentRing.groups;
            colorDomain = rings[li].colorDomain;
            
        } else if (layer.type == 'text') {
            layer.container = baseSVG;
            layer.radius = cirOffset;
            layer.groups = groups;
            rings[li] = textLabel(layer);
            cirOffset = sectionRadius + cirPadding;
        } else {

            var dataItems = [];
            groups.forEach(function (chord, ci) {
                var delta = (chord.endAngle - chord.startAngle) / layer.data[ci].length;
                layer.data[ci].forEach(function (d, di) {
                    var start = chord.startAngle + di * delta;
                    d.startAngle = start;
                    d.endAngle = start + delta;
                    d.index = chord.index;
                })
                dataItems = dataItems.concat(layer.data[ci]);
            })

            colorDomain = (Array.isArray(colorDomains[li])) ? colorDomains[li] : getExtent(dataItems, layer.vmap.color);

            getColor = colorMap(layer.colors || ['red', 'steelblue'], colorDomain);

            var plot;
            if (layer.type == 'circle') {
                plot = scatter;
            } else {
                plot = rect;
            }

            rings[li] = plot({
                container: baseSVG,
                data: dataItems,
                innerRadius: cirOffset,
                outerRadius: sectionRadius,
                colors: getColor,
                colorDomain: colorDomain,
                tooltip: tooltip,
                vmap: layer.vmap || layer.encoding,
            });

            cirOffset = sectionRadius + cirPadding;

        }

        if (layer.type !== 'text' && layer.vmap) {
            if (config.legend) {
                if (rings[li].colorDomain) colorDomain = rings[li].colorDomain;
                colorlegend({
                    container: baseSVG,
                    colors: layer.colors,
                    height: Math.min(50, outerRadius / 2 / rings.length),
                    width: (width / 2 - outerRadius / 2 - padding) * 0.9,
                    title:  (layer.vmap) ? layer.vmap.color : null,
                    domain: colorDomain,
                    pos: [
                        width / 2 - (width / 2 - outerRadius / 2 - padding) * 0.9,
                        outerRadius / 2 + outerRadius / 2 / (rings.length) * li]
                })
            }
        }

        if (chartTitle) {
            baseSVG.append("text")
                .style("font-size", "1.1em")
                .style("text-anchor", "middle")
                .attr("x", 0)
                .attr("y", height / 2 - 15)
                .text(function (d, i) {
                    return chartTitle
                });
        }

        tipBox = baseSVG.append('g')
    });

    rings.createColorLegend = function (options) {
        var svg = select(options.container).append('svg')
            .attr('width', options.width).attr('height', options.height);

        layers.forEach(function (layer, li) {
            if (layer.type == 'text') return;
            var colorDomain = (options.colorDomains) ? options.colorDomains[li] : rings[li].colorDomain;
            colorlegend({
                container: svg,
                colors: layer.colors,
                height: options.height / (layers.length - 1),
                width: options.width,
                title: layer.project + ' (' + ((layer.vmap) ? layer.vmap.color : null) + ')',
                domain: colorDomain,
                padding: options.padding,
                pos: [0, options.height / (layers.length - 1) * li]
            });
        });
    }

    rings.updateColor = function (colorDomains) {
        rings.forEach(function (ring, ri) {
            if (layers[ri].type !== 'text') {
                ring.updateColor(colorDomains[ri]);
            }
        })
    }
    return rings;
}