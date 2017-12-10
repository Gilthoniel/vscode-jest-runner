const { activate, deactivate } = require('./extension');

// Defines a Mocha test suite to group tests of similar kind together
describe("Extension Tests", function() {
  // Defines a Mocha unit test
  it("should activate and deactivate the extension", function() {
    const context = { subscriptions: { push: jest.fn() } };

    deactivate();
    activate(context);
    expect(context.subscriptions.push).toHaveBeenCalledTimes(3);

    deactivate();
  });
});