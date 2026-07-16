
type DisplayNodeKind =
    | "function"
    | "variable"
    | "assignment"
    | "loop"
    | "condition"
    | "component"
    | "jsx"
    | "hook"
    | "type"
    | "import"
    | "export"
    | "comment"
    | "value"
    | "call"
    | "operator";
    

type Decoration = 
    //I'll add more decorations later.
    "collapsible";// If a node is collapsible, the entire line has a svg [-] icon on the left, when clicked all children collapse on both the source and the translation code tables.

interface displayNodeProps{
    kind: DisplayNodeKind,//for styling
    onHover?: () => void, //function that returns the component that appears when hovered
    //if onHover, appear underlined
    text: string,
    decorations: Decoration[];

}


//react component