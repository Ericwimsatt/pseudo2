Create a local web application that translates typescript files into text that is more readable to non-coders.
The overall page design is a sidebar on the left, and 2 main panels in the center and to the right. Sidebar is a file navigation through the repository. Center panel is the sourceCode for the file, right panel is a translated version of the source code.
Start by creating a site that can load a repository from a local file. Display the file tree. Clicking a file should focus it for the displayPanels. Clicking a file should move the url to a /file/{path to file from root}.
Center panel just displays the source of the file. Show line numbers on the left.
Right panel shows pseudo code for the file. Here's how to generate:
Get an AST From the source file.
Use AST to build a semantic graph for the file.
Each type of semantic node translates to an english sentence.
Example: 
Define function `calculateTotal`. Parameters: price, quantity.
[indent ] output = price * quantity
            returns `output`
Example: Layout is imported from ./Layout

The function to makeAST and make semantic graph should be in different files. 
Create a file that serves as a dictionary to translate types of semantic nodes and relationships between nodes to english. 

Use Node where needed for the backend.
Make the interface with tailwind and React. React classes can directly invoke typescript functions in other files. (There should be very few, if any useState/useEffect)
Treat the imported repo as the database, everything else should be derived from that. There should be no other stored state. Refreshing on a page url/{path_to_file} should read that file, make an ast, make a semantic graph, and display english from that.

Test this by launching a browser, opening the ericwimsatt/git/stemwise repo. Confirm that you can open a file, and view the english translation
