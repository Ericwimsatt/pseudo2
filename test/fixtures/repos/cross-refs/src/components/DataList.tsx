import { useData } from '../hooks/useData';
import { calculateTotal } from '../utils';
import type { DataItem as DataItemType } from '../types';
import DataItemComponent from './DataItem';

export default function DataList() {
  const { items, loading, error } = useData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const total = calculateTotal(items);

  return (
    <div className="data-list">
      <h2>Data List</h2>
      {items.map((item: DataItemType, index: number) => (
        <DataItemComponent key={item.id} item={item} index={index} />
      ))}
      <div className="total">Total: {total}</div>
    </div>
  );
}
