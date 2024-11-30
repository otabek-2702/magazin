import axios from "@/plugins/axios";
import { nextTick } from "vue";

export const transformPrice = (price, nullable = false) => {
  let formattedPrice = price
    ?.toString()
    .replace(".00", "")
    .replace(/\s/g, "")
    .replace(/[^\d\s]/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    .trim();
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
  resourceKey,
  customization = { is: false }
) => {
  try {
    const response = await axios.get(url);

    if (response.status === 200) {
      if (customization.is) {
        dataState.value = response.data[resourceKey].map(customization.method);
      } else {
        dataState.value = resourceKey ? response.data[resourceKey] : response.data;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

export const autoSelectInputValue = (e) => {
  nextTick(() => {
    e.target.select();
  });
};

export const getFormattedToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed, so add 1
  const day = String(today.getDate()).padStart(2, "0"); // Ensure day is 2 digits

  // Format the date as YYYY-MM-DD
  return `${year}-${month}-${day}`;
};

/**
 * Creates a new object by omitting specified keys from the original object
 *
 * @param {Object} obj - The source object
 * @param {string[]} keysToOmit - An array of keys to remove
 * @returns {Object} A new object without the specified keys
 */
export function omit(obj, keysToOmit) {
  // Create a shallow copy of the object
  const result = { ...obj };

  // Remove specified keys
  keysToOmit.forEach((key) => {
    delete result[key];
  });

  return result;
}
