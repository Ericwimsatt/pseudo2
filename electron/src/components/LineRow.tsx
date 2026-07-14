import type { LineRenderable } from '../lib/renderable/types';
import { BUCKET_LABELS } from '../lib/renderable/bucket';
import { cx } from '../lib/renderable/styleHelpers';
import { TokenLayer } from './tokens/TokenLayer';

interface Props {
  line: LineRenderable;
  bucketStyle: string;
  isInterface: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
  sourcePct: number;
}

export function LineRow({
  line,
  bucketStyle,
  isInterface,
  onResizeStart,
  sourcePct,
}: Props) {
  const showTranslation = !line.skipTranslation && line.nodes.length > 0;
  const rowSpan = line.translationRowSpan;
  return (
    <tr
      className={cx(
        'hover:bg-gray-50/40 transition-colors',
        bucketStyle,
      )}
      data-bucket={BUCKET_LABELS[line.bucket]}
    >
      <td
        className={cx(
          'p-0 align-top border-l-2',
          isInterface ? 'border-blue-500' : 'border-transparent'
        )}
        style={{ width: 6 }}
      />
      <td className="text-right pr-3 py-1 text-gray-400 select-none border-r border-gray-200 bg-gray-50 align-top font-mono text-xs">
        {line.lineNumber}
      </td>
      <td
        className="py-1 align-top border-r border-gray-200"
        style={{ width: `${sourcePct}%` }}
      >
        <div className="px-4 whitespace-pre-wrap break-words font-mono text-sm">
          {line.sourceText || '\u00A0'}
        </div>
      </td>
      <td
        className="cursor-col-resize bg-gray-100 hover:bg-blue-300 active:bg-blue-400 p-0 align-top border-r border-gray-200"
        style={{ width: 4 }}
        onMouseDown={onResizeStart}
      />
      {showTranslation && (
        <td
          className="px-4 py-1 align-top"
          rowSpan={rowSpan && rowSpan > 1 ? rowSpan : undefined}
        >
          <TokenLayer nodes={line.nodes} />
        </td>
      )}
    </tr>
  );
}
