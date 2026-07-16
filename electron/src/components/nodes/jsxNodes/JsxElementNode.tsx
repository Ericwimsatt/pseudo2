import type { SemanticNode } from '../../../lib/makeSemanticGraph';
import { StyledSpan } from '../StyledSpan';

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

function JsxAttrs({ node }: { node: SemanticNode }) {
  const meta = node.metadata;
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

export function JsxElementNode({ node }: { node: SemanticNode }) {
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
