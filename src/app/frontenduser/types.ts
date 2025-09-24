// types.ts

export interface Option {
  id: string;
  label: string;
  value?: string | string[]; // ของคุณเอาไว้เก็บ query / code
  checked?: boolean;
  paramName?: string;
  type?: "text" | "dropdown" | "date" | "multiselect";
  optionsFromSQL?: { name: string; code: string; optionsql?: string }[]; // <-- เพิ่ม optionsql
  valueType?: "string" | "number";
  mainQuery?: string;
  loading?: boolean;
  country?: string;

  // ✅ เพิ่มฟิลด์ใหม่
  selectedValue?: string | null;
  selectedValues?: string[] | null;
  byFixedValue?: boolean;
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  mainQuery: string;
  options: Option[];
  formId: string;
}

export interface SavedForm {
  queryText: any;
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface FrontendUserState {
  selectedFormId: string;
  selectedCountry: string;
  questions: Question[];
}

export interface FrontendUserProps {
    state?: any; // สามารถระบุ type ที่เหมาะสมมากขึ้น เช่น string | object
}

export interface CountrySelectorProps {
  selectedCountry: string;
  countries: string[];
  onSelectCountry: (country: string) => void;
  isLoading?: boolean;
  hidden?: boolean;
  className?: string;
}

export interface ExportButtonProps {
  selectedCountry: string;
  selectedFormId: string;
  savedForms: any[];
  questions: any[];
  className?: string;
}

export interface SavedForm {
  id: string;
  title: string;
  description?: string;
}

export interface FormSelectorProps {
  selectedFormId: string;
  savedForms: SavedForm[];
  onSelectForm: (id: string) => void;
  className?: string;
}

export interface FormTitleAndDescriptionProps {
    selectedForm: SavedForm;
}

export interface QuestionCardProps {
    question: Question;
    form: any;
    country: string;
    onUpdateOptionValue: (
        qId: string,
        oId: string,
        value: string | string[] | { name: string; code: string }[],
        optionsFromSQL?: { name: string; code: string }[]
    ) => void;
    className?: string;
}