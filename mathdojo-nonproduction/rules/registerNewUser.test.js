const vm = require("vm");
const fs = require("fs");
const path = require("path");

const registerNewUserCodeLocation =
  "mathdojo-nonproduction/rules/registerNewUser.js";
const registerNewUserCode = fs.readFileSync(
  path.join(process.cwd(), registerNewUserCodeLocation),
  { encoding: "utf-8" }
);

test("the rule calls axios", () => {
  const mockAxios = jest
    .fn()
    .mockName("mockAxios")
    .mockResolvedValue({
      data: {
        permissions: [],
      },
    });
  const mockRequire = jest
    .fn()
    .mockName("mockRequire")
    .mockImplementationOnce(() => mockAxios);

  const registerNewUserFunction = vm.runInNewContext(
    `(()=>{return ${registerNewUserCode}})();`,
    {
      require: mockRequire,
      configuration: {
        userAccountServiceDomain: "localdomain",
      },
    },
    {
      filename: registerNewUserCodeLocation,
      displayErrors: true,
    }
  );
  const mockAuth0Callback = jest.fn();

  registerNewUserFunction({}, {}, mockAuth0Callback);
  expect(mockAuth0Callback.mock.calls.length).toBe(1);
});
