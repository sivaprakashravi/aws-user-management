/*
Name of the author:MONISHA MOHAN
Date of creation:13/08/2019
Project Name :PHANTOM
Function Details:Module contains the functions to handle the cognito- user creation
*/

var expect  = require('chai').expect;
var request = require('request');
var config = require('../config');

/*R-Function to return default values used in all aws apis
*@params nill
*/
const constants = require("./constants");
constants.forEach(constant => {
    it(constant.test,(done)=> {
        
        request(`http://localhost:${config.PORT}/user/${constant.host}`, (error, response, body) => {
            const responseBody = JSON.parse(body);
            for(const e in constant.expect) {
                expect(responseBody[e]).to.equal(constant.expect[e]);
            }
            done();
        });
    });    
});