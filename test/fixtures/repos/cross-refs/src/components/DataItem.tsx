import type { DataItem as DataItemType } from '../types';
import { formatValue } from '../utils';

interface Props {
  item: DataItemType;
  index: number;
}

export default function DataItem({ item, index }: Props) {
  return (
    <div className="data-item">
      <span className="index">{index}</span>
      <span className="label">{item.label}</span>
      <span className="value">{formatValue(item.value)}</span>
    </div>
  );
}
