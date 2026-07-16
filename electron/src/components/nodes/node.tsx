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
            <StyledSpan text="import " variant="kw" />
            <StyledSpan text={names} variant="ident" />
            <StyledSpan text={` ${verb} `} variant="ident" />
            <StyledSpan text={module} variant="string" hoverTitle="Module" hoverBody={module} />
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
                <StyledSpan text="export " variant="kw" />
                <StyledSpan text={names} variant="ident" />
                <StyledSpan text={` ${verb} re-exported from `} variant="ident" />
                <StyledSpan text={module} variant="string" hoverTitle="Module" hoverBody={module} />
            </>
        );
    }
    return (
        <>
            <StyledSpan text="export " variant="kw" />
            <StyledSpan text={names} variant="ident" />
            <StyledSpan text={` ${verb} exported`} variant="ident" />
        </>
    );
}

function FunctionNode({ node }: { node: SemanticNode }) {
    const params = (node.metadata.parameters as string[]) ?? [];
    const paramText = params.length > 0 ? `Parameters: ${params.join(', ')}` : 'No parameters';
    const verb = node.type === 'method' ? 'method' : 'function';
    return (
        <>
            <StyledSpan text={`Define ${verb} `} variant="kw" />
            <StyledSpan text={node.name ?? 'anonymous'} variant="fn-name" />
            <StyledSpan text={`. ${paramText}`} variant="ident" />
        </>
    );
}

function ClassNode({ node }: { node: SemanticNode }) {
    const extendsText = node.metadata.extends ? ` (extends ${node.metadata.extends})` : '';
    return (
        <>
            <StyledSpan text="Define class " variant="kw" />
            <StyledSpan text={node.name ?? 'anonymous'} variant="fn-name" />
            {extendsText ? <StyledSpan text={extendsText} variant="ident" /> : null}
        </>
    );
}

function InterfaceNode({ node }: { node: SemanticNode }) {
    return (
        <>
            <StyledSpan text="Define interface " variant="kw" />
            <StyledSpan text={node.name ?? 'anonymous'} variant="fn-name" />
        </>
    );
}

function TypeAliasNode({ node }: { node: SemanticNode }) {
    return (
        <>
            <StyledSpan text="Define type " variant="kw" />
            <StyledSpan text={node.name ?? 'anonymous'} variant="fn-name" />
            <StyledSpan text=" as " variant="ident" />
            <StyledSpan text={String(node.metadata.type ?? '')} variant="ident" />
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
            {optional ? <StyledSpan text="optional, " variant="kw" /> : null}
            <StyledSpan text="`" variant="punct" />
            <StyledSpan text={node.name ?? 'anonymous'} variant="ident" />
            <StyledSpan text="` is " variant="ident" />
            <StyledSpan text={translateType(type)} variant="ident" />
            {initText ? <StyledSpan text={initText} variant="ident" /> : null}
        </>
    );
}

function VariableNode({ node }: { node: SemanticNode }) {
    const init = node.metadata.initializer as string | null;
    return (
        <>
            <StyledSpan text="Declare variable " variant="kw" />
            <StyledSpan text="`" variant="punct" />
            <StyledSpan text={node.name ?? 'anonymous'} variant="ident" />
            <StyledSpan text="`" variant="punct" />
            {init ? (
                <>
                    <StyledSpan text=" = " variant="ident" />
                    <StyledSpan text={init} variant="ident" />
                </>
            ) : null}
        </>
    );
}

function ReturnNode({ node }: { node: SemanticNode }) {
    if (node.metadata.hasJsx) {
        return <StyledSpan text="Render" variant="kw" />;
    }
    const value = node.metadata.value as string | null;
    if (value) {
        return (
            <>
                <StyledSpan text="return " variant="kw" />
                <StyledSpan text="`" variant="punct" />
                <StyledSpan text={value} variant="ident" />
                <StyledSpan text="`" variant="punct" />
            </>
        );
    }
    return <StyledSpan text="return" variant="kw" />;
}

function IfNode({ node }: { node: SemanticNode }) {
    return <StyledSpan text={`If ${node.metadata.condition}`} variant="kw" />;
}

function LoopNode({ node }: { node: SemanticNode }) {
    const t = node.metadata.loopType as string;
    let text: string;
    if (t === 'forOf') text = 'For each item';
    else if (t === 'forIn') text = 'For each key';
    else text = 'Loop';
    return <StyledSpan text={text} variant="kw" />;
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
            <StyledSpan text={`${verb} `} variant="kw" />
            <StyledSpan text={fn} variant="fn-name" hoverTitle={hoverTitle} hoverBody={hoverBody} />
            {argPart ? <StyledSpan text={argPart} variant="ident" /> : null}
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
            return <StyledSpan text={` ${name}`} variant="attr-name" />;
        }
        return (
            <>
                <StyledSpan text={` ${name}`} variant="attr-name" />
                <StyledSpan text="=" variant="punct" />
                <StyledSpan text={`"${value}"`} variant="string" />
            </>
        );
    }

    function JsxAttrs({ node: n }: { node: SemanticNode }) {
        const meta = n.metadata;
        return (
            <>
                {meta.className ? (
                    <>
                        <StyledSpan text=" className=" variant="punct" />
                        <StyledSpan
                            text={`"${meta.className}"`}
                            variant="attr-value"
                            hoverTitle="className"
                            hoverBody={String(meta.classNameDescription ?? '')}
                            hoverMeta={meta.className ? { classes: meta.className } : undefined}
                        />
                    </>
                ) : null}

                {meta.classNameDescription && !meta.className ? (
                    <>
                        <StyledSpan text=" className=" variant="punct" />
                        <StyledSpan
                            text={`"${meta.classNameDescription}"`}
                            variant="attr-value"
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
                              <StyledSpan text={` ${ev.name}`} variant="attr-name" />
                              <StyledSpan text="=" variant="punct" />
                              <StyledSpan text="{...}" variant="ident" />
                          </span>
                      ))
                    : null}

                {meta.href ? (
                    <>
                        <StyledSpan text=" href=" variant="punct" />
                        <StyledSpan
                            text={`"${meta.href}"`}
                            variant="string"
                            hoverTitle="href"
                            hoverBody={String(meta.href)}
                        />
                    </>
                ) : null}

                {meta.src ? (
                    <>
                        <StyledSpan text=" src=" variant="punct" />
                        <StyledSpan
                            text={`"${meta.src}"`}
                            variant="string"
                            hoverTitle="src"
                            hoverBody={String(meta.src)}
                        />
                    </>
                ) : null}

                {meta.alt ? (
                    <>
                        <StyledSpan text=" alt=" variant="punct" />
                        <StyledSpan text={`"${meta.alt}"`} variant="string" />
                    </>
                ) : null}
            </>
        );
    }

    const selfClosing = node.metadata.selfClosing;
    return (
        <>
            <StyledSpan text="<" variant="punct" />
            <StyledSpan
                text={node.name!}
                variant="tag-name"
                hoverTitle={node.name!}
                hoverBody={String(node.metadata.tagDescription ?? '')}
            />
            <JsxAttrs node={node} />
            {selfClosing ? (
                <>
                    <StyledSpan text=" " variant="punct" />
                    <StyledSpan text="/>" variant="punct" />
                </>
            ) : (
                <StyledSpan text=">" variant="punct" />
            )}
        </>
    );
}

function JsxFragmentNode() {
    return (
        <>
            <StyledSpan text="<>" variant="punct" />
            <StyledSpan text="…" variant="punct" />
            <StyledSpan text="</>" variant="punct" />
        </>
    );
}

function JsxListNode({ node }: { node: SemanticNode }) {
    return (
        <StyledSpan
            text={`For each ${node.metadata.itemName} in ${node.metadata.collection}:`}
            variant="kw"
        />
    );
}

function JsxFilterNode({ node }: { node: SemanticNode }) {
    return (
        <StyledSpan
            text={`Filter ${node.metadata.collection} where ${node.metadata.condition}:`}
            variant="kw"
        />
    );
}

function JsxConditionalNode({ node }: { node: SemanticNode }) {
    if (node.type === 'jsx-conditional-alt') {
        return <StyledSpan text="Otherwise, show:" variant="kw" />;
    }
    const text =
        node.metadata.variant === 'ternary'
            ? `If ${node.metadata.condition}, show:`
            : `When ${node.metadata.condition}, show:`;
    return <StyledSpan text={text} variant="kw" />;
}

function JsxTextNode({ node }: { node: SemanticNode }) {
    const text = String(node.metadata.text);
    const display = text.length > 60 ? `${text.slice(0, 57)}...` : text;
    return <StyledSpan text={`Show text: "${display}"`} variant="string" />;
}

function JsxExpressionNode({ node }: { node: SemanticNode }) {
    if (node.metadata.isTemplate) {
        return <StyledSpan text={`Show dynamic text: ${node.metadata.expression}`} variant="ident" />;
    }
    return <StyledSpan text={`Show: ${node.metadata.expression}`} variant="ident" />;
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
