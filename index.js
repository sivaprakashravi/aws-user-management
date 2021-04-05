/*
Name of the author:MONISHA MOHAN
Date of creation:13/08/2019
Project Name :PHANTOM
Function Details:Module contains the routes for managing customer details 
*/

const express = require('express');
const cors = require('cors')
const router = express.Router();
const app = express();
const ctrlUser = require('./controller/user.controller');
const errorHandler = require('./handlers/error-handler');
const bodyParser = require('body-parser');
const CONFIG = require('./config');
const success = require('./handlers/success-handler');

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// Add headers for CORS
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', '*');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

var routeMatcher = 'user'
router.get("/" + routeMatcher + "/test", (req, res) => {
	res.status(200).send(new success({ message: 'Phantom Retail User API works!' }));
});



/* Route to register new user
*@params nill
*/
router.post('/user/register', ctrlUser.register);

/* Route delete user
*@params nill
*/
router.post('/user/deleteUser', ctrlUser.deleteUser);

/* Route auth-login
*@params nill
*/
router.post('/user/login', ctrlUser.login);

/* Route Session
*@params nill
*/
router.post('/user/session', ctrlUser.session);

/* Route for user confirmation
*@params nill
*/
router.post('/user/confirm', ctrlUser.confirm);

 /* Route to change password
 *@params nill
 */
router.post('/user/changePassword', ctrlUser.changePassword);

 /* Route to forgot password
 *@params nill
 */
router.post('/user/forgotPassword', ctrlUser.forgotPassword);

 /* Route to update password after forgot password
 *@params nill
 */
router.post('/user/updatePassword', ctrlUser.inputVerificationCode);

// /* Route to post user group
// *@params nill
// */
router.post('/user/group', ctrlUser.createGroup);

/* Route to get user list
*@params nill
*/
router.get('/user/list', ctrlUser.listUsers);

/* Route to get user list
*@params nill
*/
router.get('/user/:id', ctrlUser.listUsers);
/* Route to post user group
*@params nill
*/
router.post('/user/group', ctrlUser.addUserToGroup);



app.use('/', router);
app.listen(CONFIG.PORT, (res, err) => {
	if (err) {
		res.status(500).send(new errorHandler(err));
	}
	console.log('server listening on port ' + CONFIG.PORT)
});
module.exports = router;