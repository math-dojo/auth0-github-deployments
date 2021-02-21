const crypto = require("crypto");
const UnauthorizedError = require("../helpers/mockUnauthorizedError");
const auth0RuleLoader = require("../helpers/function-loader").loadAuth0Rule;

const registerNewUserCodeLocations = [
  ["Nonproduction", "mathdojo-nonproduction/rules/registerNewUser.js"],
  ["LocalNonproduction", "local-mathdojo-nonproduction/rules/registerNewUser.js"],
  ["Preproduction", "mathdojo-preproduction/rules/registerNewUser.js"],
  ["Production", "mathdojo-production/rules/registerNewUser.js"],
];
const mathDojoNamespace = "http://math-dojo.io/";

jest.useFakeTimers();

describe.each(registerNewUserCodeLocations)(
  "%s Register New User Rule successfully calls User Account Service",
  (_environment, registerNewUserCodeLocation) => {
    const mockAxios = jest.fn().mockName("mockAxios");
    const mockAuth0Callback = jest.fn().mockName("mockAuth0Callback");
    const mapOfModulesToOverride = new Map();
    const name = "akindipe ekpeyong";
    const userProfileimageLink = "https://fancy.image.com/mine";
    const auth0EmailVerificationStatus = true;
    const userId = "google-oauth2|103547991597142817347";
    const defaultUser = {};
    const apiKey = "supersecret";
    const auth0ConfigurationObject = {};
    const defaultOrgId = "defaultOrgId";
    const dummyUASDomain = "http://local.domain";

    beforeEach(() => {
      mockAxios.mockClear();
      mockAxios.mockReturnValue(
        Promise.resolve({
          data: {
            permissions: [],
          },
        })
      );
      mapOfModulesToOverride["axios@0.19.2"] = mockAxios;
      mapOfModulesToOverride.crypto = crypto;

      mockAuth0Callback.mockClear();
      defaultUser.name = name;
      defaultUser.picture = userProfileimageLink;
      defaultUser.email_verified = auth0EmailVerificationStatus;
      defaultUser.user_id = userId;

      auth0ConfigurationObject.userAccountServiceDomain = dummyUASDomain;
      auth0ConfigurationObject.userAccountServiceApiKey = apiKey;
      auth0ConfigurationObject.userAccountServiceDefaultOrgId = defaultOrgId;
    });

    test("the rule makes a POST call to the User Account Service with an API key and content type header", () => {
      // Given

      const registerNewUserFunction = auth0RuleLoader({
        ruleLocation: registerNewUserCodeLocation,
        mapOfRequiredModulesToReplaceWithMocks: mapOfModulesToOverride,
        configuration: auth0ConfigurationObject,
      });

      // When
      registerNewUserFunction(defaultUser, { idToken: {} }, mockAuth0Callback);

      // Then
      expect(mockAxios).toHaveBeenCalledTimes(1);
      const axiosCallArg = mockAxios.mock.calls[0][0];
      expect(axiosCallArg).toContainEntries([["method", "POST"]]);
      expect(axiosCallArg.headers).toContainEntries([
        ["Content-Type", "application/json"],
        ["X-API-Key", auth0ConfigurationObject.userAccountServiceApiKey],
      ]);
    });

    test("the rule makes a POST call to the User Account Service using org supplied in config var", () => {
      // Given
      const registerNewUserFunction = auth0RuleLoader({
        ruleLocation: registerNewUserCodeLocation,
        mapOfRequiredModulesToReplaceWithMocks: mapOfModulesToOverride,
        configuration: auth0ConfigurationObject,
      });

      // When
      registerNewUserFunction(defaultUser, { idToken: {} }, mockAuth0Callback);

      // Then
      expect(mockAxios).toHaveBeenCalledTimes(1);
      const targetUrl = new URL(mockAxios.mock.calls[0][0].url);
      expect(targetUrl.origin).toBe(dummyUASDomain);
      expect(targetUrl.pathname).toBe(`/organisations/${defaultOrgId}/users`);
    });

    test(`the rule makes a POST call to the UAS passing through the user's attributes
and the first 128 bits of a hex-encoded sha256 hash of their Auth0 normalized user_id`, () => {
      // Given
      const registerNewUserFunction = auth0RuleLoader({
        ruleLocation: registerNewUserCodeLocation,
        mapOfRequiredModulesToReplaceWithMocks: mapOfModulesToOverride,
        configuration: auth0ConfigurationObject,
      });

      // When
      registerNewUserFunction(defaultUser, { idToken: {} }, mockAuth0Callback);

      // Then
      expect(mockAxios).toHaveBeenCalledTimes(1);
      const axiosCallArg = mockAxios.mock.calls[0][0];
      const hash = crypto.createHash("sha256");
      const expectedHashedUserId = hash
        .update(userId)
        .digest("hex")
        .slice(0, 32);

      expect(axiosCallArg.data).toContainEntries([
        ["accountVerified", auth0EmailVerificationStatus],
        ["name", name],
        ["profileImageLink", userProfileimageLink],
        ["id", expectedHashedUserId],
      ]);
    });

    test("the rule waits for the an HTTP response before invoking the auth0 callback", () => {
      // Given
      const delayedDataPromise = new Promise((resolveFunction) => {
        setTimeout(() => {
          resolveFunction({
            data: {},
          });
        }, 5000);
      });
      mockAxios.mockImplementation(() => delayedDataPromise);

      const registerNewUserFunction = auth0RuleLoader({
        ruleLocation: registerNewUserCodeLocation,
        mapOfRequiredModulesToReplaceWithMocks: mapOfModulesToOverride,
        configuration: auth0ConfigurationObject,
      });

      // When
      registerNewUserFunction(defaultUser, { idToken: {} }, mockAuth0Callback);

      // Then
      expect(mockAuth0Callback).not.toHaveBeenCalled();

      /**
       * This makes the setTtimeout execute instanteously for the purposes
       * of the test, accelerating the flow of virtual time.
       */
      jest.runAllTimers();

      return delayedDataPromise.then(() =>
        Promise.all([
          expect(mockAuth0Callback).toHaveBeenCalledTimes(1),
          expect(mockAuth0Callback).toHaveBeenCalledWith(null, defaultUser, {
            idToken: {
              [`${mathDojoNamespace}user_permissions`]: [],
            },
          }),
        ])
      );
    });

    test("if the call to UAS is unsuccessful, callback returns an error, the user and the context", () => {
      // Given
      const errorFromUAS = "some error from the user";
      const delayedDataPromise = new Promise(
        (_resolveFunction, rejectFunction) => {
          setTimeout(() => {
            rejectFunction(new Error(errorFromUAS));
          }, 5000);
        }
      );

      mockAxios.mockImplementation(() => delayedDataPromise);

      const registerNewUserFunction = auth0RuleLoader({
        ruleLocation: registerNewUserCodeLocation,
        mapOfRequiredModulesToReplaceWithMocks: mapOfModulesToOverride,
        configuration: auth0ConfigurationObject,
      });

      // When
      registerNewUserFunction(defaultUser, { idToken: {} }, mockAuth0Callback);

      // Then
      expect(mockAuth0Callback).not.toHaveBeenCalled();
      jest.runAllTimers();

      return delayedDataPromise
        .then(() => {
          throw new Error("promise should have been rejected");
        })
        .catch((err) => {
          if (!RegExp(errorFromUAS).test(err.message)) {
            return Promise.reject(err);
          }
          return Promise.all([
            expect(mockAuth0Callback).toHaveBeenCalledTimes(1),
            expect(mockAuth0Callback).toHaveBeenCalledWith(
              new UnauthorizedError("[0001] - error response from UAS"),
              defaultUser,
              {
                idToken: {},
              }
            ),
          ]);
        });
    });

    test("the rule adds any permissions included in the UAS response as a custom claim on the IDToken", () => {
      // Given
      const dataPromise = Promise.resolve({
        data: {
          permissions: ["CONSUMER", "CREATOR"],
        },
      });
      mockAxios.mockImplementation(() => dataPromise);

      const registerNewUserFunction = auth0RuleLoader({
        ruleLocation: registerNewUserCodeLocation,
        mapOfRequiredModulesToReplaceWithMocks: mapOfModulesToOverride,
        configuration: auth0ConfigurationObject,
      });

      // When
      registerNewUserFunction(defaultUser, { idToken: {} }, mockAuth0Callback);

      // Then
      expect(mockAuth0Callback).not.toHaveBeenCalled();

      return dataPromise.then(() =>
        Promise.all([
          expect(mockAuth0Callback).toHaveBeenCalledTimes(1),
          expect(mockAuth0Callback).toHaveBeenCalledWith(null, defaultUser, {
            idToken: {
              [`${mathDojoNamespace}user_permissions`]: ["CONSUMER", "CREATOR"],
            },
          }),
        ])
      );
    });
  }
);
