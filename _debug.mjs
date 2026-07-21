import { buildFileData } from './src/lib/buildFileData.ts';

const source = `function AnnualSummary() {
  const years = useMemo(() => {
    const s = new Set(expenses.map(e => e.expense_date.slice(0, 4)));
    const arr = Array.from(s).sort().reverse();
    if (!arr.length) arr.push(String(new Date().getFullYear()));
    return arr;
  }, [expenses]);
  return years;
}
`;
const result = buildFileData(source, 'AnnualSummary.tsx');
const lines = result.viewModel.lines;
lines.forEach(line => {
  if (line.nodes.length > 0) {
    const texts = line.nodes.map(n => n.spans.map(s => s.text).join(''));
    console.log('Line ' + line.lineNumber + ':', JSON.stringify(texts));
  }
});
