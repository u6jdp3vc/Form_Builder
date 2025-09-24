// components/FormTitleAndDescription.tsx
import React from "react";
import { FormTitleAndDescriptionProps } from "../types";

const FormTitleAndDescription: React.FC<FormTitleAndDescriptionProps> = ({ selectedForm }) => {
    return (
        <div className="max-w-4xl mx-auto mb-10 bg-white p-6 rounded-xl shadow-md border border-gray-200 text-black">
            <h2 className="text-2xl font-bold mb-2">{selectedForm.title}</h2>
            {selectedForm.description && (
                <p>{selectedForm.description}</p>
            )}
        </div>
    );
};

export default FormTitleAndDescription;
