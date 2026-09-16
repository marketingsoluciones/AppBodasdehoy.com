const config = require('@lobehub/lint').eslint;

config.extends.push('plugin:@next/next/recommended');

config.rules['unicorn/no-negated-condition'] = 0;
config.rules['unicorn/prefer-type-error'] = 0;
config.rules['unicorn/prefer-logical-operator-over-ternary'] = 0;
config.rules['unicorn/no-null'] = 0;
config.rules['unicorn/no-typeof-undefined'] = 0;
config.rules['unicorn/explicit-length-check'] = 0;
config.rules['unicorn/prefer-code-point'] = 0;
config.rules['no-extra-boolean-cast'] = 0;
config.rules['unicorn/no-useless-undefined'] = 0;
config.rules['react/no-unknown-property'] = 0;
config.rules['unicorn/prefer-ternary'] = 0;
config.rules['unicorn/prefer-spread'] = 0;
config.rules['unicorn/catch-error-name'] = 0;
config.rules['unicorn/no-array-for-each'] = 0;
config.rules['unicorn/prefer-number-properties'] = 0;
config.rules['unicorn/prefer-query-selector'] = 0;
config.rules['unicorn/no-array-callback-reference'] = 0;
// FIXME: Linting error in src/app/[variants]/(main)/chat/features/Migration/DBReader.ts, the fundamental solution should be upgrading typescript-eslint
config.rules['@typescript-eslint/no-useless-constructor'] = 0;

config.overrides = [
  {
    extends: ['plugin:mdx/recommended'],
    files: ['*.mdx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 1,
      'no-undef': 0,
      'react/jsx-no-undef': 0,
      'react/no-unescaped-entities': 0,
    },
    settings: {
      'mdx/code-blocks': false,
    },
  },

  {
    files: ['src/store/image/**/*', 'src/types/generation/**/*'],
    rules: {
      '@typescript-eslint/no-empty-interface': 0,
      'sort-keys-fix/sort-keys-fix': 0,
      'typescript-sort-keys/interface': 0,
      'typescript-sort-keys/string-enum': 0,
    },
  },
];

// ✅ AI-Friendly code (warn no-explicit-any para visibilidad sin romper build)
config.rules['@typescript-eslint/no-explicit-any'] = 1;

// M1 (16-09): los componentes de la bandeja no hablan con el backend.
//
// El motivo no es estético. Los tres fallos del 15-09 (el nivel de IA que no persistía, el
// canal de WhatsApp desaparecido y `shared_with` perdido) fueron llamadas sueltas dentro de
// componentes, cada una con sus propios headers y su propia forma de leer la respuesta. La
// capa `bandeja/data/` centraliza credenciales y normalización; esta regla evita que la
// siguiente prisa vuelva a saltársela.
config.overrides = config.overrides || [];
config.overrides.push({
  files: ['src/app/**/bandeja/components/**/*.tsx', 'src/app/**/bandeja/components/**/*.ts'],
  rules: {
    // Aviso, no error: quedan 11 llamadas por migrar (los conectores de canal y el modal de
    // mensaje nuevo). Pasa a 'error' cuando estén en bandeja/data/ — si se pusiera ahora,
    // rompería el lint del repo por deuda que aún no hemos saldado.
    'no-restricted-globals': [
      'warn',
      {
        message:
          'Los componentes de la bandeja no llaman al backend: usa (o amplía) bandeja/data/, que pone las credenciales y normaliza la respuesta.',
        name: 'fetch',
      },
    ],
  },
});

module.exports = config;
