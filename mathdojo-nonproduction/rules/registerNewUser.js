function registerNewUser(user, context, callback) {
  // eslint-disable-next-line import/no-unresolved
  const axios = require("axios@0.19.2");
  const crypto = require("crypto");
  const mathDojoNamespace = "http://math-dojo.io/";
  const orgIdForUser = configuration.userAccountServiceDefaultOrgId;
  const options = {
    method: "POST",
    // eslint-disable-next-line no-undef
    url: `${configuration.userAccountServiceDomain}/organisations/${orgIdForUser}/users`,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": `${configuration.userAccountServiceApiKey}`,
    },
    data: {
      name: user.name,
      profileImageLink: user.picture,
      accountVerified: user.email_verified,
      id: crypto
        .createHash("sha256")
        .update(user.user_id)
        .digest("hex")
        .slice(0, 32),
    },
  };

  return axios(options)
    .then((res) => {
      // eslint-disable-next-line no-console
      console.info(
        "A response was obtained for the call to the User Account Service"
      );
      context.idToken[`${mathDojoNamespace}user_permissions`] =
        res.data.permissions ? res.data.permissions: [];
      callback(null, user, context);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(
        `There was an error processing the new registration: ${err.message}`
      );
      callback(new UnauthorizedError('[0001] - error response from UAS'), user, context);
    });
}
