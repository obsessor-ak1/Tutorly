import React from 'react';

/** Accessible list of cards; each item is rendered inside its own <li>. */
export function CardList({ items, renderItem, label }) {
  return (
    <ul className="flex flex-col space-y-4" role="list" aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
