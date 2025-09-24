import { QuestionCardProps } from "../types";
import * as React from "react";
import { Button, Form, Select } from "antd";
import Swal from "sweetalert2";
import { generateLinksForCountries } from "../../backenduser/utils/generateLinkHref";

export const countryMap: Record<string, string> = {
 "AS-DTGBTN": "AS-DTGBTN",
  "AS-DTGGER": "AS-DTGGER",
  "AS-DTGJPN": "AS-DTGJPN",
  "AS-DTGKHM": "AS-DTGKHM",
  "AS-DTGKUL": "AS-DTGKUL",
  "AS-DTGLAO": "AS-DTGLAO",
  "AS-DTGMAL": "AS-DTGMAL",
  "AS-DTGMMR": "AS-DTGMMR",
  "AS-DTGPHL": "AS-DTGPHL",
  "AS-DTGSIN": "AS-DTGSIN",
  "AS-DTGSLK": "AS-DTGSLK",
  "AS-DTGTHA": "AS-DTGTHA",
  "AS-DTGVNM": "AS-DTGVNM",
  // readable names
  "Bhutan": "AS-DTGBTN",
  "Germany": "AS-DTGGER",
  "Japan": "AS-DTGJPN",
  "Cambodia": "AS-DTGKHM",
  "Malaysia": "AS-DTGKUL",
  "Laos": "AS-DTGLAO",
  "Maldives": "AS-DTGMAL",
  "Myanmar": "AS-DTGMMR",
  "Philippines": "AS-DTGPHL",
  "Singapore": "AS-DTGSIN",
  "Sri Lanka": "AS-DTGSLK",
  "Thailand": "AS-DTGTHA",
  "Vietnam": "AS-DTGVNM",
};

const QuestionCard = ({ question, form, country, onUpdateOptionValue }: QuestionCardProps) => {
    const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});
    const [optionsMap, setOptionsMap] = React.useState<Record<string, { name: string; code: string }[]>>({});
    const [dbLoading, setDbLoading] = React.useState(false);
    const countryCode = country; // AS-DTGTHA
    const handleOpenChange = (optionId: string, isOpen: boolean) => {
        setOpenMap(prev => ({ ...prev, [optionId]: isOpen }));
    };

    // ฟังก์ชันดึงตัวเลือกจาก SQL query
    const fetchOptions = async (country: string) => {
        setDbLoading(true);
        try {
            const optionsPromises = question.options.map(async (o) => {
                // ✅ ถ้าเป็น fixed value ใช้ CSV/string
                if ((o.type === "dropdown" || o.type === "multiselect") && o.byFixedValue) {
                    const valueStr = Array.isArray(o.value) ? o.value.join(",") : (o.value ?? "");
                    return {
                        id: o.id,
                        options: valueStr
                            .split(",")
                            .map(v => v.trim())
                            .filter(v => v.length > 0)
                            .map(v => ({ name: v, code: v })),
                    };
                }

                // ✅ SQL query เฉพาะ dropdown/multiselect และ byFixedValue === false
                if (
                    (o.type === "dropdown" || o.type === "multiselect") &&
                    !o.byFixedValue &&
                    typeof o.value === "string" &&
                    o.value.trim().toLowerCase().startsWith("select")
                ) {
                    try {
                        const res = await fetch("/api/getOptions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                               country: countryCode, 
                               value: o.value,
                            }),
                        });
                        const data = await res.json();
                        if (data.success) return { id: o.id, options: data.options || [] };
                        else return { id: o.id, options: [] };
                    } catch {
                        return { id: o.id, options: [] };
                    }
                }

                // ✅ กรณีอื่น ๆ ไม่ run
                return { id: o.id, options: [] };
            });

            const optionsResults = await Promise.all(optionsPromises);

            const newOptionsMap = optionsResults.reduce<Record<string, { name: string; code: string }[]>>(
                (acc, result) => {
                    acc[result.id] = result.options;
                    return acc;
                },
                {}
            );

            setOptionsMap(newOptionsMap);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Cannot load country DB", "error");
        } finally {
            setDbLoading(false);
        }
    };

    React.useEffect(() => {
        fetchOptions(country);
    }, [generateLinksForCountries]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            {question.options.map((o) => (
                <div key={o.id} className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 mb-4">
                    <label className="font-medium text-black w-36 mt-2 sm:mt-0">{o.label} :</label>
                    {/* Text input */}
                    {o.type === "text" && (
                        <input
                            type="text"
                            placeholder="Put Value Here"
                            value={o.selectedValue || ""}
                            onChange={(e) => onUpdateOptionValue(question.id, o.id, e.target.value)}
                            className="flex-1 border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-black/70"
                        />
                    )}
                    {o.type === "date" && (() => {
                        const [rawValue, setRawValue] = React.useState(
                            o.selectedValue ? o.selectedValue.split("-").reverse().join("") : ""
                        );
                        const inputRef = React.useRef<HTMLInputElement>(null);
                        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                            const input = e.target;
                            let caretPos = input.selectionStart ?? 0;
                            const val = input.value.replace(/\D/g, "").slice(0, 8);
                            setRawValue(val);
                            if (val.length === 8) {
                                const formattedForSubmit = `${val.slice(4, 8)}-${val.slice(
                                    2,
                                    4
                                )}-${val.slice(0, 2)}`;
                                onUpdateOptionValue(question.id, o.id, formattedForSubmit);
                            }
                            requestAnimationFrame(() => {
                                if (inputRef.current) {
                                    const pos = Math.min(caretPos, inputRef.current.value.length);
                                    inputRef.current.selectionStart = pos;
                                    inputRef.current.selectionEnd = pos;
                                }
                            });
                        };
                        const displayValue =
                            rawValue.length === 8
                                ? `${rawValue.slice(0, 2)}-${rawValue.slice(2, 4)}-${rawValue.slice(
                                    4,
                                    8
                                )}`
                                : rawValue;
                        return (
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="DDMMYYYY"
                                value={displayValue}
                                onChange={handleChange}
                                className="flex-1 border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        );
                    })()}

                    {/* Dropdown */}
                    {o.type === "dropdown" && (
                        <Form.Item className="flex-1">
                            <Select
                                showSearch
                                placeholder={`Select ${o.label}`}
                                value={o.selectedValue || undefined}
                                onChange={(value) => {
                                    const selectedOption = optionsMap[o.id]?.find(opt => opt.code === value);
                                    onUpdateOptionValue(
                                        question.id,
                                        o.id,
                                        selectedOption?.code || value,
                                        optionsMap[o.id]
                                    );
                                }}
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                                options={optionsMap[o.id]?.map(opt => ({
                                    label: `${opt.name} (${opt.code})`,
                                    value: opt.code
                                }))}
                                disabled={dbLoading && !optionsMap[o.id]}
                                className="w-full text-black"
                            />
                        </Form.Item>
                    )}

                    {/* Multiselect */}
                    {o.type === "multiselect" && (
                        <Form.Item
                            name={o.id}
                            rules={[{ required: true, message: `Please select your ${o.label}!`, type: "array" }]}
                            className="flex-1"
                        >
                            <Select
                                mode="multiple"
                                placeholder={`Please select ${o.label}`}
                                value={o.selectedValues?.map((v: any) => (typeof v === "object" ? v.code : v)) || []}
                                onChange={(values) => onUpdateOptionValue(question.id, o.id, values)}
                                options={optionsMap[o.id]?.map(opt => ({
                                    label: `${opt.name} (${opt.code})`,
                                    value: opt.code
                                }))}
                                open={openMap[o.id] || false}
                                onOpenChange={(isOpen) => handleOpenChange(o.id, isOpen)}
                                popupRender={(menu) => (
                                    <>
                                        {menu}
                                        <div style={{ display: "flex", gap: 8, padding: 8 }}>
                                            <Button
                                                type="link"
                                                size="small"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    const allCodes = optionsMap[o.id]?.map(opt => opt.code) || [];
                                                    onUpdateOptionValue(question.id, o.id, allCodes);
                                                    form.setFieldsValue({ [o.id]: allCodes });
                                                    handleOpenChange(o.id, true);
                                                }}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                type="link"
                                                size="small"
                                                danger
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    onUpdateOptionValue(question.id, o.id, []);
                                                    form.setFieldsValue({ [o.id]: [] });
                                                    handleOpenChange(o.id, true);
                                                }}
                                            >
                                                Unselect All
                                            </Button>
                                        </div>
                                    </>
                                )}
                            />
                        </Form.Item>
                    )}
                </div>
            ))}
        </div>
    );
};

export default QuestionCard;
