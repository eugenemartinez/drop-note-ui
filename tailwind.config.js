/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        // Typography configuration might also need adjustment for v4
        // or removal if using default v4 styles
      },
    },
    plugins: [
      // Remove incompatible v3 plugins
      // require('@tailwindcss/line-clamp'),
      // require('@tailwindcss/forms'), // If you have this, remove it too
      // require('@tailwindcss/typography'), // If you have this, remove it too
    ],
  }