
var moment = require('moment');

var currentDate = moment().subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
var futureDate = moment("2020-10-10 12:00:00", 'YYYY-MM-DD HH:mm:ss');

console.log(futureDate.diff(currentDate, 'hours') >= 24);

var date = moment("2020-05-23 12:00:00").format('YYYY-MM-DD HH:mm:ss')
console.log(moment("2020-05-23 12:00:00").subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'));

var s = '{"nombre":"juan", "edad":"12"}';

var o = JSON.parse(s);
console.log(o);
var json = JSON.stringify(o);
console.log(json);

var array = Object.keys(o);
console.log(array);

var array2 = Object.values(o);
console.log(array2);

async function x(o){
    await Promise.all(Object.values(o).map( async (oldAppointmentReminder) => {
        console.log(oldAppointmentReminder);
    }));
}
x(o);