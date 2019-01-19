var d = new Date(0);
// last time I played
d.setUTCMilliseconds(1547854746469);

console.log(d.getTime(), 'this should be yesterday');
// current date/time
var n = new Date();
console.log(n.getTime(), 'this should be now');
// expected false output since I played longer than 1 hour ago
console.log((d.getTime()+60000)>n);
// console.log()