## Definition from JSX:
Hover JSX variable to see where its defined/where it comes from. 

## Rendering components or subcomponents
Viewer to show the hierarchy from selected node down. Fill with dummy data. 

## Deeper unpacking of values (function params stay compact now)


## Concept of "Path/Stack" for preferentially showing references down the stack or for showing variables in the cheater render from other places



## Back/Forward button for navigation



## Simpler Testing primitives

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