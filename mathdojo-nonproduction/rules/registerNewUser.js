function registerNewUser(user, context, callback) {
  // eslint-disable-next-line global-require
  // eslint-disable-next-line import/no-unresolved
  const axios = require("axios@0.19.2");
  const mathDojoNamespace = "http://math-dojo.io/";
  const options = {
    method: "POST",
    // eslint-disable-next-line no-undef
    url: `https://${configuration.userAccountServiceDomain}/organisations/user.organisationId/users`,
    headers: { "content-type": "application/json" },
    data: '{"name":user.name}',
  };

  return axios(options)
    .then((res) => {
      // eslint-disable-next-line no-console
      console.info(
        "A response was obtained for the call to the User Account Service"
      );
      context.idToken[`${mathDojoNamespace}user_permissions`] =
        res.data.permissions;
      callback(null, user, context);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(
        `There was an error processing the new registration: ${err.message}`
      );
      return err;
    });
}
