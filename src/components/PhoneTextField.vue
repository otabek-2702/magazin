<script setup>
import { watch } from "vue";

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const formatPhone = (value) => {
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

const validatePhone = (value) => {
  const phonePattern = /^\d{2} \d{3} \d{2} \d{2}$/;
  return phonePattern.test(value) || "Неправильный формат номера телефона";
};

const handleInput = (value) => {
  const formatted = formatPhone(value);
  emit("update:modelValue", formatted);
};

const phone_number = ref();

watch(
  phone_number,
  (newVal) => {
    const formatted = formatPhone(newVal);
    emit("update:modelValue", formatted);
    phone_number.value = formatted;
  },
  { immediate: true }
);
</script>

<template>
  <!-- :error="!!validationError"
:error-messages="validationError" -->
  <VTextField
    label="Номер телефона"
    v-model="phone_number"
    :rules="[validatePhone]"
    mask="### ## ##"
    clearable
  >
    <template #prepend>+998</template>
  </VTextField>
</template>

<style scoped></style>
