import axios from "@/plugins/axios";
import { nextTick } from "vue";

export const transformPrice = (price) => {
  let formattedPrice = price
    ?.toString()
    .replace(".00", "")
    .replace(/\s/g, "")
    .replace(/[^\d\s]/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return formattedPrice?.trim() ?? "";
};

export const removeSpaces = (input) => {
  let newVal = input?.toString().replace(/\s+/g, "");
  let newValNumeric = Number(newVal);
  return newValNumeric ? newValNumeric : newVal;
};

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
