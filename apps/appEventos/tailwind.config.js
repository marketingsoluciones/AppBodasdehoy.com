const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
    // crm-ui (NotesPanel, etc.) vive en shared; sin esto Tailwind purga bg-violet-* → botón invisible
    '../../packages/shared/src/crm-ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      "body": ['Montserrat', ...defaultTheme.fontFamily.sans],
      "display": ['Poppins', ...defaultTheme.fontFamily.sans],
      "title": ['Italiana', ...defaultTheme.fontFamily.sans],
      "playfair": ['playfair Display', ...defaultTheme.fontFamily.sans],
      "Clicker": ['Clicker Script', ...defaultTheme.fontFamily.sans],
      'calibri': ['calibri', 'sans-serif'],
      'segoe-historic': ['"Segoe UI Historic"', '"Segoe UI"', 'Arial', 'sans-serif'],
      'optimistic': ['"Optimistic 95"', 'sans-serif'],
    },
    extend: {
      colors: {
        // Respaldos = los valores REALES de bodasdehoy (developments.ts), no tonos de
        // Tailwind. Eran #ec4899 (que no es de ninguna marca), #f472b6 y #f9a8d4 (dos
        // rosas donde la marca tiene verde menta y amarillo). El respaldo es lo que se
        // ve mientras la variable no está resuelta, o sea el primer paint de cada carga,
        // y `primary` solo se usa 923 veces en la app.
        primary: `var(--color-primary, #EF5B94)`,
        secondary: `var(--color-secondary, #87F3B5)`,
        tertiary: `var(--color-tertiary, #FBFF4E)`,
        "color-base": `var(--color-base, #F2F2F2)`,
        base: `var(--color-base, #F2F2F2)`,
        green: "#13ce66",
        red: "#fa0202",
        basePage: "#F6F6F6",
        // OJO, esto está sin decidir (JCP, 18-09): estos cuatro tokens leen las MISMAS
        // variables que primary/secondary/tertiary, así que resuelven al color del
        // whitelabel ACTIVO — no al color que dice su nombre. Sus respaldos son de otra
        // marca (#6096B9 y #284C77 son de eventosorganizador) o fijos (#F4C02F,
        // #49516F), de modo que en bodasdehoy estos 70 usos destellan AZUL antes de que
        // la variable resuelva. No se tocan hasta saber la intención: si deben seguir a
        // la marca, el respaldo tiene que ser el de bodasdehoy; si deben ser un color
        // fijo, no deberían leer la variable.
        primaryOrg: `var(--color-primary, #6096B9)`,
        secondaryOrg: `var(--color-secondary, #284C77)`,
        acento: `var(--color-tertiary, #F4C02F)`,
        titelCard: "#B5B5B5",
        textGrisClaro: "#727272",
        'azulCorporativo': `var(--color-secondary, #49516F)`
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
        '48': 'repeat(48, minmax(0, 1fr))',
        '28': 'repeat(28, minmax(0, 1fr))',
        '10': 'repeat(10, minmax(0, 1fr))',
        '11': 'repeat(11, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
        '15': 'repeat(15, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
        '17': 'repeat(17, minmax(0, 1fr))',
        '18': 'repeat(18, minmax(0, 1fr))',
        '19': 'repeat(19, minmax(0, 1fr))',


      }
    }
  },
  // corePlugins: {
  //   preflight: false,
  // },
  plugins: [
    require('@tailwindcss/forms'),
  ],

}
