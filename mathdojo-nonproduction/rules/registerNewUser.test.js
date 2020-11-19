const auth0RuleLoader = require("../../testing/helpers").loadAuth0Rule;
const registerNewUserCodeLocation =
  "mathdojo-nonproduction/rules/registerNewUser.js";

test("the rule calls axios", () => {
  // Given
  const mockAxios = jest
    .fn()
    .mockName("mockAxios")
    .mockResolvedValue({
      data: {
        permissions: [],
      },
    });

  const mapOfModulesToOverride = new Map();
  mapOfModulesToOverride["axios@0.19.2"] = mockAxios;

  const mockAuth0Callback = jest.fn();
  const auth0ConfigurationObject = {
    userAccountServiceDomain: "localdomain",
  };

  const registerNewUserFunction = auth0RuleLoader({
    ruleLocation: registerNewUserCodeLocation,
    mapOfRequiredModulesToReplaceWithMocks: mapOfModulesToOverride,
    configuration: auth0ConfigurationObject,
  });

  // When
  registerNewUserFunction({}, {}, mockAuth0Callback);

  // Then
  expect(mockAuth0Callback.mock.calls.length).toBe(3);
});
