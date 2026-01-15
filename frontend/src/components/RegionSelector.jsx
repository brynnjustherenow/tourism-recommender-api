import React from "react";
import { Cascader } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import {
  province as provinceData,
  city as cityData,
  county as countyData,
} from "china-region-data";

// Process region data for Cascader
const processRegionData = () => {
  const provinces = provinceData.map((province) => {
    // Get cities for this province using the city data
    // cityData is an object keyed by province ID
    const provinceId = province.id;
    const citiesInProvince = cityData[provinceId] || [];

    const cities = citiesInProvince.map((city) => {
      // Get counties for this city using the county data
      // countyData is an object keyed by city ID
      const cityId = city.id;
      const countiesInCity = countyData[cityId] || [];

      const counties = countiesInCity.map((county) => ({
        value: county.id,
        label: county.name,
      }));

      return {
        value: city.id,
        label: city.name,
        children: counties.length > 0 ? counties : undefined,
      };
    });

    return {
      value: province.id,
      label: province.name,
      children: cities.length > 0 ? cities : undefined,
    };
  });

  return provinces;
};

const regionOptions = processRegionData();

const RegionSelector = ({
  value,
  onChange,
  placeholder = "请选择省/市/区",
  style,
  disabled = false,
  size = "middle",
  showSearch = true,
  allowClear = true,
  changeOnSelect = false,
}) => {
  // Convert value array to display label
  const displayRender = (labels, selectedOptions) => {
    return labels.join(" / ");
  };

  // Handle change
  const handleChange = (selectedValue, selectedOptions) => {
    if (onChange) {
      // Return object with codes and names
      const regionInfo = {
        provinceCode: selectedValue[0],
        provinceName: selectedOptions[0]?.label,
        cityCode: selectedValue[1],
        cityName: selectedOptions[1]?.label,
        districtCode: selectedValue[2],
        districtName: selectedOptions[2]?.label,
        codes: selectedValue,
        names: selectedOptions.map((opt) => opt.label).join(" / "),
      };
      onChange(regionInfo, selectedValue, selectedOptions);
    }
  };

  // Convert region info object to Cascader value array
  const convertToValue = (regionInfo) => {
    if (!regionInfo) return [];

    if (Array.isArray(regionInfo)) {
      return regionInfo;
    }

    return [
      regionInfo.provinceCode,
      regionInfo.cityCode,
      regionInfo.districtCode,
    ].filter(Boolean);
  };

  const cascaderValue = convertToValue(value);

  return (
    <Cascader
      options={regionOptions}
      value={cascaderValue}
      onChange={handleChange}
      placeholder={placeholder}
      style={style}
      disabled={disabled}
      size={size}
      showSearch={showSearch}
      allowClear={allowClear}
      changeOnSelect={changeOnSelect}
      displayRender={displayRender}
      expandTrigger="hover"
      suffixIcon={<EnvironmentOutlined />}
      fieldNames={{ label: "label", value: "value", children: "children" }}
    />
  );
};

export default RegionSelector;
