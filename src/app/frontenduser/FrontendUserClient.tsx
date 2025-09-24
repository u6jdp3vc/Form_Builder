"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useSearchParams } from "next/navigation";
import { Question, SavedForm, FrontendUserProps } from "./types";
import QuestionCard from './components/QuestionCard';
import ExportButton from "./components/ExportButton";
import { Form } from "antd";
import { countryMap } from "@/app/countryMap";

export default function FrontendUser({ state }: FrontendUserProps) {
    const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
    const [selectedFormId, setSelectedFormId] = useState("");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [selectedCountry, setSelectedCountry] = useState("");
    const searchParams = useSearchParams();
    const stateParam = searchParams.get("state");
    const [dbLoading, setDbLoading] = useState(false);
    const [dbReady, setDbReady] = useState(false);

    // Load forms
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch forms
                const formsRes = await fetch("/api/savedForms");
                const formsData = await formsRes.json();
                console.log("Fetched SavedQueries:", formsData);
                setSavedForms(formsData.forms || []);
                // Fetch countries
                const countriesRes = await fetch("/Query.json");
                const countriesData = await countriesRes.json();
                if (Array.isArray(countriesData.countries)) setCountries(countriesData.countries);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!state) return;
        console.log("Syncing state from prop:", state);
        setSelectedFormId(state.selectedFormId || "");
        // ดึงรหัสประเทศจาก state
        const countryCode = state.fixedCountry || state.questions?.[0]?.country || state.countries?.[0] || "";
        setSelectedCountry(countryCode); // เก็บรหัสประเทศสำหรับ backend
        // แปลงชื่ออ่านง่ายสำหรับ UI
        const updatedQuestions = (state.questions || []).map((q: any) => {
            const readableCountry = countryMap[q.country || countryCode] || (q.country || countryCode);
            return {
                ...q,
                id: q.id, // เก็บ id เดิม
                title: `${q.title} (${readableCountry})`, // แสดงชื่ออ่านง่าย
            };
        });
        setQuestions(updatedQuestions);
    }, [state]);

    const loadCountryDB = async (country: string) => {
        setDbLoading(true);
        try {
            const res = await fetch("/api/loadCountryDB", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ country }),
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

    const [form] = Form.useForm();

    const getOptions = async (
        country: string,
        query: string,
        params: any,
        byFixedValue: boolean,
        value: string,
        retries = 3,
        delay = 1000
    ): Promise<{ name: string; code: string }[]> => {
        // ถ้าเป็นค่า fix ให้ใช้ value เลย
        if (byFixedValue) {
            if (!value) return [];
            return value
                .split(",")
                .map(v => v.trim())
                .filter(v => v.length > 0)
                .map(v => ({ name: v, code: v }));
        }

        // ถ้าไม่ fix ให้ query ตามเดิม
        let attempt = 0;
        while (attempt < retries) {
            if (dbLoading) {
                console.warn("Database still loading, skipping query");
                return [];
            }

            let sqlQuery = query;
            if (params && typeof params === "object") {
                Object.keys(params).forEach(key => {
                    const value = params[key] ?? '';
                    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const pattern = new RegExp(`\\{\\s*@?${escapedKey.replace(/^@/, '')}\\s*\\}|\\{\\s*${escapedKey}\\s*\\}`, 'g');
                    sqlQuery = sqlQuery.replace(pattern, `'${value}'`);
                });
            }

            try {
                const res = await fetch(`/api/runQuery?country=${country}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ country, queryTemplate: sqlQuery, params }),
                });

                const data = await res.json();

                if (res.status === 202) {
                    console.log(`DB not ready, retrying in ${delay}ms...`);
                    await new Promise(res => setTimeout(res, delay));
                    attempt++;
                    continue;
                }

                if (!res.ok) throw new Error(data.error || "Unknown error");

                if (Array.isArray(data.rows) && data.rows.length > 0) {
                    const optionsFromSQL = data.rows.map((row: { name: string; code: string }) => ({
                        name: row.name || "Unnamed",
                        code: row.code || "",
                    }));
                    updateQuestionOptionsWithSQL(optionsFromSQL);
                    return optionsFromSQL;
                }
                return [];
            } catch (err) {
                console.error("Error fetching options:", err);
                return [];
            }
        }

        console.warn("Max retries reached, returning empty options");
        return [];
    };

    // ฟังก์ชันสำหรับอัปเดต options จาก SQL ลงใน questions
    const updateQuestionOptionsWithSQL = (optionsFromSQL: { name: string; code: string }[]) => {
        // สมมติว่า state ของคำถามอยู่ใน `questions` และต้องการอัปเดต `optionsFromSQL` ใน `options` ของคำถาม
        setQuestions(prevQuestions => {
            return prevQuestions.map(question => {
                return {
                    ...question,
                    options: question.options.map(option => {
                        // ค้นหาตัวเลือกที่ต้องการอัปเดต (ที่ตรงกับ id หรือเงื่อนไขอื่นๆ)
                        if (option.value) {
                            return {
                                ...option,
                                optionsFromSQL: optionsFromSQL, // ใส่ข้อมูลตัวเลือกจาก SQL
                            };
                        }
                        return option;
                    })
                };
            });
        });
    };

    useEffect(() => {
        const initFromState = async () => {
            const stateParam = searchParams.get("state");
            if (!stateParam) return;
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(stateParam)));
                const { selectedFormId, selectedCountry, questions: qsFromLink } = decoded;
                if (!selectedFormId || !Array.isArray(qsFromLink)) return;
                setSelectedFormId(selectedFormId);
                setSelectedCountry(selectedCountry);
                setDbReady(false);

                const loaded = await loadCountryDB(selectedCountry);

                if (!loaded) return;
                setDbReady(true);

                // โหลด questions จาก API
                const res = await fetch(`/api/saveQuestions?formId=${selectedFormId}`);
                const qsFromAPI: Question[] = await res.json();
                // Merge questions
                const mergedQs: Question[] = qsFromLink.map((qLink: any, qIdx: number) => {
                    const apiQ = qsFromAPI.find(a => a.id === qLink.id);
                    return {
                        id: apiQ?.id || qLink.id || `q_${qIdx}`,
                        title: apiQ?.title || qLink.title || "",
                        description: apiQ?.description || qLink.description || "",
                        mainQuery: apiQ?.mainQuery || qLink.mainQuery || "",
                        formId: selectedFormId,
                        options: (qLink.options || []).map((oLink: any, oIdx: number) => {
                            const apiO = apiQ?.options?.find(a => a.id === oLink.id);
                            const type = apiO?.type || oLink.type || "text";
                            return {
                                id: apiO?.id || oLink.id || `opt_${qIdx}_${oIdx}`,
                                label: oLink.label || apiO?.label || `Option ${oIdx + 1}`,
                                paramName: oLink.paramName || apiO?.paramName || "",
                                type,
                                mainQuery: oLink.mainQuery || apiO?.mainQuery || "",
                                value: type === "multiselect" ? undefined : oLink.value || apiO?.value || "",
                                selectedValue: type !== "multiselect" ? oLink.selectedValue || oLink.value || apiO?.selectedValue || "" : undefined,
                                selectedValues: type === "multiselect" ? (oLink.selectedValues || apiO?.selectedValues || []) : undefined,
                                optionsFromSQL: oLink.optionsFromSQL || apiO?.optionsFromSQL || [],
                                loading: type === "dropdown" || type === "multiselect",
                                valueType: apiO?.valueType || "string",
                                byFixedValue: oLink.byFixedValue ?? apiO?.byFixedValue ?? false,
                            };
                        })
                    };
                });

                // เตรียม params
                const params: Record<string, string> = {};
                mergedQs.forEach(q =>
                    q.options.forEach(o => {
                        if (o.paramName) params[o.paramName] = Array.isArray(o.value) ? o.value.join(",") : o.value || "";
                    })
                );

                // Fetch dropdown/multiselect options แบบ parallel
                const updatedQs = await Promise.all(
                    mergedQs.map(async (q) => {
                        const newOptions = await Promise.all(
                            q.options.map(async (o) => {
                                if ((o.type === "dropdown" || o.type === "multiselect") && o.mainQuery && selectedCountry) {
                                    const paramsForOption: Record<string, string> = {};
                                    mergedQs.forEach(qInner =>
                                        qInner.options.forEach(oInner => {
                                            if (oInner.paramName) {
                                                paramsForOption[oInner.paramName] = Array.isArray(oInner.value)
                                                    ? oInner.value.join(",")
                                                    : oInner.value || "";
                                            }
                                        })
                                    );

                                    const optionsFromSQL = await getOptions(
                                        selectedCountry,
                                        o.mainQuery,
                                        paramsForOption,
                                        o.byFixedValue ?? false,
                                        typeof o.value === "string"
                                            ? o.value
                                            : Array.isArray(o.value) && o.value.length > 0
                                                ? o.value[0]
                                                : ""
                                    );

                                    if (o.type === "multiselect") {
                                        const selectedValues: string[] = Array.isArray(o.selectedValues) && o.selectedValues.length
                                            ? o.selectedValues
                                            : optionsFromSQL.length > 0 ? [optionsFromSQL[0].code] : [];

                                        return { ...o, optionsFromSQL, selectedValues, value: undefined, selectedValue: undefined, loading: false };
                                    } else {
                                        let selectedValue: string = "";
                                        if (Array.isArray(o.selectedValue)) {
                                            selectedValue = o.selectedValue[0] || "";
                                        } else if (typeof o.selectedValue === "string" && o.selectedValue) {
                                            selectedValue = o.selectedValue;
                                        } else if (Array.isArray(o.value)) {
                                            selectedValue = o.value[0] || "";
                                        } else if (typeof o.value === "string" && o.value) {
                                            selectedValue = o.value;
                                        } else {
                                            selectedValue = optionsFromSQL[0]?.code || "";
                                        }
                                        return { ...o, optionsFromSQL, selectedValue, value: selectedValue, selectedValues: undefined, loading: false };
                                    }
                                }
                                return { ...o, loading: false };
                            })
                        );
                        return { ...q, options: newOptions };
                    })
                );
                console.log("All merged questions with options:", updatedQs);
                setQuestions(updatedQs);
            } catch (err) {
                console.error("Failed to init from state:", err);
            }
        };

        initFromState();
    }, [searchParams]);

    // Update option value
    const updateOptionValue = async (
        qId: string,
        oId: string,
        value: string | string[] | { name: string; code: string }[],
        optionsFromSQL?: { name: string; code: string }[]
    ) => {
        const newQs = questions.map((q) =>
            q.id === qId
                ? {
                    ...q,
                    options: q.options.map((o) => {
                        if (o.id === oId) {
                            const updatedO = { ...o };

                            if (o.type === "text" || o.type === "date") {
                                updatedO.selectedValue = value as string;
                            } else if (o.type === "dropdown") {
                                updatedO.selectedValue = value as string;
                                if (optionsFromSQL) updatedO.optionsFromSQL = optionsFromSQL;
                            } else if (o.type === "multiselect") {
                                updatedO.selectedValues = Array.isArray(value)
                                    ? value.map((v) => (typeof v === "string" ? v : v.code))
                                    : [];
                                if (optionsFromSQL) updatedO.optionsFromSQL = optionsFromSQL;
                            }
                            return updatedO;
                        }
                        return o;
                    }),
                }
                : q
        );
        setQuestions(newQs);
    };

    const selectedForm = savedForms.find(f => f.id === selectedFormId);

    return (
        <div className="min-h-screen bg-blue-50 p-8 text-black">
            <h1 className="text-4xl font-extrabold text-center mb-10">
                Frontend Form Viewer
            </h1>

            {/* Form Title & Description */}
            {selectedForm && (
                <div className="max-w-4xl mx-auto mb-10 bg-white p-6 rounded-xl shadow-lg border border-blue-200 text-black">
                    <h2 className="text-2xl font-bold mb-2">
                        {`${selectedForm.title} (${countryMap[state?.fixedCountry || selectedCountry] || (state?.fixedCountry || selectedCountry)})`}
                    </h2>
                    {selectedForm.description && (
                        <p>{selectedForm.description}</p>
                    )}
                </div>
            )}

            {/* Questions */}
            <div className="max-w-4xl mx-auto grid gap-6">
                <Form form={form} layout="vertical" onFinish={() => console.log("Submit")}>
                    {questions.map(q => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            onUpdateOptionValue={updateOptionValue}
                            form={form}
                            country={selectedCountry}
                            className="bg-white shadow-md rounded-lg border border-blue-200 text-black"
                        />
                    ))}
                </Form>

                {/* Action Buttons (Export & Link) */}
                {selectedFormId && selectedCountry && (
                    <div className="mt-6 flex justify-end gap-4">
                        <ExportButton
                            selectedCountry={selectedCountry}
                            selectedFormId={selectedFormId}
                            savedForms={savedForms}
                            questions={questions}
                            className="bg-blue-600 text-white hover:bg-blue-700 transition rounded px-4 py-2"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
