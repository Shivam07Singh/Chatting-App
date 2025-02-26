import React from 'react'

function Input({
  label = "",
  name = "",
  type = "text",
  className = "",
  inputClassName = "",
  isRequired = true,
  placeholder = "",
  value = "",
  onChange = () => {},
}) {
  return (
    <div className={`${className}`}>
      <label htmlFor={name} className="block text-gray-800 text-sm font-medium">
        {label}
      </label>
      <input
        type={type}
        id={name}
        className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 black w-full p-2.5  ${inputClassName}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={isRequired}
      />
    </div>
  );
}

export default Input;
