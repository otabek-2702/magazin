<script setup>
const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const formatPhone = (value) => {
  // Remove all non-numeric characters
  const cleaned = value?.toString().replace(/\D/g, "") ?? "";
  // Limit to `p` digits
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

console.log(formatPhone("4564"));
</script>

<template>
  <VTextField
    @input="(e) => emit('update:modelValue', formatPhone(e.target.value))"
    :value="formatPhone(props.modelValue)"
  >
    <template #prepend> +998 </template>
  </VTextField>
</template>

<style scoped></style>
