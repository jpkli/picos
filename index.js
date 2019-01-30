import picos from './src/main';

var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.picos = picos;

export default picos;

if(typeof module != 'undefined' && module.exports)
    module.exports = picos;