// Mock for @lobehub/editor — ESM-only package, not needed for unit tests
const React = require('react');
const MockComponent = React.forwardRef(() => null);
MockComponent.displayName = 'MockLobehubEditor';

module.exports = new Proxy({}, {
  get(_, key) {
    if (key === '__esModule') return true;
    if (key === 'default') return MockComponent;
    return MockComponent;
  },
});
