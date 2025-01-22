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
import { nextTick } from "vue";
import { ref } from "vue";
import { requiredValidator } from "@/@core/utils/validators";
import PhoneTextField from "@/components/PhoneTextField.vue";

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
  draft: props.paymentInvoice?.status === "Не оплачено",
  confirmed: props.paymentInvoice?.status === "Оплачено",
  rejected: props.paymentInvoice?.status === "Отклонено",
}));
const input_price = ref();
const payment_type = ref();
const sale_price = ref(0);
const phone_number = ref();
const payment_response = ref({});

const onConfirm = async () => {
  const { valid } = await refForm.value?.validate();
  if (!valid) return;

  isFetching.value = true;
  try {
    const clear_phone = phone_number.value?.replace(/\s+/g, "");

    const response = await axios.post(
      `/payment_invoices/confirm/${props.paymentInvoice?.id}`,
      {
        payments: multi_prices.value.map((el) => ({
          type_id: el.type_id,
          price: removeSpaces(el.price),
        })),
        sale: removeSpaces(sale_price.value),
        phone: "+998" + clear_phone,
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
  const givenPrice = removeSpaces(totalMultiPrice.value);

  return {
    sdacha:
      givenPrice > trimmedPrice ? transformPrice(givenPrice - trimmedPrice) : 0,
    doljen:
      givenPrice < trimmedPrice ? transformPrice(trimmedPrice - givenPrice) : 0,
  };
});

const handleDialogModelValueUpdate = (val) => {
  isDialogVisible.value = !!val;

  if (val) {
    multi_prices.value[0].price = transformPrice(totalPriceWithSale.value);
  }

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
    if (invoice_status.value?.draft) {
      handleDialogModelValueUpdate(true);
    }
  }
);

// Multi Price
const multi_prices = ref([{ type_id: null, price: null }]);

const maxMultiPrice = computed(
  () => multi_prices.value.length >= payment_types_list.value?.length
);

const totalMultiPrice = computed(() =>
  multi_prices.value.reduce(
    (accumulator, el) => accumulator + removeSpaces(el.price),
    0
  )
);
const totalAmountEquality = computed(() => {
  if (totalMultiPrice.value > totalPriceWithSale.value) return "больше";
  if (totalMultiPrice.value < totalPriceWithSale.value) return "меньше";
  return false;
});

const duplicatePaymentType = computed(() => {
  const typeIds = multi_prices.value.map((el) => el.type_id).filter((el) => el);
  return new Set(typeIds).size !== typeIds.length;
});

const reValidate = () => {
  nextTick(() => {
    refForm.value?.validate();
  });
};
watch([duplicatePaymentType, totalAmountEquality], () => reValidate());

const addMultiPrice = () => {
  if (maxMultiPrice.value) return;

  multi_prices.value.push({ type_id: null, price: "" });
  nextTick(() => {
    refForm.value.validate();
  });
};

const deleteMultiPrice = (index) => {
  if (multi_prices.value.length === 1) return;

  multi_prices.value?.splice(index, 1);
};

const calculateSecondPrice = (index) => {
  let total_price_with_sale = removeSpaces(totalPriceWithSale.value);
  let total_multi_price = removeSpaces(totalMultiPrice.value);
  let multi_prices_length = multi_prices.value?.length;

  // if NOT have the element after it and total multi is bigger than total
  if (
    !multi_prices.value[index + 1] &&
    total_multi_price >= total_price_with_sale
  ) {
    // if the last element
    if (multi_prices_length > 1 && multi_prices_length === index + 1) {
      multi_prices.value[index].price = transformPrice(
        total_price_with_sale -
          (total_multi_price - removeSpaces(multi_prices.value[index].price))
      );
    }
    return;
  }

  if (multi_prices_length === payment_types_list.value.length) return;

  let price = transformPrice(
    total_price_with_sale -
      multi_prices.value.reduce(
        (accumulator, el, i) =>
          accumulator + (i <= index ? removeSpaces(el.price) : 0),
        0
      )
  );

  // if after it no element
  if (!multi_prices.value[index + 1]) {
    multi_prices.value.push({
      type_id: null,
      price,
    });
    refForm.value?.validate();
    return;
  }

  // if after it an element
  multi_prices.value[index + 1].price = price;
  refForm.value?.validate();
};

const resetValidation = (e) => {
  nextTick(() => {
    refForm.value?.validate();
  });
};
watch(duplicatePaymentType, () => resetValidation());

watch(totalPriceWithSale, (newVal) => {
  if (multi_prices.value.length === 1)
    multi_prices.value[0].price = transformPrice(newVal);
});
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 600"
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

      <VCardText class="px-0">
        <VForm ref="refForm" @submit.prevent="onConfirm">
          <VRow>
            <VCol cols="12">
              <h3 class="text-secondary">
                Фактическая Сумма :
                {{ transformPrice(props.paymentInvoice?.total_amount) }} so'm
              </h3>
            </VCol>

            <template v-for="(multi_price, index) in multi_prices">
              <VCol cols="5">
                <VSelect
                  v-model="multi_price.type_id"
                  label="Способ оплаты"
                  :items="payment_types_list"
                  item-title="name"
                  item-value="id"
                  :rules="[
                    () => !duplicatePaymentType || 'Дублирование типов оплаты',
                    (v) => !!v || 'Заполните поле',
                  ]"
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model="multi_price.price"
                  :ref="multi_price.ref"
                  @update:model-value="
                    multi_price.price = transformPrice(multi_price.price, true)
                  "
                  label="Введите сумму "
                  @focus="autoSelectInputValue"
                  :rules="[
                    () => !totalAmountEquality || '',
                    (v) => !!removeSpaces(v) || '',
                  ]"
                  @keydown.enter.prevent="calculateSecondPrice(index)"
                />
              </VCol>
              <VCol
                cols="1"
                class="d-flex justify-center pa-0 pt-5 cursor-pointer"
              >
                <VIcon
                  size="35"
                  icon="bx-x"
                  :color="multi_prices?.length > 1 ? 'error' : 'secondary'"
                  :class="{ 'disabled-opacity': !multi_prices?.length }"
                  @click="deleteMultiPrice(index)"
                />
              </VCol>
            </template>
            <VCol cols="12" class="py-0" v-if="totalAmountEquality">
              <p class="text-error mb-0">
                Общая сумма оплаты <b>{{ totalAmountEquality }}</b> суммы по
                выбранным методам оплаты. Проверьте суммы!
              </p>
            </VCol>
            <VCol
              cols="12"
              class="d-flex align-center pa-0 pr-1"
              v-if="!maxMultiPrice"
            >
              <VSpacer />

              <VIcon
                size="40"
                icon="mdi-chevron-down"
                color="success"
                @click="addMultiPrice"
              />
            </VCol>
            <VCol cols="12">
              <h3>Сдача: {{ calculate.sdacha }} so'm</h3>
              <h3>Доплата: {{ calculate.doljen }} so'm</h3>
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

            <VCol cols="12">
              <PhoneTextField label="Номер клиента" v-model="phone_number" />
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
    :salePrice="removeSpaces(sale_price).toString()"
    :paymentInvoice="props.paymentInvoice"
  />
</template>

<style lang="scss" scoped>
.disabled-opacity {
  opacity: 0.6;
}

.clickable-icon {
  cursor: pointer;
  color: var(--v-primary-base); /* Use primary theme color */
}
</style>
