<script setup>
import {
  autoSelectInputValue,
  fetchOptions,
  removeSpaces,
  transformPrice,
} from "@/helpers";
import axios from "@/plugins/axios";
import { computed, onMounted, provide } from "vue";
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

const isDialogVisible = ref(false);
const refForm = ref();
const isFetching = ref(false);
const input_price = ref();
const payment_type = ref();

const payment_types_list = ref();

const onConfirm = async () => {
  const { valid } = await refForm.value?.validate();
  if (!valid) return;

  isFetching.value = true;
  try {
    const reponse = await axios.post(`/payment_invoices/confirm/${props.id}`, {
      payment_type_id: payment_type.value,
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
    console.error(error);
  } finally {
    isFetching.value = false;
  }
};

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
  isDialogVisible.value = val;

  if (!val) {
    nextTick(() => {
      input_price.value = null;
      payment_type.value = null;
    });
    refForm.value?.reset();
    refForm.value?.resetValidation();
  }

  emit("update:sale_price", 0);
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
//watch(
//  () => props.isDialogOpen,
//  (newVal) => {
//    if (newVal) {
//      const saledPrice = removeSpaces(props.totalPrice) / 10;
//
//      emit("update:sale_price", saledPrice);
//    }
//  }
//);
onMounted(() => fetchOptions("payment_types", payment_types_list, null));
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 500"
    v-model="isDialogVisible"
    @update:model-value="handleDialogModelValueUpdate"
  >
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn @click="handleDialogModelValueUpdate(true)" v-bind="props">Оплатить</VBtn>
    </template>

    <VCard class="pa-sm-9 pa-5">
      <DialogCloseBtn variant="text" size="small" @click="onFormCancel" />

      <VCardItem class="text-center pb-3">
        <VCardTitle class="text-h5">Подтверждение</VCardTitle>
      </VCardItem>

      <VCardText>
        <VForm ref="refForm">
          <VRow>
            <VCol cols="12">
              <h3 class="text-secondary">
                Фактическая Сумма : {{ transformPrice(props.totalPrice) }} so'm
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
                @update:modelValue="updateSalePrice"
                :value="transformPrice(props.sale_price, true)"
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
</template>

<style scoped></style>
