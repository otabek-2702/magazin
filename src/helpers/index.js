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

export const transformDecimalPrice = (price, nullable = false) => {
  if (price == null || price === "") return nullable ? "" : "0";

  let formattedPrice = price
    .toString()
    .replace(/[^\d.]/g, "") // Keep only digits and decimal
    .replace(/(\..*?)\./g, "$1"); // Keep only first decimal point

  // Handle decimal places
  const parts = formattedPrice.split(".");
  if (parts[1]) {
    // If all decimal digits are zeros, remove decimal part completely
    if (!/[1-9]/.test(parts[1])) {
      parts.length = 1; // Remove decimal part
    } else if (parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2);
    }
  }

  // Add spaces for thousands separator in the integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".").trim();
};

export const removeSpaces = (input) => {
  // Remove spaces, thousands separators, and handle decimal points
  const newVal = input
    ?.toString()
    .replace(/\s+/g, "") // Remove spaces
    .replace(/[^\d.-]/g, ""); // Remove anything that isn't a digit, dot, or minus
  // .replace(/(\..*?)\./g, "$1");      // Ensure only one decimal point

  const parsedValue = Number(newVal);

  return isNaN(parsedValue) ? 0 : parsedValue;
};

export function formatTimestamp(isoString) {
  if (!isoString) return "";
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
        return;
      }
      dataState.value = resourceKey
        ? response.data[resourceKey]
        : response.data;
      return;
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

export const getPrettyDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const formatPhone = (value) => {
  const cleaned = value?.toString().replace(/\D/g, "") ?? "";
  return cleaned
    .substring(0, 9)
    .replace(
      /(\d{2})(\d{1,3})?(\d{1,2})?(\d{1,2})?/,
      (match, p1, p2, p3, p4) => {
        let formatted = p1;
        if (p2) formatted += ` ${p2}`;
        if (p3) formatted += ` ${p3}`;
        if (p4) formatted += ` ${p4}`;
        return formatted;
      }
    )
    .trim();
};
