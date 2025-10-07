"use client";

import React, { useState } from "react";
import { MainQueryEditorProps } from "../types";
import { Select } from "antd";
const { Option } = Select;
import Swal from "sweetalert2";
import { countryMaps } from "@/app/countryMaps";
import { generateLinksForCountries } from "@/app/backenduser/utils/generateLinkHref";
import { Check } from "lucide-react";

export default function MainQueryEditor({
  formTitle,
  formDescription,
  sqlQuery,
  questions,
  selectedFormId,
  onTitleChange,
  onDescriptionChange,
  onCountryChange,
  onQueryChange,
}: MainQueryEditorProps) {
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([]);
  const [loadingLinks, setLoadingLinks] = React.useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!selectedFormId) return;

    const fetchCountries = async () => {
      try {
        const res = await fetch(`/api/forms/${selectedFormId}/getCountries`);
        if (!res.ok) throw new Error("Failed to fetch countries");
        const data = await res.json();
        setSelectedCountries(data.countries || []);
        onCountryChange(data.countries || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCountries();
  }, [selectedFormId]);

  const handleGenerateLinks = async () => {
    if (!selectedFormId || !selectedCountries.length) return [];

    setLoadingLinks(true);
    try {
      const linksWithData = await generateLinksForCountries(
        selectedFormId,
        selectedCountries,
        questions,
        async () => []
      );

      // ดึง base URL จาก document.location
      const baseUrl = `${document.location.protocol}//${document.location.hostname}:${document.location.port}`;

      // ประกอบ link กลับมาเป็น URL เต็ม
      return linksWithData.map(r => `${baseUrl}${r.link}`);
    } finally {
      setLoadingLinks(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mb-8 p-6 bg-white border rounded-xl shadow-lg space-y-4">
      {/* Title */}
      <div>
        <label className="block font-semibold mb-1">Form Title</label>
        <input
          type="text"
          value={formTitle}
          onChange={e => onTitleChange(e.target.value)}
          className="w-full border px-3 py-2 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block font-semibold mb-1">Form Description</label>
        <textarea
          rows={2}
          value={formDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          className="w-full border px-3 py-2 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Country Selector */}
      <div>
        <label className="block font-semibold mb-1">Select Countries</label>
        <Select
          mode="multiple"
          placeholder="-- Select Countries --"
          value={selectedCountries}
          onChange={(vals: string[]) => {
            setSelectedCountries(vals);
            onCountryChange(vals);
          }}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
          }
          className="w-full text-black"
        >
          {Object.keys(countryMaps).map(c => (
            <Option key={c} value={c}>
              {countryMaps[c]}
            </Option>
          ))}
        </Select>
      </div>

      {/* SQL Query */}
      <div>
        <label className="block font-semibold mb-1">SQL Query</label>
        <textarea
          rows={6}
          value={sqlQuery}
          onChange={e => onQueryChange(e.target.value)}
          className="w-full border px-3 py-2 rounded-lg text-black font-mono focus:ring-2 focus:ring-blue-500"
        />
        {/* Label ด้านล่างซ้าย */}
        <p className="mt-1 text-xs text-gray-500">
          * If there is a comparison, the parameter must be set as <code className="font-mono">MATCHTEXT</code>
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={async () => {
            const links = await handleGenerateLinks();

            if (!links.length)
              return Swal.fire("Error", "Please generate links first", "error");

            // ✅ แสดงลิงก์โดยมีปุ่ม Copy All ใน popup
            Swal.fire({
              title: "Generated Links",
              html: links
                .map(
                  (link) => `<div><a href="${link}" target="_blank">${link}</a></div>`
                )
                .join(""),
              icon: "success",
              showCloseButton: true,
              showConfirmButton: true,
              confirmButtonText: "Copy All",
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await navigator.clipboard.writeText(links.join("\n"));
                } catch (err) {
                  // fallback สำหรับ browser เก่าที่ไม่รองรับ Clipboard API
                  console.warn("Clipboard API failed, using fallback:", err);
                  const textArea = document.createElement("textarea");
                  textArea.value = links.join("\n");
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand("copy");
                  document.body.removeChild(textArea);
                }

                // ✅ ไม่ขึ้น popup, แค่โชว์ติ๊กบนปุ่ม
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            });
          }}
          disabled={loadingLinks}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 ${loadingLinks
              ? "bg-gray-400 cursor-not-allowed"
              : copied
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {loadingLinks ? (
            "Generating..."
          ) : copied ? (
            <>
              <Check size={18} />
              Copied
            </>
          ) : (
            "Generate Links"
          )}
        </button>
      </div>
    </div>
  );
}
