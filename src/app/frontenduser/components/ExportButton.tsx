// components/ExportButton.tsx
"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import ExcelJS from "exceljs"; // ✅ ใช้ ExcelJS แทน xlsx
import { ExportButtonProps } from "../types";

const ExportButton: React.FC<ExportButtonProps> = ({
  selectedCountry,
  selectedFormId,
  savedForms,
  questions,
}) => {
  const [dbLoading, setDbLoading] = useState(false);

  const loadCountryDB = async (countryCode: string) => {
    setDbLoading(true);
    try {
      const res = await fetch("/api/loadCountryDB", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load country DB");
      return true;
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Cannot load country DB", "error");
      return false;
    } finally {
      setDbLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  };

  const flattenWithIndex = (obj: any, prefix = ""): Record<string, any> => {
    const res: Record<string, any> = {};
    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      if (Array.isArray(val)) {
        val.forEach((v, idx) => {
          if (typeof v === "object") {
            Object.assign(res, flattenWithIndex(v, `${prefix}${key}[${idx}].`));
          } else {
            res[`${prefix}${key}[${idx}]`] = v ?? "";
          }
        });
      } else if (val && typeof val === "object") {
        Object.assign(res, flattenWithIndex(val, `${prefix}${key}.`));
      } else {
        res[`${prefix}${key}`] = val ?? "";
      }
    });
    return res;
  };

  const exportSelected = async (): Promise<any[]> => {
    if (!selectedFormId || !selectedCountry) {
      Swal.fire("Warning", "Please select form and country", "warning");
      return [];
    }

    const countryCode = selectedCountry;
    const loaded = await loadCountryDB(countryCode);
    if (!loaded) return [];

    const selectedForm = savedForms.find((f) => f.id === selectedFormId);
    if (!selectedForm) {
      Swal.fire("Error", "Form not found", "error");
      return [];
    }

    const safeTitle = selectedForm.title.replace(/[^\w\s-]/g, "_");
    const dateStr = formatDate(new Date());

    const params: Record<string, any> = {};
    questions.forEach((q) =>
      q.options.forEach((o: any) => {
        if (!o.paramName) return;
        if (o.type === "dropdown") {
          const sel = o.optionsFromSQL?.find((opt: any) => opt.code === o.selectedValue);
          params[o.paramName] = sel?.code || "";
        } else if (o.type === "multiselect") {
          params[o.paramName] = o.selectedValues || [];
        } else {
          params[o.paramName] = o.selectedValue || "";
        }
      })
    );

    const queries = selectedForm.queryText
      ? selectedForm.queryText
          .split(";")
          .map((q: string) => q.trim())
          .filter((q: string) => q.length > 0)
      : [];

    const workbook = new ExcelJS.Workbook();
    const allRows: any[] = [];

    for (let i = 0; i < queries.length; i++) {
      let sqlQuery = queries[i];
      Object.keys(params).forEach((key) => {
        const value = params[key];
        const replacement = Array.isArray(value)
          ? `(${value.map((v) => `'${v}'`).join(",")})`
          : `'${value}'`;
        sqlQuery = sqlQuery.replace(new RegExp(`\\{\\s*@?${key}\\s*\\}|@${key}`, "g"), replacement);
      });

      try {
        const res = await fetch("/api/runQuery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: countryCode, queryTemplate: sqlQuery }),
        });
        if (!res.ok) throw new Error(`Failed to run query ${i + 1}`);
        const data = await res.json();
        const rows = data.results?.[countryCode]?.rows || [];

        if (rows.length > 0) {
          const cleanedRows = rows.map((r: any) => flattenWithIndex(r));
          allRows.push(...cleanedRows);

          const sheet = workbook.addWorksheet(`Sheet${i + 1}`);
          const headers = Object.keys(cleanedRows[0]);
          sheet.addRow(headers);

          cleanedRows.forEach((row: { [x: string]: string; }) => {
            const excelRow = sheet.addRow(headers.map((h) => row[h]));

            if (row["MATCHTEXT"] === "N") {
              excelRow.eachCell((cell) => {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFF0000" }, // แดง
                };
                cell.font = { color: { argb: "FFFFFFFF" } }; // ขาว
              });
            }
          });
        } else {
          workbook.addWorksheet(`Sheet${i + 1}`);
        }
      } catch (err) {
        console.error(`Error executing query ${i + 1}:`, err);
        workbook.addWorksheet(`Sheet${i + 1}`);
      }
    }

    // ดาวน์โหลดไฟล์ใน browser
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}_${countryCode}_${dateStr}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    return allRows;
  };

  return (
    <button
      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      onClick={exportSelected}
      disabled={dbLoading}
    >
      {dbLoading ? "Loading..." : "Export Data"}
    </button>
  );
};

export default ExportButton;
