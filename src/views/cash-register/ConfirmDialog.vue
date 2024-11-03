<script setup>
import { requiredValidator } from "@/@core/utils/validators";
import { autoSelectInputValue, removeSpaces, transformPrice } from "@/helpers";
import axios from "@/plugins/axios";
import { computed, provide } from "vue";
import { toast } from "vue3-toastify";

const props = defineProps({
  isDialogOpen: {
    type: Boolean,
    required: true,
  },
  totalPrice: {
    type: String,
    required: true,
  },
  id: {
    required: true,
    type: String,
  },
  sale_price: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "update:isDialogOpen",
  "fetchDatas",
  "update:sale_price",
]);

const onFormCancel = () => {
  emit("update:isDialogOpen", false);
};

const isFetching = ref(false);
const input_price = ref();
const payment_type = ref();

const payment_types_list = [
  { name: "Наличные", value: "cash" },
  { name: "Uzcard", value: "uzcard" },
  { name: "Humo", value: "humo" },
  { name: "Click", value: "click" },
];

const onConfirm = async () => {
  isFetching.value = true;
  try {
    const reponse = await axios.post(`/payment_invoices/confirm/${props.id}`, {
      payment_type: payment_type.value,
      sale: removeSpaces(props.sale_price),
    });

    if (reponse.status === 200) {
      toast("Успешно", {
        theme: "auto",
        type: "success",
      });
      emit("fetchDatas");

      handleDialogModelValueUpdate(false);
    }
  } catch (error) {
    console.log(error);
  } finally {
    isFetching.value = false;
  }
};

const calculate = computed(() => {
  const trimmedPrice = removeSpaces(props.totalPrice);
  const givenPrice = removeSpaces(input_price.value);

  return {
    sdacha:
      givenPrice > trimmedPrice ? transformPrice(givenPrice - trimmedPrice) : 0,
    doljen:
      givenPrice < trimmedPrice ? transformPrice(trimmedPrice - givenPrice) : 0,
  };
});

const handleDialogModelValueUpdate = (val) => {
  emit("update:isDialogOpen", val);
  emit("update:sale_price", 0);

  if (!val) {
    nextTick(() => {
      input_price.value = null;
      payment_type.value = null;
    });
  }
};

const maxSale = (val) => {
  const maxSalePrice = removeSpaces(props.totalPrice) / 10;
  const numeredVal = removeSpaces(val);
  return (
    !(numeredVal > maxSalePrice) ||
    `Невозможно применить скидку ${val} сум — превышен лимит 10%. Максимум — ${transformPrice(
      maxSalePrice
    )} сум`
  );
};

const updateSalePrice = (value) => {
  emit("update:sale_price", value);
};

const totalPriceWithSale = computed(
  () => removeSpaces(props.totalPrice) - removeSpaces(props.sale_price)
);
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 500"
    :model-value="props.isDialogOpen"
    @update:model-value="handleDialogModelValueUpdate"
  >
    <VCard class="pa-sm-9 pa-5">
      <DialogCloseBtn variant="text" size="small" @click="onFormCancel" />

      <VCardItem class="text-center pb-3">
        <VCardTitle class="text-h5">Подтверждение</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12">
            <h2>Общая сумма: {{ transformPrice(totalPriceWithSale) }} so'm</h2>
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="input_price"
              :value="transformPrice(input_price, true)"
              label="Введите сумму "
              :rules="[]"
              autofocus
            />
          </VCol>

          <VCol cols="12">
            <h2>Сдача: {{ calculate.sdacha }} so'm</h2>
            <h2>Доплата: {{ calculate.doljen }} so'm</h2>
          </VCol>
          <VCol cols="12">
            <VSelect
              v-model="payment_type"
              label="Выберите способ оплаты"
              :items="payment_types_list"
              item-title="name"
              item-value="value"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              @update:modelValue="updateSalePrice"
              :value="transformPrice(props.sale_price, true)"
              label="Введите сумму для скидки"
              :rules="[maxSale]"
              class="text-field-error_size"
              @focus="autoSelectInputValue"
            />
          </VCol>
          <VDivider />
          <VCol cols="12" class="d-flex justify-space-between">
            <VBtn
              color="info"
              v-print="{
                id: 'receipt-content',
              }"
            >
              <VIcon size="20" icon="mdi-printer" class="me-2" />
              Печать чека
            </VBtn>
            <VBtn
              color="success"
              @click="onConfirm"
              type="submit"
              :disabled="isFetching"
              :loading="isFetching"
            >
              Подтвердить
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped></style>
