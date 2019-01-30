import {scaleLinear} from 'd3-scale';
import * as colorScales from 'd3-scale-chromatic';

export default function mapColor(colors, colorDomain) {
    var getColor;
    if(typeof colors == 'function') {
        getColor = colors;
    } else if(typeof colors == 'string') {
        var getRange = scaleLinear().domain(colorDomain).range([0, 1]);
        getColor = function(value) {
            if(typeof colorScales['interpolate' + colors] == 'function') {
                return colorScales['interpolate' + colors](getRange(value));
            } else {
                return '#000000';
            }
        }
        getColor.domain = function(d) {
            getRange = scaleLinear().domain(d).range([0, 1]);
            return getRange;
        }
    } else {
        getColor =  scaleLinear()
            .domain(colorDomain)
            .range(colors);
    }
    return getColor;
}