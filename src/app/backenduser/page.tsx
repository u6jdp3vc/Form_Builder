"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { SavedForm, Question, Option } from "./types";
import FormSelector from "./components/FormSelector";
import MainQueryEditor from "./components/MainQueryEditor";
import OptionItem from "./components/OptionItem";
import { Dropdown, Button, Input, Checkbox, MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";

export default function DynamicGoogleForm() {
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [originalSqlQuery, setOriginalSqlQuery] = useState("");
  const [originalCountry, setOriginalCountry] = useState("");
  const [ready, setReady] = useState(false);
  const [questionsMap, setQuestionsMap] = useState<Record<string, Question[]>>({});
  const [dbLoading, setDbLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedFormsForDelete, setSelectedFormsForDelete] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize saved forms and payload
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch payload
        const payloadRes = await fetch("/api/getPayload", { credentials: "include" });
        if (!payloadRes.ok) throw new Error("Failed to get payload");
        const payload = await payloadRes.json();
        if (!payload || payload.level <= 50) return;

        // Fetch saved forms
        const formsRes = await fetch("/api/savedForms", { credentials: "include" });
        if (!formsRes.ok) throw new Error("Failed to get saved forms");
        const data = await formsRes.json();
        setSavedForms(data.forms || []);

        // ถ้า refresh มาแล้วไม่ได้เลือก form ให้สร้าง default question ทันที
        if (!selectedFormId) {
          selectForm("");
        }

        // Set ready flag to true
        setReady(true);
      } catch (err) {
        console.error("Initialization error:", err);
        setReady(false);
      }

      // Fetch countries from Query.json
      try {
        const countriesRes = await fetch("/Query.json");
        const countriesData = await countriesRes.json();
        if (Array.isArray(countriesData.countries)) setCountries(countriesData.countries);
      } catch (err) {
        console.error("Failed to fetch countries:", err);
      }
    };
    init();
  }, []);

  // Select form
  const selectForm = async (id: string) => {
    if (!id) {
      setFormTitle("");
      setFormDescription("");
      setSelectedCountry("");
      setSqlQuery("");
      setOriginalSqlQuery("");
      setSelectedFormId("");

      // ✅ สร้าง default question ให้เลย
      const defaultQs = generateDefaultQuestions("temp_form");
      setQuestions(defaultQs);
      setQuestionsMap(prev => ({ ...prev, ["temp_form"]: defaultQs }));
      return;
    }

    const f = savedForms.find(f => f.id === id);
    if (!f) return;

    setFormTitle(f.title);
    setFormDescription(f.description);
    setSelectedCountry(f.country); // อัปเดต state
    setSqlQuery(f.queryText || "");
    setOriginalSqlQuery(f.queryText || "");
    setOriginalCountry(f.country);
    setSelectedFormId(id);

    if (questionsMap[id]) {
      setQuestions(questionsMap[id]);
    } else {
      // ใช้ f.country แทน selectedCountry
      let qs = await loadQuestions(id, f.country);
      if (!qs || qs.length === 0) qs = generateDefaultQuestions(id);

      // เพิ่ม byFixedValue default
      qs = qs.map((q: { options: any[] }) => ({
        ...q,
        options: q.options.map(o => ({
          ...o,
          byFixedValue: o.byFixedValue ?? false,
        })),
      }));

      setQuestions(qs);
      setQuestionsMap(prev => ({ ...prev, [id]: qs }));
    }
  };

  const handleCheckboxChange = (formId: string, checked: boolean) => {
    setSelectedFormsForDelete(prev =>
      checked ? [...prev, formId] : prev.filter(id => id !== formId)
    );
  };

  // bulk delete action
  const handleBulkDelete = async () => {
    if (selectedFormsForDelete.length === 0) {
      return Swal.fire("Warning", "Please select at least one form to delete", "warning");
    }

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedFormsForDelete.length} forms!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete them!",
    });

    if (confirm.isConfirmed) {
      try {
        setDbLoading(true);
        for (const formId of selectedFormsForDelete) {
          const res = await fetch(`/api/forms?id=${formId}`, {
            method: "DELETE",
            credentials: "include",
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to delete form");
        }

        setSavedForms(prev => prev.filter(f => !selectedFormsForDelete.includes(f.id)));
        if (selectedFormsForDelete.includes(selectedFormId)) {
          selectForm("");
        }
        setSelectedFormsForDelete([]);
        setBulkMode(false);

        Swal.fire("Deleted!", "Selected forms have been deleted.", "success");
      } catch (err: any) {
        console.error(err);
        Swal.fire("Error", err.message || "Failed to delete forms", "error");
      } finally {
        setDbLoading(false);
      }
    }
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "forms-menu",
      label: (
        <div className="p-3 bg-white rounded shadow w-72">
          <Input.Search
            placeholder="Search forms..."
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {savedForms
              .filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(form => (
                <div
                  key={form.id}
                  className="flex items-center space-x-2"
                  onClick={e => e.stopPropagation()} // ป้องกัน dropdown ปิด
                >
                  <Checkbox
                    checked={selectedFormsForDelete.includes(form.id)}
                    onChange={e => handleCheckboxChange(form.id, e.target.checked)}
                  >
                    {form.title}
                  </Checkbox>
                </div>
              ))}
          </div>
          <Button
            danger
            className="mt-2 w-full"
            disabled={selectedFormsForDelete.length === 0}
            onClick={handleBulkDelete}
          >
            Delete Selected
          </Button>
        </div>
      ),
    },
  ];

  const generateUUID = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    } else {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };

  const generateDefaultQuestions = (formId: string): Question[] => {
    const qId = generateUUID();
    return [
      {
        id: qId,
        title: "Default Question",
        description: "Auto generated question",
        type: "text",
        formId,
        options: [], // 👈 เริ่มต้นว่าง ไม่มี default option
      },
    ];
  };

  const loadQuestions = async (formId: string, country: string) => {
    try {
      const res = await fetch(`/api/saveQuestions?formId=${formId}&country=${country}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) return [];
      return Array.isArray(data.questions) ? data.questions : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Update country in all options when country changes
  useEffect(() => {
    if (!selectedFormId || !selectedCountry) return;

    setQuestions(prev => {
      let changed = false;

      const updated = prev.map(q => ({
        ...q,
        options: q.options.map(o => {
          if (o.country !== selectedCountry) {
            changed = true;
            return { ...o, country: selectedCountry };
          }
          return o;
        }),
      }));

      return changed ? updated : prev; // ถ้าไม่มีอะไรเปลี่ยน, return prev
    });
  }, [selectedCountry, selectedFormId]);

  // Add new option
  const addOption = (qid: string) => {
    const newOption: Option = { id: generateUUID(), label: "", paramName: "", value: "", checked: false };
    setQuestions(prev =>
      prev.map(q => q.id === qid ? { ...q, options: [...q.options, newOption] } : q)
    );
  };

  const updateOptionLabel = (
    qid: string,
    oid: string,
    key: "label" | "paramName" | "value" | "type" | "country" | "byFixedValue",
    val: string
  ) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === qid
          ? {
            ...q,
            options: q.options.map(o => {
              if (o.id !== oid) return o;

              if (key === "value") {
                return { ...o, value: val }; // เก็บตรง ๆ ไม่ต้องแปลง
              }
              if (key === "byFixedValue") {
                return { ...o, byFixedValue: val === "true", value: o.value || "" };
              }

              return { ...o, [key]: val };
            })
          }
          : q
      )
    );
  };

  // Save or update main query
  const handleSaveMainQuery = async () => {
    if (!formTitle || !selectedCountry) {
      return Swal.fire("Error", "Please enter the form name and select a country.", "error");
    }

    const isUpdate = Boolean(selectedFormId);
    const method = isUpdate ? "PUT" : "POST";

    try {
      setDbLoading(true);
      const res = await fetch("/api/forms", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          queryText: sqlQuery,
          country: selectedCountry,
          ...(isUpdate ? { id: selectedFormId } : {}),
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save Main Query");

      const savedId = String(data.id || data.formId);
      setSelectedFormId(savedId);

      let finalQuestions: Question[] = [];

      if (!isUpdate) {
        // ถ้าเป็นฟอร์มใหม่ → สร้าง default question อัตโนมัติ
        finalQuestions = generateDefaultQuestions(savedId);

        // save questions ไป backend ทันที
        await fetch("/api/saveQuestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: savedId,
            country: selectedCountry,
            questions: finalQuestions,
          }),
          credentials: "include",
        });
      } else {
        // ถ้า update → ใช้ questions เดิม
        finalQuestions = questions;
      }

      const newForm: SavedForm = {
        id: savedId,
        title: formTitle,
        description: formDescription,
        country: selectedCountry,
        queryText: sqlQuery,
        questions: finalQuestions,
      };

      setSavedForms(prev => isUpdate ? prev.map(f => f.id === savedId ? newForm : f) : [newForm, ...prev]);
      setQuestions(finalQuestions);
      setQuestionsMap(prev => ({ ...prev, [savedId]: finalQuestions }));

      Swal.fire("Success", isUpdate ? "Updated successfully." : "Created successfully.", "success");

    } catch (err: any) {
      console.error("Error saving form:", err);
      Swal.fire("Error", err.message || "Error saving Main Query", "error");
    } finally {
      setDbLoading(false);
    }
  };

  // Save Main + Questions พร้อมกัน
  const handleSaveAll = async () => {
    if (!formTitle || !selectedCountry.length) {
      return Swal.fire("Error", "Please enter title and select countries", "error");
    }

    const isUpdate = Boolean(selectedFormId);
    const method = isUpdate ? "PUT" : "POST";

    try {
      setDbLoading(true);

      // Save main form (DB)
      const res = await fetch("/api/forms", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          queryText: sqlQuery,
          country: selectedCountry,
          ...(isUpdate ? { id: selectedFormId } : {})
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save form");

      const savedId = String(data.id);
      setSelectedFormId(savedId);

      // Prepare questions
      const updatedQuestions = questions.map(q => ({
        ...q,
        formId: savedId,
        options: q.options.map(o => ({
          ...o,
          byFixedValue: o.byFixedValue ?? false
        }))
      }));

      // Save questions for each selected country
      const qRes = await fetch("/api/saveQuestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: savedId,
          countries: Array.isArray(selectedCountry)
            ? selectedCountry
            : selectedCountry.split(","), // ถ้าเป็น string → แปลงเป็น array
          questions: updatedQuestions
        }),
        credentials: "include",
      });
      console.log({
        formId: savedId,
        countries: selectedCountry,
        questions: updatedQuestions
      });
      const qData = await qRes.json();
      if (!qRes.ok || !qData.success) throw new Error(qData.error || "Failed to save questions");

      // Update state
      const newForm: SavedForm = {
        id: savedId,
        title: formTitle,
        description: formDescription,
        country: selectedCountry,
        queryText: sqlQuery,
        questions: updatedQuestions,
      };

      setSavedForms(prev =>
        isUpdate ? prev.map(f => f.id === savedId ? newForm : f) : [newForm, ...prev]
      );
      setQuestions(updatedQuestions);
      setQuestionsMap(prev => ({ ...prev, [savedId]: updatedQuestions }));

      Swal.fire("Success", isUpdate ? "Updated successfully." : "Created successfully.", "success");

    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.message || "Error saving form", "error");
    } finally {
      setDbLoading(false);
    }
  };

  if (!ready) return <p>Loading...</p>;

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <div className="max-w-3xl mx-auto mb-6">
        <div className="bg-white shadow-sm rounded-lg flex items-center gap-3 px-3 py-2">
          {/* Form Selector เต็มพื้นที่ */}
          <div className="flex-1 h-10 mt-2">
            <FormSelector
              savedForms={savedForms}
              selectedFormId={selectedFormId}
              onSelect={selectForm}
              className="w-full h-full text-black"
            />
          </div>

          {/* Manage Forms Dropdown */}
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="primary" className="h-10 flex items-center gap-1 px-3">
              Manage Forms <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mb-6 p-4 border rounded bg-white shadow relative text-black">
        <MainQueryEditor
          formTitle={formTitle}
          formDescription={formDescription}
          selectedCountry={selectedCountry}
          countries={countries}
          sqlQuery={sqlQuery}
          questions={questions}
          optionsFromDatabase={{}}
          onTitleChange={setFormTitle}
          onDescriptionChange={setFormDescription}
          onCountryChange={setSelectedCountry}
          onQueryChange={setSqlQuery}
          onRunQuery={() => { }}
          onSaveQuery={handleSaveMainQuery}
          selectedFormId={selectedFormId}
          className="text-black"
        />
      </div>

      <form className="space-y-6 max-w-3xl mx-auto bg-white p-6 rounded shadow text-black">
        {questions.map(q => (
          <div key={q.id} className="border p-4 rounded mb-4 border-blue-300">
            <div className="w-full px-4 py-2 mb-2 rounded-lg bg-yellow-300 text-yellow-900 font-bold text-lg shadow-md text-center">
              Option Select
            </div>
            {q.options.map(o => (
              <OptionItem
                key={o.id}
                option={o}
                questionId={q.id}
                onUpdate={updateOptionLabel}
                onDelete={(qid, oid) =>
                  setQuestions(prev =>
                    prev.map(qItem =>
                      qItem.id === qid
                        ? { ...qItem, options: qItem.options.filter(opt => opt.id !== oid) }
                        : qItem
                    )
                  )
                }
                className="text-black"
              />
            ))}
            <div className="flex justify-between mt-2">
              <button
                type="button"
                onClick={() => addOption(q.id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
              >
                + Add Option
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
              >
                Save All
              </button>
            </div>
          </div>
        ))}
      </form>
    </div>
  );
}
