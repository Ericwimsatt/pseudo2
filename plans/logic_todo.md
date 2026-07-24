# display 

## background color cycle stops at yellow and repeats forever

## Use colors, add support for themes
shiki library for source

## Rendering components or subcomponents
Viewer to show the hierarchy from selected node down. Fill with dummy data. 

## Back/Forward button for navigation

## Collapsible elements

# Translation
## More things should have named params
especially common imports-can hardcode these, or have them installable as plugins??

## Concept of children- for punctuation

# enrichment

## Imports should count as vars for purpose of hovers--Do this at same time we do the multi-file stuff

## For enriching, don't show the source of the hover when showing definitions/refrences

## Yellow Highlight shouldn't be permanent when navigating to specific line.

## References/Definition across different files
Use ts-morph to show references and definitions of variables/functions/types across the project. Cap it at max 5 references for space. the UI for many references is:
References: 12
FileName:LineNnumber
[snippet]
FileName:LineNnumber
[snippet]
FileName:LineNnumber
[snippet]
FileName:LineNnumber
[snippet]
FileName:LineNnumber
[snippet]
FileName:LineNnumber [+]
FileName:LineNnumber[+]
FileName:LineNnumber[+]
FileName:LineNnumber [+]
FileName:LineNnumber[+]
FileName:LineNnumber[+]
FileName:LineNnumber [+]
Clicking the plus shows a snippet where its used.

# Language

## Switch statement, each case gets more indented

## Interfaces are types

## ? clause handling:
`met` = reverse ? current <= target : current >= target
  const warning = reverse ? pct >= 75 && !met : pct >= 75 && pct < 100;
`warning` = reverse ? pct >= 75 && !met : pct >= 75 && pct < 100

## Function invocations should look up function definition and use the real parameter names

## Deeper unpacking of values (function params stay compact now)
return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

## Declarations are multiline:
`actionTypes` = { ADD_TOAST: "ADD_TOAST", UPDATE_TOAST: "UPDATE_TOAST", DISMISS_TOAST: "DISMISS_TOAST", REMOVE_TOAST: "REMOVE_TOAST", } as const

# Deep Future

## Concept of "Path/Stack" for preferentially showing references down the stack or for showing variables in the cheater render from other places

