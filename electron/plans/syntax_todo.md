Interfaces:
interface Props {
Define interface `Props`
  expenses: Expense[];
  `expenses` is a Expense[] -> 'expenses' is a list of Expenses
  onExportYear: (year: string) => void;
  `onExportYear` is a (year: string) => void -> 'onExportYear is a function that takes a string called year as an argument and returns nothing.
}
Add Mouseovers: explain special keywords:
UseContext, UseEffect, UseState,

  Define Function->Function
  DeclareVariable "var 

  export const useAuth = () => useContext(AuthContext); should be treated as function definition and the first line of the function

  const [loading, setLoading] = useState(true); Pattern should say "Loading and setLoading are defined by calling useState(true)" Mousing over Loading/setLoading should show the variable's inferred/explicit type. Mousing over useState should be an explanation of useState

Need a way to show blocks better. A function, then everything called as part of the function is indented or something. Same with the pattern for rendering jsx. Say render, then show the block. Should be visually obvious that there's the closure there.