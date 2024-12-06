# Curiosity Report

I have decided to do my curiosity report on vitest which is a testing framework native to vite.

- [Website](https://vitest.dev/)
- [Documentation](https://vitest.dev/guide/why.html)
- [Try Vitest in the Browser](https://vitest.new/)

## Vitest Features

- Built on top of Vite and is really fast.
- Can be used to test your React components.
- You can watch your tests run directly in the browser with Vitest UI. Runs and updates automatically while you write your tests. It only runs tests that have had changes made.
- Works with `v8` or `istanbul` for code coverage.
- Vitest uses the same configuration file as `vite.config`.
- Works out of the box for both JavaScript and TypeScript.
- Uses a lot of the same syntax as Jest for creating tests. In fact, it can run Jest tests.
- Also has a [VS Code extension](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) that includes coverage support.

## Get started

1. Run `npm install vitest`.
2. Add the following to your `package.json`:
   ```json
   {
     "scripts": {
       "test": "vitest"
     }
   }
   ```
3. Vitest will read your root `vite.config.js` to match with the plugins and setup as your Vite app.
4. Test file names should include either `.test.` or `.spec.`.
