const auth0RuleLoader = require('../helpers/function-loader').loadAuth0Rule;

const registerNewUserCodeLocations = [
  ['Nonproduction', 'mathdojo-nonproduction/rules/registerNewUser.js'],
];

describe.each(registerNewUserCodeLocations)(
  '%s Register New User Rule successfully calls User Account Service',
  (environment, registerNewUserCodeLocation) => {
    const mockAxios = jest.fn().mockName('mockAxios');
    const mockAuth0Callback = jest.fn().mockName('mockAuth0Callback');

    beforeEach(() => {
      mockAxios.mockClear();
      mockAuth0Callback.mockClear();
    });

    test('the rule waits for the axios resolution before calling callback', () => {
      // Given
      mockAxios.mockImplementation(
        () => new Promise((resolveFunction, rejectFunction) => {
          setTimeout(() => {
            resolveFunction({
              data: {
                permissions: [],
              },
            });
          }, 1000);
        }),
      );

      const mapOfModulesToOverride = new Map();
      mapOfModulesToOverride['axios@0.19.2'] = mockAxios;

      const auth0ConfigurationObject = {
        userAccountServiceDomain: 'localdomain',
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
  },
);
