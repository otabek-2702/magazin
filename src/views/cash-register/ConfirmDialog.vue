<script setup>
import { removeSpaces, transformPrice } from "@/helpers";
import { computed } from "vue";

const props = defineProps({
  isDialogOpen: {
    type: Boolean,
    required: true,
  },
  totalPrice: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:isDialogOpen"]);

const onFormCancel = () => {
  emit("update:isDialogOpen", false);
};

const input_price = ref();

const calculate = computed(() => {
    const trimmedPrice = removeSpaces(props.totalPrice)
    return {
        sdacha: removeSpaces(input_price.value) > trimmedPrice ?  transformPrice(removeSpaces(input_price.value)-trimmedPrice ): 0,
        doljen: removeSpaces(input_price.value) < trimmedPrice ? transformPrice(trimmedPrice - removeSpaces(input_price.value)): 0
    }
})
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 500"
    :model-value="props.isDialogOpen"
    @update:model-value="(v) => emit('update:isDialogOpen', v)"
  >
    <VCard class="pa-sm-9 pa-5">
      <DialogCloseBtn variant="text" size="small" @click="onFormCancel" />

      <VCardItem class="text-center pb-3">
        <VCardTitle class="text-h5">Подтверждение</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12">
            <h2>Общая сумма: {{ props.totalPrice }}</h2>
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="input_price"
              :value="transformPrice(input_price)"
              label="Введите сумму"
              :rules="[]"
            />
          </VCol>
          
          <VCol cols="12">
            <h2>Сдача: {{ calculate.sdacha }}</h2>
            <h2>Доплата: {{ calculate.doljen }}</h2>
          </VCol>
          <VDivider />
          <VCol cols="12">
            <VBtn
              color="info"
              v-print="{
                id: 'receipt-content',
              }"
            >
              <VIcon size="20" icon="mdi-printer" class="me-2" />
              Печать чека
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped></style>
