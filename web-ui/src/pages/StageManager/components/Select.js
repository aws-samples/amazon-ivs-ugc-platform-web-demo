import React from 'react';

export default function Select({ title, options, onChange }) {
    const hasOptions = options.length > 0;

    function handleChange(event) {
        onChange(event.target.value);
    }

    return (
        <>
            <label htmlFor={title}>{title}</label>
            <select defaultValue="empty-default" onChange={handleChange} disabled={!hasOptions} id={title}>
                {hasOptions ? (
                    options.map((option) => {
                        return (
                            <option key={option.id} value={option.id}>
                                {option.username}
                            </option>
                        );
                    })
                ) : (
                    <option value="empty-default" disabled>
                        Choose Option
                    </option>
                )}
            </select>
        </>
    );
}
