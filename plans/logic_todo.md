## SHow source while translation is being processed
I want the source code to always be available immediately, even if the translation takes a long time.
Currently this is is what happens in App.tsx:
.then(([_sourceResult, translationResult]) => {
          setFilePath(translationResult.path);
          setViewModel(translationResult.viewModel);
        })
Ideal behavior sets the filepath before sending the promise.
Then when sourceResult is available, use it to set the sourceViewModel
Then when translationResult is available use it to set the translationViewModel

When new viewmodels are available, codeTable should only rerender the cells that have changed.

Study state of the art to see how tables populated from different sources handle this now. 
Give me at least 3 options for how to structure this, include details about types, methods for ensuring vertical sync between the views, and details about how the IPC api changes as a result of this change

## Richer Hover
View layer slimmer; Takes hasHover as nodeprop. Renders blindly whatever it gets from response to get_detail. (Can it be html?)
unlocks a hover in any shape


## Definition from JSX:
Hover JSX variable to see where its defined/where it comes from. 

## Rendering components or subcomponents
Viewer to show the hierarchy from selected node down. Fill with dummy data. 

## Deeper unpacking of values (function params stay compact now)

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

## Concept of "Path/Stack" for preferentially showing references down the stack or for showing variables in the cheater render from other places

## Handle switch statements(GetAnalyticsDateRange) is example

## Reorganize files with controllers. 
Reorganize the lib files that are only used by 1 controller so they share a parent folder with the controller.

## Back/Forward button for navigation