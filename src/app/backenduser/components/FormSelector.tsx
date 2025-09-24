"use client";
import React from "react";
import { Select, Spin } from "antd";
import { FormSelectorProps } from "../types";

export default function FormSelector({
  savedForms,
  selectedFormId,
  onSelect,
  isLoading = false,
}: FormSelectorProps) {
  return (
    <div className="max-w-3xl mx-auto mb-6">
      <Select
        showSearch
        value={selectedFormId || undefined}
        placeholder="-- Select Form by QueryName --"
        onChange={onSelect}
        optionFilterProp="label"
        className="w-full text-black"
        notFoundContent={isLoading ? <Spin size="small" /> : "No forms found"}
        filterOption={(input, option) =>
          String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        loading={isLoading}
        allowClear
        options={savedForms
          .sort((a, b) => a.title.localeCompare(b.title))
          .map(f => ({
            value: f.id,
            label: `${f.title}${f.description ? ` - ${f.description}` : ""}`,
          }))
        }
      />
    </div>
  );
}
