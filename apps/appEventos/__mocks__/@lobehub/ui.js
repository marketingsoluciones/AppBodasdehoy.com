// Mock for @lobehub/ui — ESM-only package, not needed for unit tests
const React = require('react');
const noop = () => {};
const MockComponent = React.forwardRef(() => null);
MockComponent.displayName = 'MockLobehubUI';

module.exports = new Proxy({}, {
  get(_, key) {
    if (key === '__esModule') return true;
    if (key === 'default') return MockComponent;
    return MockComponent;
  },
});
