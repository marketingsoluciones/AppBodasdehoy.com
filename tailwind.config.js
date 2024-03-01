const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './layouts/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      "body": ['Montserrat', ...defaultTheme.fontFamily.sans],
      "display": ['Poppins', ...defaultTheme.fontFamily.sans],
      "title": ['Italiana', ...defaultTheme.fontFamily.sans],
    },
    extend: {
      colors: {
        primary: `var(--color-primary)`,
        secondary: `var(--color-secondary)`,
        tertiary: `var(--color-tertiary)`,
        "color-base": `var(--color-base)`,
        base: "#F2F2F2",
        green: "#13ce66",
        red: "#fa0202",
        basePage: "#F6F6F6",
        primaryOrg: "#6096B9",
        secondaryOrg: "#284C77",
        acento: "#F4C02F",
        titelCard: "#B5B5B5",
        textGrisClaro: "#727272",
        'azulCorporativo': '#49516F'
      },
      transitionProperty: {
        'height': 'height'
      },
      spacing: {
        '182px': '177.5px',
        '20px': '23px',
        '267px': '136px',
        '17px': '17px'
      },
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      }
    }
  },
  // corePlugins: {
  //   preflight: false,
  // },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp')
  ],

}
