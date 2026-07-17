Interfaces:
interface Props {
Define interface `Props`
  expenses: Expense[]; -> 'expenses' is a list of Expenses
  onExportYear: (year: string) => void; -> 'onExportYear is a function that expects parameters{} and returns nothing.
  isPaid?: boolean; -> optional, isPaid is 'true' or 'false'
}
Needs to handle optional fields


Add Mouseovers: explain special keywords:
UseContext, UseEffect, UseState,

  Define Function->Function
  DeclareVariable "var 

  export const useAuth = () => useContext(AuthContext); should be treated as function definition and the first line of the function

  const [loading, setLoading] = useState(true); Pattern should say "Loading and setLoading are defined by calling useState(true)" Mousing over Loading/setLoading should show the variable's inferred/explicit type. Mousing over useState should be an explanation of useState

Need a way to show blocks better. A function, then everything called as part of the function is indented or something. Same with the pattern for rendering jsx. Say render, then show the block. Should be visually obvious that there's the closure there.


Current limitations I noticed
1. Anonymous arrow functions as arguments (e.g. queryFn: async () => {...} in useAcclimatingData.ts) aren't wrapped in a function node — their body statements become loose siblings. makeSemanticGraph.ts:48-52 only treats arrow functions as function nodes when the parent is a VariableDeclaration.
2. PascalCase component tags (Badge, Input) have no entry in TAG_DESCRIPTIONS, so they render with the raw identifier rather than a friendly noun.
3. Supabase query chains (.from().select().eq().order()) collapse into one big "Call" string with the entire chain as the function name, which is noisy. processCallExpression (makeSemanticGraph.ts:406) just takes node.expression.getText().
4. Ternary className templates (PlantRow line 18-22) are passed verbatim to translateClassName; the translator handles static classes well but the conditional ${...} interpolation produces a partial/literal description.

Include comments/docstrings in the translation

Handle constant variables definition differently.

Style of indents

Tailwind styles, each one should have its own mouseover--the popup should be a brief 1 sentence explanation of what the style does