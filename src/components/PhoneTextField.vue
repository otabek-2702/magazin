<script setup>
import { formatPhone } from "@/helpers";
import { useSlots, watchEffect } from "vue";
import { watch } from "vue";

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);
const slots = useSlots();

const validatePhone = (value) => {
  const phonePattern = /^\d{2} \d{3} \d{2} \d{2}$/;
  return phonePattern.test(value) || "Неправильный формат номера телефона";
};

// const handleInput = (value) => {
//   const formatted = formatPhone(value);
//   emit("update:modelValue", formatted);
// };

const phone_number = ref(props.modelValue);

watch(
  phone_number,
  (newVal) => {
    const formatted = formatPhone(newVal);
    emit("update:modelValue", formatted);
    phone_number.value = formatted;
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal === phone_number.value) return;
    const formatted = formatPhone(newVal);
    emit("update:modelValue", formatted);
    phone_number.value = formatted;
  }
);
</script>

<template>
  <!-- :error="!!validationError"
:error-messages="validationError" -->
  <VTextField
    label="Номер телефона"
    v-model="phone_number"
    :rules="[validatePhone]"
    mask="## ### ## ##"
    clearable
  >
    <template #prepend >+998</template>
    <template v-for="(_, slot) in slots" #[slot]="slotProps">
      <slot :name="slot" v-bind="slotProps"></slot>
    </template>
  </VTextField>
</template>

<style scoped>
</style>
