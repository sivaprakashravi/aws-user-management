/*
Name of the author:MONISHA MOHAN
Date of creation:13/08/2019
Project Name :PHANTOM
Function Details:Module contains the functions to handle the cognito- user creation
*/

global.fetch = require('node-fetch')
const errorHandler = require('../handlers/error-handler');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const success = require('../handlers/success-handler');
const error = require('../handlers/error-handler');
const validEmail = require('../models/validate');
const auth = require("../handlers/auth-handler");
const AWS = require('aws-sdk');
const db = require('../db/connect');
const config = require('../config');
const request = require("request");


AWS.config.accessKeyId = config.accessKeyId;
AWS.config.secretAccessKey = config.secretAccessKey;
AWS.config.region = config.region;
module.exports = {
    /*R-Function to return default values used in all aws apis
    *@params nill
    */
    defaults: async (Username) => {
        const definitions = {
            Pool: new AmazonCognitoIdentity.CognitoUserPool({
                UserPoolId: config.userPoolId,
                ClientId: config.clientId,
            })
        };
        if (Username) {
            definitions.cognitoUser = new AmazonCognitoIdentity.CognitoUser({ Username, Pool: definitions.Pool });
        }
        return definitions;
    },

    /*R-Function to delete an user and log this activity to db
    *@params nill
    */
    deleteUser: async (req, res) => {
        const token = req.headers['x-access-token'];
        req.user = auth.ValidateToken(token);
        let profile;
        if (req.user && req.user.valid) {
            profile = await module.exports.userInfoRequest(req.user.sub);
        }
        const query = req.body;
        if (profile.email === query.email.toUpperCase()) {
            res.send(new error({ message: 'Cannot Delete Self', errorCode: 500 }));
            return
        }
        const { Pool } = await module.exports.defaults();
        var params = {
            UserPoolId: Pool.getUserPoolId(), /* required */
            Username: query.email.toUpperCase() /* required */
        };
        const CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
        CognitoIdentityServiceProvider.adminDeleteUser(params, (err, result) => {
            if (!err) {
                const log = {
                    ACCOUNT: query.email.toUpperCase(),
                    REQUESTOR: profile.email,
                    ACTION_TYPE: 'DELETE',
                    TIMESTAMP: new Date()
                }
                db.connect((dbo, dberr) => {
                    dbo
                        .collection('PR_USER_ACCOUNT_LOGS')
                        .insertOne(log, (err, data) => {
                            if (!err) {
                                res.send(new success({ message: "User deleted and activity logged Successfully" }));
                            }
                        })
                });
            } else {
                res.status(500).send({ message: err.message });
            }
        });
    },
    /*R-Function to register user
    *@params nill
    */
    register: async (req, res) => {
        const formData = req.body;
        const { Pool } = await module.exports.defaults();
        const group = ['global-executive', 'country-executive', 'city-executive', 'store-incharge', 'operator', 'admin'];
        var notFoundAttribs = [];
        var general;
        var custom;
        var must = ['picture', 'profile', 'locale', 'birthdate', 'address'];
        if (group.includes(formData.role)) {                            // matches the role from request to existing roles
            switch (formData.role) {                                                    // switch case to assign general and custom attribs based on user role
                case 'global-executive': general = ['email', 'phone_number', 'name'];
                    custom = ['company_name', 'parent_id'];
                    break;
                case 'country-executive': general = ['email', 'phone_number', 'name'];
                    custom = ['company_name', 'tenant_id', 'country', 'parent_id'];
                    break;
                case 'city-executive': general = ['email', 'phone_number', 'name'];
                    custom = ['company_name', 'tenant_id', 'city', 'country', 'parent_id'];
                    break;
                case 'store-incharge': general = ['email', 'phone_number', 'name'];
                    custom = ['company_name', 'tenant_id', 'city', 'store_name', 'country', 'parent_id'];
                    break;
                case 'operator': general = ['email', 'phone_number', 'name'];
                    custom = ['company_name', 'tenant_id', 'city', 'country', 'store_name', 'parent_id'];
                    break;
                case 'admin': general = ['email', 'phone_number', 'name'];
                    custom = ['company_name', 'tenant_id', 'parent_id'];
                    break;
            }
            const attributeList = [];
            general.map(g => {
                if (formData[g] != undefined) {
                    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
                        Name: g,
                        Value: formData[g].toUpperCase()
                    }));
                }
                else
                    notFoundAttribs.push(g);   //push the required attribs not found for the role to notFoundAttribs to throw error message at the end
            });
            must.map(m => {
                if (formData[m] != undefined) {
                    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
                        Name: m,
                        Value: ''
                    }));
                }
                // notFoundAttribs.push(m);
            });
            custom.map(c => {
                if (formData[c] != undefined) {
                    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
                        Name: `custom:${c}`,
                        Value: formData[c].toUpperCase()
                    }));
                }
                else
                    notFoundAttribs.push(c);
            });
            if (validEmail.email(formData.email) && notFoundAttribs.length == 0) {
                Pool.signUp(formData.email.toUpperCase(), formData.password, attributeList, null, (err, result) => {
                    if (err) {
                        res.status(500).send({ message: err.message });
                        return;
                    }
                    cognitoUser = result.user;
                    module.exports.addUserToGroup(req, res);
                });
            }
            else {
                res.send({ message: "Required fields for " + formData.role + " not found: " + notFoundAttribs })
            }
        }
        else {
            res.send({ message: "Unidentified role / group of user" })
        }

    },

    addUserToGroup: async (req, res) => {
        data = req.body;
        // let token;
        // let profile;
        // if (data.role != 'admin') {
        //     token = req.headers['x-access-token'];
        //     req.user = auth.ValidateToken(token);
        //     if (req.user && req.user.valid) {
        //         profile = await module.exports.userInfoRequest(req.user.sub);
        //     }
        // }
        const { Pool } = await module.exports.defaults();
        var params = {
            GroupName: data.role, /* required */
            UserPoolId: Pool.getUserPoolId(), /* required */
            Username: data.userId.toUpperCase() /* required */
        };
        const CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
        CognitoIdentityServiceProvider.adminAddUserToGroup(params, (err, result) => {
            if (!err) {
                // if (data.role != 'admin') {
                //     const log = {
                //         ACCOUNT: data.userId.toUpperCase(),
                //         REQUESTOR: profile.email,
                //         ACTION_TYPE: 'CREATE',
                //         TIMESTAMP: new Date()
                //     }
                //     db.connect((dbo, dberr) => {
                //         dbo
                //             .collection('PR_USER_ACCOUNT_LOGS')
                //             .insertOne(log, (err, data) => {
                //                 if (!err) {
                //                     res.send(new success({ message: "User created and activity logged Successfully" }));
                //                 }
                //             })
                //     });
                // }
                // else {
                //     res.send(new success({ message: "admin created Successfully" }));
                // }
                res.send(new success({ message: "User created and added to group Successfully" }));

            } else {
                res.status(500).send({ message: err.message });
            }
        });

    },

    /*R-Function to login user
    *@params nill
    */
    login: (req, res) => {
        const body = req.body;
        const email = body.email.toUpperCase();
        const password = body.password;
        if (email && password) {
            const success = (valid) => {
                if (valid.profile['email']) {
                    res.header('authorization', valid.accessToken);
                    res.header('x-requested-with', valid.refreshToken);
                    res.send(valid);
                } else {
                    res.status(412).send(new errorHandler({ errorCode: 412 }));
                }
            };
            const error = (err) => {
                res.status(401).send(err);
            }
            module.exports.authenticate(email, password, success, error);
        }
    },

    /** Extend auth session */

    session: async (req, res) => {
        const body = req.body;
        const headers = req.headers;
        const email = body.email;
        var refreshToken = headers['authorization'];
        if (refreshToken && email) {
            const RefreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: refreshToken });
            const { cognitoUser } = await module.exports.defaults(email);
            cognitoUser.refreshSession(RefreshToken, (err, result) => {
                if (err) {
                    res.status(403).send(err);
                } else {
                    const userData = {};
                    const payload = result.idToken.payload;
                    userData.email = payload.email;
                    userData.phone_number = payload.phone_number;
                    userData.auth_time = payload.auth_time;
                    userData.exp = payload.exp;
                    userData.iat = payload.iat;
                    userData.accessToken = result.accessToken.jwtToken;
                    userData.refreshToken = result.refreshToken.token;
                    userData.idToken = result.idToken.jwtToken;
                    res.header('authorization', userData.accessToken);
                    res.header('x-requested-with', userData.refreshToken);
                    res.send(userData);
                }
            })
        } else {
            res.status(401).send({
                error: 401,
                message: 'Invalid Session Token / User'
            });
        }
    },
    // /*R-Function to add user to group
    //     *@params nill
    //     */

    //     cognitoidentityserviceprovider.adminAddUserToGroup(params, function(err, data) {
    //       if (err) console.log(err, err.stack); // an error occurred
    //       else     console.log(data);           // successful response
    //     }); 


    /*R-Function to authenticate user
    *@params nill
    */
    authenticate: async (Username, Password, success, error) => {
        const authenticationData = { Username, Password };
        const { cognitoUser } = await module.exports.defaults(Username);
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                const auth = {
                    profile: result.idToken.payload,
                    accessToken: result.getAccessToken().jwtToken,
                    refreshToken: result.getRefreshToken().token
                };
                success(auth, cognitoUser);
            },
            onFailure: async (err) => {
                error(err);
            }
        });
    },

    /*R-Function to confirm user usinng verificaton code
    *@params nill
    */
    confirm: async (req, res) => {
        const body = req.body;
        const Username = body.email;
        const verificationCode = body.verificationCode;
        const { cognitoUser } = await module.exports.defaults(Username);
        cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
            if (err) {
                res.status(401).send(err);
            } else {
                res.send(new success(result));
            }
        });
    },

    /*R-Function to change password
    *@params nill
    */
    changePassword: (req, res) => {
        const { body: { email, oldPassword, newPassword } } = req;
        module.exports.authenticate(email.toUpperCase(), oldPassword, (result, cognitoUser) => {
            cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
                if (err) {
                    res.status(401).send({ message: err.message });
                } else {
                    res.send(new success(result));
                }
            });
        }, (err) => {
            res.status(401).send({ message: err.message });
        });
    },

    /*R-Function to handle forgot password
    *@params nill
    */
    forgotPassword: async (req, res) => {
        const Username = req.body.email.toUpperCase();
        const { cognitoUser } = await module.exports.defaults(Username);
        cognitoUser.forgotPassword({
            onSuccess: (result) => {
                res.send(new success(result));
            },
            onFailure: (err) => {
                res.status(401).send({ message: err.message });
            }

        });
    },

    /*R-Function to update password after forgot password 
    *@params nill
    */
    inputVerificationCode: async (req, res) => {
        const { body: { email, verificationCode, newPassword } } = req;
        const { cognitoUser } = await module.exports.defaults(email);
        cognitoUser.confirmPassword(verificationCode, newPassword, {
            onSuccess: (result) => {
                res.send(new success(result));
            },
            onFailure: (err) => {
                res.status(401).send({ message: err.message });
            }
        });
    },

    createGroup: async (req, res) => {
        const { Pool } = await module.exports.defaults();
        var params = {
            GroupName: 'Test',
            UserPoolId: Pool.getUserPoolId()
        };
        const CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
        CognitoIdentityServiceProvider.createGroup(params, async function (err, data) {
            if (err) {
                err.errorCode = 409;
                res.status(err.errorCode).send(new errorHandler(err));
            }
            else {
                const adminAdded = await module.exports.addAdminToGroup(params);
                if (!adminAdded.err) {
                    res.send(new success());
                } else {
                    res.status(304).send(new errorHandler(adminAdded.err));
                }
            }
        });
    },

    addAdminToGroup: async (params) => {
        params.Username = '7c9c29ca-3897-4120-8802-112be2fdb8ae';
        const CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
        return new Promise((resolve) => {
            CognitoIdentityServiceProvider.adminAddUserToGroup(params, function (err, data) {
                resolve({ err, data });
            });
        }).then(d => d);
    },

    listUsers: async (req, res) => {
        const { Pool } = await module.exports.defaults();
        const filter = req.query.q;
        const id = req.params.id
        const params = {
            UserPoolId: Pool.getUserPoolId(),
            // AttributesToGet: ['phone_number', 'email', 'sub', 'custom:role', 'name', 'custom:last_name','custom:role','custom:country','custom:city','custom:tenant_id'],
            Filter: 'name ^= \"\"'
        }
        if (filter) {
            params.Filter = `name ^= \"${filter}\"`
        }
        if (id) {
            params.Filter = `sub ^= \"${id}\"`
        }

        var CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
        CognitoIdentityServiceProvider.listUsers(params, function (err, data) {
            if (!err) {
                const users = [];
                if (data && data.Users && data.Users.length) {
                    data.Users.forEach(user => {
                        const attributes = {};
                        user.Attributes.map(u => {
                            attributes[u.Name] = u.Value;
                        })
                        users.push({ users: attributes });
                        // FIRST_NAME: attributes.name,
                        // LAST_NAME: attributes['custom:last_name'],
                        // ID: attributes.sub,
                        // COMPANY_NAME: attributes.COMPANY_NAME,
                        // PHONE: attributes.phone_number,
                        // EMAIL_ID: attributes.email,
                        // ROLE: attributes['custom:role'],
                        // TENANT_ID:attributes['custom:tenant_id'],
                        // COUNTRY:attributes['custom:country'],
                        // CITY:attributes['custom:city'],
                        // STORE:attributes['custom:store']
                    });
                }
                res.send(new success(users));
            } else {
                res.status(err.statusCode).send(err);
            }
        });

    },
    userInfoRequest: async (sub) => {
        if (sub) {
            return new Promise(resolve => {
                request(
                    `${config.USER_API}/${sub}`,
                    { json: true },
                    (err, res, body) => {
                        if (!err) {
                            resolve({ err, res, body });
                        }
                    }
                );
            }).then(result => {
                result = result.body.data[0].users;
                return result;
            });

        }
    }

}

