<script setup>
import {
  autoSelectInputValue,
  fetchOptions,
  removeSpaces,
  transformPrice,
} from "@/helpers";
import axios from "@/plugins/axios";
import { computed, onMounted, watch } from "vue";
import { toast } from "vue3-toastify";
import CheckDialog from "./CheckDialog.vue";

const props = defineProps({
  paymentInvoice: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["fetchDatas"]);

const isDialogVisible = ref(false);
const refForm = ref();
const isFetching = ref(false);
const invoice_status = computed(() => ({
  draft: props.paymentInvoice?.status === "Не опачено",
  confirmed: props.paymentInvoice?.status === "Оплачено",
  rejected: props.paymentInvoice?.status === "Отклонено",
}));
const input_price = ref();
const payment_type = ref();
const sale_price = ref(0);
const payment_response = ref({});

const onConfirm = async () => {
  const { valid } = await refForm.value?.validate();
  if (!valid) return;

  isFetching.value = true;
  try {
    const response = await axios.post(
      `/payment_invoices/confirm/${props.paymentInvoice?.id}`,
      {
        payment_type_id: payment_type.value,
        sale: removeSpaces(sale_price.value),
      }
    );

    if (response.status === 200) {
      payment_response.value = response.data?.payment_invoice;
      toast("Успешно", {
        theme: "auto",
        type: "success",
      });
      emit("fetchDatas");

      handleDialogModelValueUpdate(false);
    }
  } catch (error) {
    console.error(error);
  } finally {
    isFetching.value = false;
  }
};

// Calculator
const calculate = computed(() => {
  const trimmedPrice = removeSpaces(totalPriceWithSale.value);
  const givenPrice = removeSpaces(input_price.value);

  return {
    sdacha:
      givenPrice > trimmedPrice ? transformPrice(givenPrice - trimmedPrice) : 0,
    doljen:
      givenPrice < trimmedPrice ? transformPrice(trimmedPrice - givenPrice) : 0,
  };
});

const handleDialogModelValueUpdate = (val) => {
  isDialogVisible.value = !!val;

  if (!val) {
    nextTick(() => {
      input_price.value = null;
      payment_type.value = null;
      payment_response.value = {};
      sale_price.value = 0;
    });
    refForm.value?.reset();
    refForm.value?.resetValidation();
  }
};

const maxSale = (val) => {
  const maxSalePrice = Number(props.paymentInvoice?.total_amount) / 10;
  const numeredVal = removeSpaces(val);
  return (
    !(numeredVal > maxSalePrice) ||
    `Невозможно применить скидку ${val} сум — превышен лимит 10%. Максимум — ${transformPrice(
      maxSalePrice
    )} сум`
  );
};

const totalPriceWithSale = computed(
  () =>
    removeSpaces(props.paymentInvoice?.total_amount) -
    removeSpaces(sale_price.value)
);
//watch(
//  () => props.isDialogOpen,
//  (newVal) => {
//    if (newVal) {
//      const saledPrice = removeSpaces(props.paymentInvoice?.total_amount) / 10;
//
//      emit("update:sale_price", saledPrice);
//    }
//  }
//);
const payment_types_list = ref();
onMounted(() => fetchOptions("payment_types", payment_types_list, null));

// Auto Open
watch(
  () => props.paymentInvoice,
  () => {
    invoice_status.value.draft && handleDialogModelValueUpdate(true);
  }
);
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 500"
    v-model="isDialogVisible"
  >
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn
        v-if="invoice_status.draft"
        @click="handleDialogModelValueUpdate(true)"
        v-bind="props"
      >
        Оплатить</VBtn
      >
    </template>

    <VCard class="pa-sm-9 pa-5">
      <DialogCloseBtn
        variant="text"
        size="small"
        @click="handleDialogModelValueUpdate(false)"
      />

      <VCardItem class="text-center pb-3">
        <VCardTitle class="text-h5">Подтверждение</VCardTitle>
      </VCardItem>

      <VCardText>
        <VForm ref="refForm">
          <VRow>
            <VCol cols="12">
              <h3 class="text-secondary">
                Фактическая Сумма :
                {{ transformPrice(props.paymentInvoice?.total_amount) }} so'm
              </h3>
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
              <h3>Сдача: {{ calculate.sdacha }} so'm</h3>
              <h3>Доплата: {{ calculate.doljen }} so'm</h3>
            </VCol>
            <VCol cols="12">
              <VSelect
                v-model="payment_type"
                label="Выберите способ оплаты"
                :items="payment_types_list"
                item-title="name"
                item-value="id"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="sale_price"
                :model-value="transformPrice(sale_price, true)"
                label="Введите сумму для скидки"
                :rules="[maxSale]"
                class="text-field-error_size"
                @focus="autoSelectInputValue"
                persistent-placeholder
              />
            </VCol>
            <h2 class="ps-3 py-3">
              Общая сумма : {{ transformPrice(totalPriceWithSale) }} so'm
            </h2>
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
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
  <!-- <CheckDialog
    v-if="payment_response || props.paymentInvoice"
    :salePrice="sale_price"
    :paymentInvoice="
      invoice_status.confirmed ? props.paymentInvoice : payment_response
    "
  /> -->
  <CheckDialog
    v-if="props.paymentInvoice"
    :salePrice="removeSpaces(sale_price)"
    :paymentInvoice="props.paymentInvoice"
  />
</template>

<style scoped></style>
