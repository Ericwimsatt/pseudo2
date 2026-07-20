## SHow source while translation is being processed
.then(([_sourceResult, translationResult]) => {
          setFilePath(translationResult.path);
          setViewModel(translationResult.viewModel);
        })
Should use sourceResult.
Set the file path before process completes
then use sourceResult to render the source side
then use translationResult to render translation side

## Richer Hover
View layer slimmer; Takes hasHover as nodeprop. Renders blindly whatever it gets from response to get_detail. (Can it be html?)
unlocks a hover in any shape

## Navigation
Use 'URL' or url-like scheme to navigage within project. URL is filepath from root. Enable additional query to jump to sourceline number, translation line number or specific variables
Ctrl+F search might be a prerequisite

## Definition from JSX:
Hover JSX variable to see where its defined/where it comes from. 

## Rendering components or subcomponents
Viewer to show the hierarchy from selected node down. Fill with dummy data. 