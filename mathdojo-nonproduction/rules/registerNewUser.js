function registerNewUser(user, context, callback) {
  const axios = require('axios@0.19.2');
  const options = { method: 'POST',
    url: `https://${configuration.userAccountServiceDomain}/organisations/user.organisationId/users`,
    headers: { 'content-type': 'application/json' },
    data: `{"name":user.name}` };

  axios(options)
    .then( res => {
      	const access_token = 
    	console.log(res.data);
 	context.idToken['user.permissions'] = res.data.permissions;
    })
    .catch( err => {
      return err;
    });  
  return callback(null, user, context);
}
