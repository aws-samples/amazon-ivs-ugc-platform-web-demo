import React from 'react';

export default function Placeholder({ userId }) {
  return (
    <div className="flex-1">
      <div className="p-2 text-center" style={{ fontSize: 40 }}>
        {userId}
      </div>
    </div>
  );
}
