const axios = require("axios");
const crypto = require("crypto");
/**
 * Handler executed during the Post-Login flow.
 * Registers new users in the MathDojo User Account Service (UAS) and
 * stamps custom claims on the ID token and access token.
 *
 * @param {Event} event - Details about the user and the login context.
 * @param {PostLoginAPI} api - Interface to modify login behaviour.
 */
exports.onExecutePostLogin = async (event, api) => {
  // loginsCount guard — only run UAS registration on the very first login
  if (event.stats.logins_count > 1) {
    return;
  }
  const mathDojoNamespace = "http://math-dojo.io/";
  // TODO: when Auth0 Organisations are enabled, replace orgIdForUser with event.organization.id
  const orgIdForUser = event.secrets.userAccountServiceDefaultOrgId;
  const hashedUserId = crypto
    .createHash("sha256")
    .update(event.user.user_id)
    .digest("hex")
    .slice(0, 32);
  try {
    const response = await axios({
      method: "POST",
      url: `${event.secrets.userAccountServiceDomain}/organisations/${orgIdForUser}/users`,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": event.secrets.userAccountServiceApiKey,
      },
      data: {
        name: event.user.name,
        profileImageLink: event.user.picture,
        accountVerified: event.user.email_verified,
        id: hashedUserId,
      },
    });
    console.log("A response was obtained for the call to the User Account Service");
    // belongs_to_org claim on both ID token and access token
    api.idToken.setCustomClaim(`${mathDojoNamespace}belongs_to_org`, orgIdForUser);
    api.accessToken.setCustomClaim(`${mathDojoNamespace}belongs_to_org`, orgIdForUser);
    api.idToken.setCustomClaim(
      `${mathDojoNamespace}user_permissions`,
      response.data.permissions ? response.data.permissions : []
    );
  } catch (err) {
    // Treat 409 Conflict (user already exists) as idempotent success
    if (err.response && err.response.status === 409) {
      console.log("User already registered in UAS — treating as success (idempotent)");
      api.idToken.setCustomClaim(`${mathDojoNamespace}belongs_to_org`, orgIdForUser);
      api.accessToken.setCustomClaim(`${mathDojoNamespace}belongs_to_org`, orgIdForUser);
      api.idToken.setCustomClaim(`${mathDojoNamespace}user_permissions`, []);
      return;
    }
    console.error(`Error registering new user in UAS: ${err.message}`);
    api.access.deny("[0001] - error response from UAS");
  }
};
