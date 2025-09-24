"use client";

import { generateLinksForCountries } from "@/app/backenduser/utils/generateLinkHref";
import React from "react";
import { MainQueryEditorProps } from "../types";
import { Select } from "antd";
const { Option } = Select;
import Swal from "sweetalert2";
import { countryMaps } from "@/app/countryMaps";

export default function MainQueryEditor({
  formTitle,
  formDescription,
  countries,
  sqlQuery,
  questions,
  selectedFormId,
  optionsFromDatabase = {},
  onTitleChange,
  onDescriptionChange,
  onCountryChange,
  onQueryChange,
  onSaveQuery,
}: MainQueryEditorProps) {
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([]);
  const [frontendLinks, setFrontendLinks] = React.useState<string[]>([]);
  const [localQuestions, setLocalQuestions] = React.useState(questions);
  const [loadingLinks, setLoadingLinks] = React.useState(false);

  React.useEffect(() => {
    if (countries) {
      setSelectedCountries(
        typeof countries === "string" ? countries.split(",") : countries
      );
    } else {
      setSelectedCountries([]);
    }
  }, [countries]);

  // เรียกเฉพาะตอนกดปุ่ม Generate Link
  const handleGenerateLinks = async () => {
    if (!selectedFormId || !selectedCountries.length) return [];

    setLoadingLinks(true); // เริ่ม loading
    try {
      const linksWithData = await generateLinksForCountries(
        selectedFormId,
        selectedCountries,
        questions,
        async (country) => {
          return []; // แทน query ด้วย array ว่าง
        }
      );

      setFrontendLinks(linksWithData.map(r => r.link));

      // update questions optionsByCountry
      linksWithData.forEach((r, i) => {
        const country = selectedCountries[i];
        const optionsFromSQL = r.queryData.map((row: any) => ({ name: row.name, code: row.code }));

        setLocalQuestions(prev =>
          prev.map(q => ({
            ...q,
            options: q.options.map(o => ({
              ...o,
              optionsByCountry: { ...(o.optionsByCountry || {}), [country]: optionsFromSQL },
              selectedValue: optionsFromSQL[0]?.code || "",
            })),
          }))
        );
      });

      return linksWithData.map(r => r.link);
    } finally {
      setLoadingLinks(false); // จบ loading
    }
  };

  return (
    <div className="max-w-3xl mx-auto mb-8 p-6 bg-white border rounded-xl shadow-lg space-y-4">
      {/* Title */}
      <div>
        <label className="block font-semibold mb-1">Form Title</label>
        <input
          type="text"
          placeholder="Enter form title..."
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
          placeholder="Enter form description..."
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
          value={selectedCountries}      // จะโชว์ตาม state ที่ sync กับ props
          onChange={(vals: string[]) => {
            setSelectedCountries(vals);
            onCountryChange(vals.join(",")); // ส่งกลับ parent
          }}
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
          placeholder="-- Main SQL Query --"
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={async () => {
            const links = await handleGenerateLinks();
            if (!links.length) return Swal.fire("Error", "Please generate links first", "error");

            Swal.fire({
              title: "Generated Links",
              html: links
                .map(
                  (link: any) =>
                    `<div class="mb-2"><a href="${link}" target="_blank" class="text-blue-600 underline">${link}</a></div>`
                )
                .join(""),
              icon: "success",
              width: 600,
              showCloseButton: true,
              showConfirmButton: true,
              confirmButtonText: "Copy All",
              didOpen: () => {
                const content = Swal.getHtmlContainer();
                if (content) content.style.overflowY = "auto";
              },
            }).then(result => {
              if (result.isConfirmed) {
                navigator.clipboard.writeText(links.join("\n"));
                Swal.fire("Copied!", "All links have been copied to clipboard.", "success");
              }
            });
          }}
          disabled={loadingLinks}
          className={`px-6 py-2 rounded-lg transition cursor-pointer ${loadingLinks ? "bg-gray-400 text-gray-700" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {loadingLinks ? "Generating..." : "Generate Links"}
        </button>
      </div>
    </div>
  );
}
