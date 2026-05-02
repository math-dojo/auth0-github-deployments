function registerNewUser(user, context, callback) {
  // Task 4: loginsCount guard — only register on first login
  if (context.stats.loginsCount > 1) {
    return callback(null, user, context);
  }
  // eslint-disable-next-line import/no-unresolved
  const axios = require("axios@0.19.2");
  const crypto = require("crypto");
  const mathDojoNamespace = "http://math-dojo.io/";
  // eslint-disable-next-line no-undef
  const orgIdForUser = configuration.userAccountServiceDefaultOrgId;
  const options = {
    method: "POST",
    // eslint-disable-next-line no-undef
    url: `${configuration.userAccountServiceDomain}/organisations/${orgIdForUser}/users`,
    headers: {
      "Content-Type": "application/json",
      // eslint-disable-next-line no-undef
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
      // Task 3: stamp belongs_to_org claim on the ID token
      context.idToken[`${mathDojoNamespace}belongs_to_org`] = orgIdForUser;
      context.idToken[`${mathDojoNamespace}user_permissions`] =
        res.data.permissions ? res.data.permissions : [];
      callback(null, user, context);
    })
    .catch((err) => {
      // Task 4: treat 409 Conflict (already registered) as a non-error
      if (err.response && err.response.status === 409) {
        // eslint-disable-next-line no-console
        console.info(
          "User already registered in UAS — treating as success (idempotent)"
        );
        context.idToken[`${mathDojoNamespace}belongs_to_org`] = orgIdForUser;
        context.idToken[`${mathDojoNamespace}user_permissions`] = [];
        return callback(null, user, context);
      }
      // eslint-disable-next-line no-console
      console.error(
        `There was an error processing the new registration: ${err.message}`
      );
      callback(new UnauthorizedError("[0001] - error response from UAS"), user, context);
    });
}
