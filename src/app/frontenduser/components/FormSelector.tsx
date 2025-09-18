import { Select } from "antd";
import React from "react";
import { FormSelectorProps } from "../types";

const FormSelector: React.FC<FormSelectorProps> = ({ selectedFormId, savedForms, onSelectForm }) => {
  const selectedForm = savedForms.find(f => f.id === selectedFormId);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 text-black">
      <label className="block mb-2 font-semibold">
        Select Form:
      </label>

      <Select
        showSearch
        value={selectedFormId || undefined}
        onChange={onSelectForm}
        placeholder="-- Select Form --"
        optionFilterProp="label"
        className="w-full text-black"
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        options={savedForms.map(f => ({
          value: f.id,
          label: f.description ? `${f.title} - ${f.description}` : f.title,
          className: "text-black", // เพิ่มตรงนี้เพื่อให้แต่ละ option เป็นสีดำ
        }))}
      />
    </div>
  );
};

export default FormSelector;
