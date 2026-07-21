import { Fragment, useState } from 'react';

interface Item {
  id: number;
  label: string;
}

export function ItemList({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      {items.length === 0 ? (
        <div>No items</div>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              ref={null}
              style={{ fontWeight: selected === item.id ? 'bold' : 'normal' }}
              onClick={() => setSelected(item.id)}
              onMouseEnter={() => {}}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
      {selected != null && <div>Selected: {selected}</div>}
    </>
  );
}

export function Form() {
  const [text, setText] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log(text);
  }

  return (
    <Fragment>
      <form onSubmit={handleSubmit}>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit">Go</button>
      </form>
    </Fragment>
  );
}
