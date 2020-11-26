const auth0RuleLoader = require('../helpers/function-loader').loadAuth0Rule;

const registerNewUserCodeLocations = [
  ['Nonproduction', 'mathdojo-nonproduction/rules/registerNewUser.js'],
];
const mathDojoNamespace = 'http://math-dojo.io/';

jest.useFakeTimers();

describe.each(registerNewUserCodeLocations)(
  '%s Register New User Rule successfully calls User Account Service',
  (_environment, registerNewUserCodeLocation) => {
    const mockAxios = jest.fn().mockName('mockAxios');
    const mockAuth0Callback = jest.fn().mockName('mockAuth0Callback');

    beforeEach(() => {
      mockAxios.mockClear();
      mockAuth0Callback.mockClear();
    });

    test('the rule waits for the axios resolution before calling callback', () => {
      // Given
      mockAxios.mockImplementation(
        () => new Promise((resolveFunction) => {
          setTimeout(() => {
            resolveFunction({
              data: {
                permissions: [],
              },
            });
          }, 5000);
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
      registerNewUserFunction({}, { idToken: {} }, mockAuth0Callback);

      // Then
      expect(mockAuth0Callback).not.toHaveBeenCalled();

    /**
   * This makes the setTtimeout execute instanteously for the purposes
   * of the test, accelerating the flow of virtual time.
   */
      jest.runAllTimers();

      return Promise.resolve().then(() => Promise.all([
        expect(mockAuth0Callback).toHaveBeenCalledTimes(1),
        expect(mockAuth0Callback).toHaveBeenCalledWith(null, {}, {
          idToken: {
            [`${mathDojoNamespace}user_permissions`]: [],
          },
        }),
      ]));
    });
  },
);
