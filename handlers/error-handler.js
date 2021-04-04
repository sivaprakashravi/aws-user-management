/*
Name of the author:MONISHA MOHAN
Date of creation:09/08/2019
Project Name :PHANTOM
Function Details:function to handle errors
*/

const errorList = require('../constants/error-code');
const date = require('../constants/format_date');

/*R-Class handling error message
*@params nill
*/
module.exports = class errorDetails {
    constructor(error) {
        this.datetime = date.timeToISO(new Date());
        this.timestamp = new Date().getTime();
        this.status = 'error';
        this.code = error.errorCode ? error.errorCode : 503;
        this.message = error.message ? error.message : 'Service Temporarily Unavailable';
        return(this.code,this.message);
    }
};
