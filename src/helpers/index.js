import axios from "@/plugins/axios";
import { nextTick } from "vue";

export const transformPrice = (price, nullable = false) => {
  let formattedPrice = price
    ?.toString()
    .replace(".00", "")
    .replace(/\s/g, "")
    .replace(/[^\d\s]/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    .trim()
  if (!formattedPrice && !nullable) {
    return "0";
  }
  return formattedPrice ?? "";
};

export const removeSpaces = (input) => {
  let newVal = input?.toString().replace(/\s+/g, "");
  let newValNumeric = Number(newVal);
  return newValNumeric ? newValNumeric : newVal;
};

export function formatTimestamp(isoString) {
  const date = new Date(isoString);

  // Format each part with leading zeros
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const fetchOptions = async (
  url,
  dataState,
  key,
  customization = { is: false }
) => {
  try {
    const response = await axios.get(url);

    if (response.status === 200) {
      if (customization.is) {
        dataState.value = response.data[key].map(customization.method);
      } else {
        dataState.value = response.data[key];
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const autoSelectInputValue = (e) => {
  nextTick(() => {
    e.target.select();
  });
};
