"use client";
import React from "react";
import Swal from "sweetalert2";
import { OptionItemProps } from "../types";

export default function OptionItem({ option, questionId, onUpdate, onDelete }: OptionItemProps) {
  return (
    <div className="p-4 mb-4 border rounded-lg bg-white shadow-sm relative">
      {/* Delete Button */}
      <button
        type="button"
        onClick={async () => {
          const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you really want to delete the option "${option.label}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
          });

          if (result.isConfirmed) {
            onDelete(questionId, option.id, option.label);
            Swal.fire('Deleted!', `Option "${option.label}" successfully deleted.`, 'success');
          }
        }}
        className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold"
      >
        ❌
      </button>

      {/* Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={option.type || ""}
          onChange={e => onUpdate(questionId, option.id, "type", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-400 focus:outline-none"
        >
          <option value="">-- Select Type --</option>
          <option value="text">Text</option>
          <option value="dropdown">Dropdown Select</option>
          <option value="multiselect">Multi Select</option>
          <option value="date">Date</option>
        </select>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            placeholder="Name"
            value={option.label || ""}
            onChange={e => onUpdate(questionId, option.id, "label", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        {/* Parameter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parameter</label>
          <input
            type="text"
            placeholder="Parameter"
            value={option.paramName || ""}
            onChange={e => onUpdate(questionId, option.id, "paramName", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        {/* Value */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              {option.byFixedValue ? "Value" : "SQL Code"}
            </label>

            {(option.type === "dropdown" || option.type === "multiselect") && (
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={!!option.byFixedValue}
                  onChange={(e) =>
                    onUpdate(questionId, option.id, "byFixedValue", e.target.checked ? "true" : "false")
                  }
                  className="mr-2"
                />
                Use fixed values
              </label>
            )}
          </div>

          {(option.type === "dropdown" || option.type === "multiselect") ? (
            <textarea
              rows={3}
              placeholder={option.byFixedValue ? "Enter comma separated values" : "SQL Code (optional)"}
              value={option.value || ""}
              onChange={(e) => onUpdate(questionId, option.id, "value", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm text-black font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          ) : (
            <input
              type="text"
              placeholder="Value"
              value={option.value || ""}
              onChange={(e) => onUpdate(questionId, option.id, "value", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-400 focus:outline-none"
              disabled
            />
          )}
        </div>
      </div>
    </div>
  );
}
