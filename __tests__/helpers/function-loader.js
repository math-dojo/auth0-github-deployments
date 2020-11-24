const vm = require('vm');
const fs = require('fs');
const path = require('path');

const cachedRuleCode = new Map();

/**
 *
 * @param {Object} loadingConfigurationOptions - configuration object for loading an Auth0 rule
 * @param { string } loadingConfigurationOptions.ruleLocation - the location of the file
 *  relative to the project root
 * @param { Map<string, object> } loadingConfigurationOptions.configuration - a map of vars to
 * provide  as the Auth0 configuration global
 * @param { Map<string, object> } loadingConfigurationOptions.mapOfRequiredModulesToReplaceWithMocks
 *  - a map of mocks to be used as substitutes for required modules. The key of each item should
 *  correspond with the string supplied to `require` to import the module.
 * @returns {Function}
 */
function loadAuth0Rule({
  ruleLocation,
  configuration,
  mapOfRequiredModulesToReplaceWithMocks,
}) {
  if (!(ruleLocation in cachedRuleCode)) {
    const ruleCode = fs.readFileSync(path.join(process.cwd(), ruleLocation), {
      encoding: 'utf-8',
    });
    cachedRuleCode[ruleLocation] = ruleCode;
  }
  const mockRequire = jest
    .fn()
    .mockName('mockRequire')
    .mockImplementation(
      (moduleName) => mapOfRequiredModulesToReplaceWithMocks[moduleName],
    );

  const loadedRuleFunction = vm.runInNewContext(
    `(()=>{return ${cachedRuleCode[ruleLocation]}})();`,
    {
      require: mockRequire,
      configuration,
      console,
    },
    {
      filename: ruleLocation,
      displayErrors: true,
    },
  );

  return loadedRuleFunction;
}

module.exports = {
  loadAuth0Rule,
};
