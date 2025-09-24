// types.ts

export interface SavedForm {
  id: string;
  title: string;
  description: string;
  country: string;
  queryText?: string;
  questions: Question[];
}

export type QuestionType = "text" | "textarea" | "checkbox" | "dropdown" | "multiselect" | "date";

export interface Option {
  id: string;
  label: string;
  paramName?: string;
  value?: string;
  type?: "text" | "textarea" | "checkbox" | "dropdown" | "multiselect" | "date";
  checked?: boolean;
  country?: string;
  optionsFromSQL?: { value: string; label: string }[];
  byFixedValue?: boolean;
  optionsByCountry?: Record<string, { name: string; code: string }[]>;
  selectedValue?: string | null;
  selectedValues?: string[];
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  options: Option[];
  fromDate?: string;
  toDate?: string;
  formId: string;
}

export interface FormSelectorProps {
  savedForms: SavedForm[];
  selectedFormId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean; // optional
  className?: string;
}

export interface MainQueryEditorProps {
  formTitle: string;
  formDescription: string;
  selectedCountry: string;
  countries?: string | string[];
  sqlQuery: string;
  questions: Question[];
  selectedFormId: string;
  optionsFromDatabase?: Record<string, string[]>;
  onTitleChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onCountryChange: (val: string) => void;
  onQueryChange: (val: string) => void;
  onRunQuery: () => void;
  onSaveQuery: () => void;
  className?: string;
}

export interface OptionItemProps {
  option: Option;
  questionId: string;
  onUpdate: (
    qid: string,
    oid: string,
    key: "label" | "paramName" | "value" | "type" | "country" | "byFixedValue",
    value: string
  ) => void;
  onDelete: (qid: string, oid: string, label: string) => void;
  className?: string;
}
