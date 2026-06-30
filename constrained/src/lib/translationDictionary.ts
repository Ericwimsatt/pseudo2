import { SemanticNode } from './makeSemanticGraph';

type Translator = (node: SemanticNode) => string;

const translations: Record<string, Translator> = {
  import: (node) => {
    const names = node.metadata.importedNames.join(', ');
    const module = node.metadata.module;
    return `${names} ${names.includes(',') ? 'are' : 'is'} imported from ${module}`;
  },

  export: (node) => {
    const names = node.metadata.exportedNames.join(', ');
    const module = node.metadata.module;
    if (module) {
      return `${names} ${names.includes(',') ? 'are' : 'is'} re-exported from ${module}`;
    }
    return `${names} ${names.includes(',') ? 'are' : 'is'} exported`;
  },

  function: (node) => {
    const params = node.metadata.parameters.join(', ');
    const paramText = params ? `Parameters: ${params}` : 'No parameters';
    return `Define function \`${node.name}\`. ${paramText}`;
  },

  method: (node) => {
    const params = node.metadata.parameters.join(', ');
    const paramText = params ? `Parameters: ${params}` : 'No parameters';
    return `Define method \`${node.name}\`. ${paramText}`;
  },

  class: (node) => {
    const extendsText = node.metadata.extends ? ` (extends ${node.metadata.extends})` : '';
    return `Define class \`${node.name}\`${extendsText}`;
  },

  interface: (node) => {
    return `Define interface \`${node.name}\``;
  },

  typeAlias: (node) => {
    return `Define type \`${node.name}\` as ${node.metadata.type}`;
  },

  property: (node) => {
    const type = node.metadata.type;
    const init = node.metadata.initializer;
    let text = `\`${node.name}\` is a ${type}`;
    if (init) {
      text += `, initialized to ${init}`;
    }
    return text;
  },

  variable: (node) => {
    const type = node.metadata.type;
    const init = node.metadata.initializer;
    let text = `Declare variable \`${node.name}\``;
    if (init) {
      text += ` = ${init}`;
    }
    return text;
  },

  return: (node) => {
    const value = node.metadata.value;
    if (value) {
      return `return \`${value}\``;
    }
    return `return`;
  },

  if: (node) => {
    return `If ${node.metadata.condition}`;
  },

  loop: (node) => {
    const loopType = node.metadata.loopType;
    if (loopType === 'for') {
      return `Loop`;
    } else if (loopType === 'forOf') {
      return `For each item`;
    } else if (loopType === 'forIn') {
      return `For each key`;
    }
    return `Loop`;
  },

  call: (node) => {
    const func = node.metadata.function;
    const args = node.metadata.arguments.join(', ');
    if (args) {
      return `Call ${func} with ${args}`;
    }
    return `Call ${func}`;
  }
};

export function translateNode(node: SemanticNode): string {
  const translator = translations[node.type];
  if (translator) {
    return translator(node);
  }
  return `[${node.type}]`;
}

export function translateGraph(nodes: SemanticNode[]): string[] {
  const lines: string[] = [];

  function processNode(node: SemanticNode) {
    const indent = '  '.repeat(node.indent);
    const text = translateNode(node);
    lines.push(indent + text);

    node.children.forEach(child => processNode(child));
  }

  nodes.forEach(node => processNode(node));
  return lines;
}
