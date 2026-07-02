Interfaces:
interface Props {
Define interface `Props`
  expenses: Expense[];
  `expenses` is a Expense[] -> 'expenses' is a list of Expenses
  onExportYear: (year: string) => void;
  `onExportYear` is a (year: string) => void -> 'onExportYear is a function that takes a string called year as an argument and returns nothing.