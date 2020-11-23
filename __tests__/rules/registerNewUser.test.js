const auth0RuleLoader = require("../helpers/function-loader").loadAuth0Rule;
const registerNewUserCodeLocation =
  "mathdojo-nonproduction/rules/registerNewUser.js";

describe("Register New User Rule successfully calls User Account Service", () => {
  const mockAxios = jest.fn().mockName("mockAxios");
  const mockAuth0Callback = jest.fn().mockName("mockAuth0Callback");

  beforeEach(() => {
    mockAxios.mockClear();
    mockAuth0Callback.mockClear();
  });

  test("the rule calls axios", () => {
    // Given
    mockAxios.mockResolvedValue({
      data: {
        permissions: [],
      },
    });

    const mapOfModulesToOverride = new Map();
    mapOfModulesToOverride["axios@0.19.2"] = mockAxios;

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
});
