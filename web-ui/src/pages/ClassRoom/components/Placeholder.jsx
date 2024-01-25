import React from 'react';

export default function Placeholder({ userId }) {
  return (
    <div className="flex justify-center items-center h-4/5">
      <span class="inline-block self-center">{userId}</span>
    </div>
  );
}
