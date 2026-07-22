#!/usr/bin/env node
import { readFileSync, writeFileSync, watch } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const JSON_PATH = resolve(ROOT, 'config', 'phrasing-rules.json');
const HTML_PATH = resolve(ROOT, 'docs', 'phrasing-rules.html');

const EXAMPLES = {
  'import':                        { code: 'import { useState } from \'react\'',            vars: { names: 'useState', module: 'react' } },
  'export':                        { code: 'export { x }',                                 vars: { names: 'x', verb: 'is' } },
  'export-re-export':              { code: 'export { x } from \'./y\'',                     vars: { names: 'x', verb: 'is', module: './y' } },
  'function-definition':           { code: 'function greet(name: string)',                  vars: { name: 'greet', params: 'name' } },
  'function-definition-no-params': { code: 'function bar()',                               vars: { name: 'bar' } },
  'function-definition-anonymous': { code: 'function() {}',                                vars: {} },
  'class':                         { code: 'class Foo',                                     vars: { name: 'Foo' } },
  'class-extended':                { code: 'class Foo extends Bar',                         vars: { name: 'Foo', extends: 'Bar' } },
  'interface':                     { code: 'interface Foo',                                 vars: { name: 'Foo' } },
  'type-alias':                    { code: 'type Foo = string',                             vars: { name: 'Foo', type: 'string' } },
  'property':                      { code: 'name: string',                                  vars: { name: 'name', type: 'text' } },
  'property-with-init':            { code: 'count: number = 42',                            vars: { name: 'count', type: 'a number', initializer: '42' } },
  'variable-assignment':           { code: 'const x = 42',                                  vars: { name: 'x', initializer: '42' } },
  'variable-assignment-target':    { code: 'let x; x =',                                   vars: { name: 'x' } },
  'return-jsx':                    { code: 'return (<div/>)',                               vars: {} },
  'return-value':                  { code: 'return x',                                      vars: { value: 'x' } },
  'return':                        { code: 'return;',                                       vars: {} },
  'if':                            { code: 'if (x > 0)',                                    vars: { condition: 'x > 0' } },
  'otherwise-if':                  { code: 'else if (y > 0)',                               vars: { condition: 'y > 0' } },
  'otherwise':                     { code: 'else',                                          vars: {} },
  'loop-for-of':                   { code: 'for (const x of items)',                        vars: { itemName: 'x', collection: 'items' } },
  'loop-for-in':                   { code: 'for (const k in obj)',                          vars: { collection: 'obj' } },
  'loop':                          { code: 'while (true)',                                  vars: {} },
  'call-function':                 { code: 'foo()',                                         vars: { function: 'foo' } },
  'instantiate':                   { code: 'new Foo()',                                     vars: { function: 'Foo' } },
  'jsx-element':                   { code: '<div>...</div>',                                vars: { name: 'div' } },
  'jsx-self-closing':              { code: '<br />',                                        vars: { name: 'br' } },
  'jsx-fragment':                  { code: '<>...</>',                                      vars: {} },
  'jsx-list':                      { code: '{items.map(i => <li/>)}',                       vars: { itemName: 'i', collection: 'items' } },
  'jsx-filter':                    { code: '{items.filter(x => x > 0)}',                    vars: { collection: 'items', condition: 'x > 0' } },
  'jsx-conditional':               { code: '{cond && <div/>}',                              vars: { condition: 'cond' } },
  'jsx-conditional-ternary':       { code: '{cond ? <A/> : <B/>}',                          vars: { condition: 'cond' } },
  'jsx-conditional-alt':           { code: '{elseBranch}',                                  vars: {} },
  'jsx-text':                      { code: '<div>Hello</div>',                              vars: { text: 'Hello' } },
  'jsx-expression-identifier':     { code: '{name}',                                        vars: { expression: 'name' } },
  'jsx-expression-template':       { code: '{`Hello ${n}`}',                                vars: { expression: '`Hello ${n}`' } },
  'jsx-expression':                { code: '{count + 1}',                                   vars: { expression: 'count + 1' } },
  'object-literal':                { code: 'const obj = {',                                 vars: {} },
  'object-literal-close':          { code: '}',                                              vars: {} },
  'object-property':               { code: 'a: 1',                                          vars: { name: 'a', value: '1' } },
  'object-property-method':        { code: 'foo() { ... }',                                 vars: { name: 'foo' } },
  'object-property-spread':        { code: '...other',                                      vars: { name: '...other' } },
};

function fillTemplate(template, vars) {
  return template.replace(/\{(\w+)(?:@(?:ref|hover))?\}/g, (_, key) => {
    if (key in vars) return String(vars[key]);
    return `{${key}}`;
  });
}

function generateHTML(rules) {
  const rows = rules.map(rule => {
    const example = EXAMPLES[rule.type];
    if (!example) return '';
    const translated = fillTemplate(rule.template, example.vars);
    const escapedCode = example.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedRule = rule.template.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedTranslated = translated.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <tr>
        <td><code>${rule.type}</code></td>
        <td><code>${escapedCode}</code></td>
        <td><code>${escapedRule}</code></td>
        <td>${escapedTranslated}</td>
      </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pseudo Phrasing Rules</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #fafafa; }
  h1 { color: #333; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
  .info { color: #666; font-size: 0.9em; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th { background: #1e293b; color: white; padding: 12px 16px; text-align: left; font-weight: 600; }
  td { padding: 10px 16px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:hover td { background: #f1f5f9; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; color: #334155; }
  td code { background: #f8fafc; }
  th:first-child { width: 180px; }
  th:nth-child(2) { width: 250px; }
  th:nth-child(3) { width: 350px; }
</style>
</head>
<body>
<h1>Pseudo Phrasing Rules</h1>
<p class="info">Source: <code>config/phrasing-rules.json</code> &mdash; Last generated: ${new Date().toISOString()}</p>
<table>
  <thead>
    <tr>
      <th>Type</th>
      <th>Example</th>
      <th>Rule (Template)</th>
      <th>Example Translation</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
</body>
</html>`;
}

function build() {
  const json = readFileSync(JSON_PATH, 'utf8');
  const rules = JSON.parse(json);
  const html = generateHTML(rules);
  writeFileSync(HTML_PATH, html, 'utf8');
  console.log(`Generated ${HTML_PATH} (${rules.length} rules)`);
}

const isWatch = process.argv.includes('--watch');

build();

if (isWatch) {
  console.log('Watching for changes...');
  watch(JSON_PATH, () => {
    try {
      build();
    } catch (err) {
      console.error('Build failed:', err.message);
    }
  });
}
