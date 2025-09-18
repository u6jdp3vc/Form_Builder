import { Select, Spin } from "antd";
import React from "react";
import { CountrySelectorProps } from "../types";

const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  countries,
  onSelectCountry,
  isLoading,
  hidden,
}) => {
  if (hidden) return null;

  const countryMap: Record<string, string> = {
    "AS-DTGBTN": "Bhutan",
    "AS-DTGGER": "Germany",
    "AS-DTGJPN": "Japan",
    "AS-DTGKHM": "Cambodia",
    "AS-DTGKUL": "Malaysia",
    "AS-DTGLAO": "Laos",
    "AS-DTGMAL": "Maldives",
    "AS-DTGMMR": "Myanmar",
    "AS-DTGPHL": "Philippines",
    "AS-DTGSIN": "Singapore",
    "AS-DTGSLK": "Sri Lanka",
    "AS-DTGTHA": "Thailand",
    "AS-DTGVNM": "Vietnam",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 text-black">
      <label className="block mb-2 font-semibold">
        Select Country:
      </label>

      <Select
        showSearch
        value={selectedCountry || undefined}
        onChange={onSelectCountry}
        placeholder="-- Select Country --"
        optionFilterProp="children"
        className="w-full text-black"
        notFoundContent={isLoading ? <Spin size="small" /> : "No countries found"}
        filterOption={(input, option) =>
          (option?.children as unknown as string)
            .toLowerCase()
            .includes(input.toLowerCase())
        }
        disabled={isLoading}
      >
        {countries.map(code => (
          <Select.Option key={code} value={code} className="text-black">
            {countryMap[code] || code}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default CountrySelector;
