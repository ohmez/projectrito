var d = new Date(0);
d.setUTCMilliseconds(1547854746469);
console.log(d.getTime(), 'this should be yesterday');
var n = new Date();
console.log(n.getTime(), 'this should be now');

console.log((d.getTime()+60000)>n);
// console.log()