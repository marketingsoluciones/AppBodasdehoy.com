module.exports = {
  nanoid: () => 'test-id-' + Math.random().toString(36).slice(2, 9),
  urlAlphabet: 'abcdef',
};
