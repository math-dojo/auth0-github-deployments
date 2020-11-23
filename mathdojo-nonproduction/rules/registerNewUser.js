function registerNewUser(user, context, callback) {
  // eslint-disable-next-line global-require
  // eslint-disable-next-line import/no-unresolved
  const axios = require('axios@0.19.2');
  const options = {
    method: 'POST',
    // eslint-disable-next-line no-undef
    url: `https://${configuration.userAccountServiceDomain}/organisations/user.organisationId/users`,
    headers: { 'content-type': 'application/json' },
    data: '{"name":user.name}',
  };

  axios(options)
    .then((res) => {
      const accessToken = console.log(res.data); // TODO: Fix me
      context.idToken['user.permissions'] = res.data.permissions;
    })
    .catch((err) => err);
  return callback(null, user, context); // TODO: Move me into the axios promise return
}
