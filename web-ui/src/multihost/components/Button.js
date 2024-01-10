import React from 'react';

export default function Button({ onClick, children }) {
    return (
        <button className="button" onClick={onClick} style={{ margin: 'auto', width: '100%' }} id="join-button">
            {children}
        </button>
    );
}
