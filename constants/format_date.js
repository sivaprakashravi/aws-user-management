const moment=require('moment') 
 
var formatDate = (date) => {
    var inputDate = new Date(date);
    var userTimezoneOffset = inputDate.getTimezoneOffset() * 60000;
    if (Math.sign(inputDate.getTimezoneOffset()) > 0) {
        return new Date(inputDate.getTime() + userTimezoneOffset).getTime();
    } else {
        return new Date(inputDate.getTime() - -(userTimezoneOffset)).getTime();
    }
};
module.exports.timeToISO =  (date)=> {
    if (date) {
        date = formatDate(Number(date));
        return moment(new Date(date).setSeconds(0)).format('YYYY-MM-DD HH:mm:ss');
    }
};
