const auth0RuleLoader = require("../helpers/function-loader").loadAuth0Rule;

const registerNewUserCodeLocations = [
  ["Nonproduction", "mathdojo-nonproduction/rules/registerNewUser.js"],
];
const mathDojoNamespace = "http://math-dojo.io/";

jest.useFakeTimers();

describe.each(registerNewUserCodeLocations)(
  "%s Register New User Rule successfully calls User Account Service",
  (_environment, registerNewUserCodeLocation) => {
    const mockAxios = jest.fn().mockName("mockAxios");
    const mockAuth0Callback = jest.fn().mockName("mockAuth0Callback");
    const mapOfModulesToOverride = new Map();

    beforeEach(() => {
      mockAxios.mockClear();
      mockAuth0Callback.mockClear();
      mapOfModulesToOverride["axios@0.19.2"] = mockAxios;
    });

    test("the rule makes a POST call to the User Account Service with a key header and correct payload", () => {
      // Given
      mockAxios.mockReturnValue(
        Promise.resolve({
          data: {
            permissions: [],
          },
        })
      );

      const auth0ConfigurationObject = {
        userAccountServiceDomain: "http://local.domain",
        userAccountServiceApiKey: "supersecret",
      };

      const registerNewUserFunction = auth0RuleLoader({
        ruleLocation: registerNewUserCodeLocation,
        mapOfRequiredModulesToReplaceWithMocks: mapOfModulesToOverride,
        configuration: auth0ConfigurationObject,
      });

      // When
      registerNewUserFunction({}, { idToken: {} }, mockAuth0Callback);

      // Then
      expect(mockAxios).toHaveBeenCalledTimes(1);
      expect(mockAxios.mock.calls[0][0]).toContainEntries([["method", "POST"]]);
      expect(mockAxios.mock.calls[0][0].headers).toContainEntries([
        ["Content-Type", "application/json"],
        ["X-API-Key", auth0ConfigurationObject.userAccountServiceApiKey],
      ]);
    });

    test("the rule waits for the an HTTP response before invoking the auth0 callback", () => {
      // Given
      mockAxios.mockImplementation(
        () =>
          new Promise((resolveFunction) => {
            setTimeout(() => {
              resolveFunction({
                data: {
                  permissions: [],
                },
              });
            }, 5000);
          })
      );

      const auth0ConfigurationObject = {
        userAccountServiceDomain: "http://local.domain",
      };

      const registerNewUserFunction = auth0RuleLoader({
        ruleLocation: registerNewUserCodeLocation,
        mapOfRequiredModulesToReplaceWithMocks: mapOfModulesToOverride,
        configuration: auth0ConfigurationObject,
      });

      // When
      registerNewUserFunction({}, { idToken: {} }, mockAuth0Callback);

      // Then
      expect(mockAuth0Callback).not.toHaveBeenCalled();

      /**
       * This makes the setTtimeout execute instanteously for the purposes
       * of the test, accelerating the flow of virtual time.
       */
      jest.runAllTimers();

      /**
       * The previous execution of setTimeout put the function waiting for
       * the return data from mockAxios's promise at the front of the Node.js
       * Job Queue.
       * The test now needs to wait for the invocation of that function which
       * will happen during the next "tick" of the event loop. Checking the
       * auth0 callback prior to this will fail because, the asynchronous event
       * has just not been processed yet.
       * The simple way to "wait" is to perform the assertions as another activity
       * within the Job Queue during the same tick of the loop, i.e.the instantaneous
       * resolution of a new promise, whose "downstream function" will now sit behind
       * the one already queued by setTimeout.
       */
      return Promise.resolve().then(() =>
        Promise.all([
          expect(mockAuth0Callback).toHaveBeenCalledTimes(1),
          expect(mockAuth0Callback).toHaveBeenCalledWith(
            null,
            {},
            {
              idToken: {
                [`${mathDojoNamespace}user_permissions`]: [],
              },
            }
          ),
        ])
      );
    });
  }
);
