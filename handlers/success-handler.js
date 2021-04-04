/*
Name of the author:MONISHA MOHAN
Date of creation:09/09/2019
Project Name :PHANTOM
Function Details:function to handle the success of service
*/

const date = require('../constants/format_date');

/*R-Class handling success message
*@params nill
*/
module.exports = class successDetails {
    constructor(data) {
        this.datetime = date.timeToISO(new Date());
        this.timestamp = new Date().getTime();
        this.status = 'success';
        this.code = 200;
        this.message = 'OK';
        this.data = data;
    }
};