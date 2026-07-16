import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';
import { getReactHookTooltip } from '../../lib/renderable/hover/react';
import { translateType } from '../../lib/renderable/translateType';

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

type Decoration = "collapsible";

interface displayNodeProps {
    kind: DisplayNodeKind;
    onHover?: () => void;
    text: string;
    decorations: Decoration[];
}

function getDisplayKind(nodeType: string): DisplayNodeKind {
    const mapping: Record<string, DisplayNodeKind> = {
        import: 'import',
        export: 'export',
        function: 'function',
        method: 'function',
        class: 'component',
        interface: 'type',
        typeAlias: 'type',
        property: 'variable',
        variable: 'variable',
        return: 'value',
        if: 'condition',
        loop: 'loop',
        call: 'call',
        'jsx-element': 'jsx',
        'jsx-fragment': 'jsx',
        'jsx-list': 'jsx',
        'jsx-filter': 'jsx',
        'jsx-conditional': 'jsx',
        'jsx-conditional-alt': 'jsx',
        'jsx-text': 'jsx',
        'jsx-expression': 'jsx',
    };
    return mapping[nodeType] ?? 'variable';
}

function ImportNode({ node }: { node: SemanticNode }) {
    const names = String(node.name ?? '');
    const module = String(node.metadata.module ?? '');
    const verb = names.includes(',') ? 'are imported from' : 'is imported from';
    return (
        <>
            <StyledSpan text="import " />
            <StyledSpan text={names} />
            <StyledSpan text={` ${verb} `} />
            <StyledSpan text={module} hoverTitle="Module" hoverBody={module} />
        </>
    );
}

function ExportNode({ node }: { node: SemanticNode }) {
    const names = String(node.name ?? '');
    const module = String(node.metadata.module ?? '');
    const verb = names.includes(',') ? 'are' : 'is';
    if (module) {
        return (
            <>
                <StyledSpan text="export " />
                <StyledSpan text={names} />
                <StyledSpan text={` ${verb} re-exported from `} />
                <StyledSpan text={module} hoverTitle="Module" hoverBody={module} />
            </>
        );
    }
    return (
        <>
            <StyledSpan text="export " />
            <StyledSpan text={names} />
            <StyledSpan text={` ${verb} exported`} />
        </>
    );
}

function FunctionNode({ node }: { node: SemanticNode }) {
    const params = (node.metadata.parameters as string[]) ?? [];
    const paramText = params.length > 0 ? `Parameters: ${params.join(', ')}` : 'No parameters';
    const verb = node.type === 'method' ? 'method' : 'function';
    return (
        <>
            <StyledSpan text={`Define ${verb} `} />
            <StyledSpan text={node.name ?? 'anonymous'} />
            <StyledSpan text={`. ${paramText}`} />
        </>
    );
}

function ClassNode({ node }: { node: SemanticNode }) {
    const extendsText = node.metadata.extends ? ` (extends ${node.metadata.extends})` : '';
    return (
        <>
            <StyledSpan text="Define class " />
            <StyledSpan text={node.name ?? 'anonymous'} />
            {extendsText ? <StyledSpan text={extendsText} /> : null}
        </>
    );
}

function InterfaceNode({ node }: { node: SemanticNode }) {
    return (
        <>
            <StyledSpan text="Define interface " />
            <StyledSpan text={node.name ?? 'anonymous'} />
        </>
    );
}

function TypeAliasNode({ node }: { node: SemanticNode }) {
    return (
        <>
            <StyledSpan text="Define type " />
            <StyledSpan text={node.name ?? 'anonymous'} />
            <StyledSpan text=" as " />
            <StyledSpan text={String(node.metadata.type ?? '')} />
        </>
    );
}

function PropertyNode({ node }: { node: SemanticNode }) {
    const type = String(node.metadata.type ?? 'any');
    const optional = !!node.metadata.optional;
    const init = node.metadata.initializer as string | null;
    const initText = init ? `, initialized to ${init}` : '';
    return (
        <>
            {optional ? <StyledSpan text="optional, " /> : null}
            <StyledSpan text="`" />
            <StyledSpan text={node.name ?? 'anonymous'} />
            <StyledSpan text="` is " />
            <StyledSpan text={translateType(type)} />
            {initText ? <StyledSpan text={initText} /> : null}
        </>
    );
}

function VariableNode({ node }: { node: SemanticNode }) {
    const init = node.metadata.initializer as string | null;
    return (
        <>
            <StyledSpan text="Declare variable " />
            <StyledSpan text="`" />
            <StyledSpan text={node.name ?? 'anonymous'} />
            <StyledSpan text="`" />
            {init ? (
                <>
                    <StyledSpan text=" = " />
                    <StyledSpan text={init} />
                </>
            ) : null}
        </>
    );
}

function ReturnNode({ node }: { node: SemanticNode }) {
    if (node.metadata.hasJsx) {
        return <StyledSpan text="Render" />;
    }
    const value = node.metadata.value as string | null;
    if (value) {
        return (
            <>
                <StyledSpan text="return " />
                <StyledSpan text="`" />
                <StyledSpan text={value} />
                <StyledSpan text="`" />
            </>
        );
    }
    return <StyledSpan text="return" />;
}

function IfNode({ node }: { node: SemanticNode }) {
    return <StyledSpan text={`If ${node.metadata.condition}`} />;
}

function LoopNode({ node }: { node: SemanticNode }) {
    const t = node.metadata.loopType as string;
    let text: string;
    if (t === 'forOf') text = 'For each item';
    else if (t === 'forIn') text = 'For each key';
    else text = 'Loop';
    return <StyledSpan text={text} />;
}

function CallNode({ node }: { node: SemanticNode }) {
    const fn = String(node.metadata.function ?? '');
    const isNew = !!node.metadata.isNew;
    const allArgs = (node.metadata.arguments as string[]) ?? [];
    const displayArgs = allArgs.filter((a) => a !== '<function>');
    const fnCount = allArgs.length - displayArgs.length;
    const verb = isNew ? 'Instantiate' : 'Call';
    let argPart = '';
    if (displayArgs.length > 0 || fnCount > 0) {
        const parts: string[] = [];
        if (displayArgs.length > 0) parts.push(displayArgs.join(', '));
        if (fnCount > 0) parts.push(`${fnCount} function${fnCount > 1 ? 's' : ''}`);
        argPart = ` with ${parts.join(' and ')}`;
    }

    const hookTooltip = getReactHookTooltip(fn);
    const hoverTitle = hookTooltip ? hookTooltip.title : undefined;
    const hoverBody = hookTooltip ? hookTooltip.body : undefined;

    return (
        <>
            <StyledSpan text={`${verb} `} />
            <StyledSpan text={fn} hoverTitle={hoverTitle} hoverBody={hoverBody} />
            {argPart ? <StyledSpan text={argPart} /> : null}
        </>
    );
}

function JsxElementNode({ node }: { node: SemanticNode }) {
    interface EventItem {
        name: string;
        description: string;
    }

    function AttrSpan({ name, value }: { name: string; value: unknown }) {
        if (value === true) {
            return <StyledSpan text={` ${name}`} />;
        }
        return (
            <>
                <StyledSpan text={` ${name}`} />
                <StyledSpan text="=" />
                <StyledSpan text={`"${value}"`} />
            </>
        );
    }

    function JsxAttrs({ node: n }: { node: SemanticNode }) {
        const meta = n.metadata;
        return (
            <>
                {meta.className ? (
                    <>
                        <StyledSpan text=" className=" />
                        <StyledSpan
                            text={`"${meta.className}"`}
                            hoverTitle="className"
                            hoverBody={String(meta.classNameDescription ?? '')}
                            hoverMeta={meta.className ? { classes: meta.className } : undefined}
                        />
                    </>
                ) : null}

                {meta.classNameDescription && !meta.className ? (
                    <>
                        <StyledSpan text=" className=" />
                        <StyledSpan
                            text={`"${meta.classNameDescription}"`}
                            hoverTitle="className"
                            hoverBody={String(meta.classNameDescription)}
                        />
                    </>
                ) : null}

                {meta.props && typeof meta.props === 'object'
                    ? Object.entries(meta.props as Record<string, unknown>).map(([k, v]) => (
                          <AttrSpan key={k} name={k} value={v} />
                      ))
                    : null}

                {meta.events && Array.isArray(meta.events)
                    ? (meta.events as EventItem[]).map((ev) => (
                          <span key={ev.name}>
                              <StyledSpan text={` ${ev.name}`} />
                              <StyledSpan text="=" />
                              <StyledSpan text="{...}" />
                          </span>
                      ))
                    : null}

                {meta.href ? (
                    <>
                        <StyledSpan text=" href=" />
                        <StyledSpan
                            text={`"${meta.href}"`}
                            hoverTitle="href"
                            hoverBody={String(meta.href)}
                        />
                    </>
                ) : null}

                {meta.src ? (
                    <>
                        <StyledSpan text=" src=" />
                        <StyledSpan
                            text={`"${meta.src}"`}
                            hoverTitle="src"
                            hoverBody={String(meta.src)}
                        />
                    </>
                ) : null}

                {meta.alt ? (
                    <>
                        <StyledSpan text=" alt=" />
                        <StyledSpan text={`"${meta.alt}"`} />
                    </>
                ) : null}
            </>
        );
    }

    const selfClosing = node.metadata.selfClosing;
    return (
        <>
            <StyledSpan text="<" />
            <StyledSpan
                text={node.name!}
                hoverTitle={node.name!}
                hoverBody={String(node.metadata.tagDescription ?? '')}
            />
            <JsxAttrs node={node} />
            {selfClosing ? (
                <>
                    <StyledSpan text=" " />
                    <StyledSpan text="/>" />
                </>
            ) : (
                <StyledSpan text=">" />
            )}
        </>
    );
}

function JsxFragmentNode() {
    return (
        <>
            <StyledSpan text="<>" />
            <StyledSpan text="…" />
            <StyledSpan text="</>" />
        </>
    );
}

function JsxListNode({ node }: { node: SemanticNode }) {
    return (
        <StyledSpan
            text={`For each ${node.metadata.itemName} in ${node.metadata.collection}:`}
        />
    );
}

function JsxFilterNode({ node }: { node: SemanticNode }) {
    return (
        <StyledSpan
            text={`Filter ${node.metadata.collection} where ${node.metadata.condition}:`}
        />
    );
}

function JsxConditionalNode({ node }: { node: SemanticNode }) {
    if (node.type === 'jsx-conditional-alt') {
        return <StyledSpan text="Otherwise, show:" />;
    }
    const text =
        node.metadata.variant === 'ternary'
            ? `If ${node.metadata.condition}, show:`
            : `When ${node.metadata.condition}, show:`;
    return <StyledSpan text={text} />;
}

function JsxTextNode({ node }: { node: SemanticNode }) {
    const text = String(node.metadata.text);
    const display = text.length > 60 ? `${text.slice(0, 57)}...` : text;
    return <StyledSpan text={`Show text: "${display}"`} />;
}

function JsxExpressionNode({ node }: { node: SemanticNode }) {
    if (node.metadata.isTemplate) {
        return <StyledSpan text={`Show dynamic text: ${node.metadata.expression}`} />;
    }
    return <StyledSpan text={`Show: ${node.metadata.expression}`} />;
}

function FallbackNode({ node }: { node: SemanticNode }) {
    return <span>{`[${node.type}]`}</span>;
}

function renderSemanticNode(node: SemanticNode): React.ReactNode {
    switch (node.type) {
        case 'import':
            return <ImportNode node={node} />;
        case 'export':
            return <ExportNode node={node} />;
        case 'function':
        case 'method':
            return <FunctionNode node={node} />;
        case 'class':
            return <ClassNode node={node} />;
        case 'interface':
            return <InterfaceNode node={node} />;
        case 'typeAlias':
            return <TypeAliasNode node={node} />;
        case 'property':
            return <PropertyNode node={node} />;
        case 'variable':
            return <VariableNode node={node} />;
        case 'return':
            return <ReturnNode node={node} />;
        case 'if':
            return <IfNode node={node} />;
        case 'loop':
            return <LoopNode node={node} />;
        case 'call':
            return <CallNode node={node} />;
        case 'jsx-element':
            return <JsxElementNode node={node} />;
        case 'jsx-fragment':
            return <JsxFragmentNode />;
        case 'jsx-list':
            return <JsxListNode node={node} />;
        case 'jsx-filter':
            return <JsxFilterNode node={node} />;
        case 'jsx-conditional':
        case 'jsx-conditional-alt':
            return <JsxConditionalNode node={node} />;
        case 'jsx-text':
            return <JsxTextNode node={node} />;
        case 'jsx-expression':
            return <JsxExpressionNode node={node} />;
        default:
            return <FallbackNode node={node} />;
    }
}

interface DisplayNodeProps {
    node: SemanticNode;
}

export function DisplayNode({ node }: DisplayNodeProps) {
    return renderSemanticNode(node);
}

export { DisplayNodeKind, Decoration, displayNodeProps, getDisplayKind };
