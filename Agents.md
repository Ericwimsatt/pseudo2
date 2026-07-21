## QA
every change should be checked for quality
### Testing
Always run the app from a port other than 5173. 5173 is reserved for human-run instances.
For every change, run the app and exercise the new behavior. Test it from a few different angles. Use Playwright to test interactions with the page, and take screenshots to confirm the visual appearance of the page after doing those interactions
    1. If the behavior doesn't work, edit the code again and retest. 
    2. If other unrelated functionality has changed, edit the change so the differences are isolated. If you think its a pre-existing bug, flag to the user and ask for user input.
### Lint
Always run a lint to check for syntax and type errors. Generally the solution to the type error is to fix the type or fix the call, not to bypass typechecking or make things options
npx tsc --noEmit

## Translation principle
Keep it as simple as possible. Lua, the language, only has variables, tables, and functions. I want to represent typescript as close to this as possible