<script setup>
import { nextTick, onMounted, ref, watch, watchEffect } from "vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import { autoSelectInputValue, fetchOptions, transformPrice } from "@/helpers";
import ConfirmDialog from "./ConfirmDialog.vue";

const emit = defineEmits(["fetchDatas"]);

const isDialogVisible = ref(false);
const isFetching = ref(false);
const isFetchingVariant = ref(false);
const refForm = ref();
const cashbox_id = ref(localStorage.getItem("cashbox_id"));
const sku_ref = ref();
const product_variant_sku = ref();
const product_variant_data = ref();
const product_variants = ref([]);
const seller_id = ref();
const payment_invoice = ref({});

const onReject = async (id) => {
  try {
    axios.post(`/payment_invoices/reject/${id}`);
  } catch (error) {
    console.error(error);
  }
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      try {
        isFetching.value = true;
        const response = await axios.post("/payment_invoices", {
          cashbox_id: cashbox_id.value,
          items: product_variants.value,
          person_id: seller_id.value,
        });

        if (payment_invoice.value?.id) onReject(payment_invoice.value?.id);

        payment_invoice.value = response.data?.payment_invoice;
        emit("fetchDatas");
      } catch (error) {
        console.error(error);
      } finally {
        isFetching.value = false;
      }
    }
  });
};

const handleDialogModelValueUpdate = (val) => {
  isDialogVisible.value = val;
  payment_invoice.value = {};

  if (val === false) {
    product_variant_sku.value = null;
    product_variant_data.value = null;
    product_variants.value = [];
    refForm.value?.reset();
    refForm.value?.resetValidation();
    nextTick(() => {
      sku_ref.value?.focus();
      const storageCashboxId = Number(localStorage.getItem("cashbox_id"));
      if (storageCashboxId) {
        cashbox_id.value = storageCashboxId;
      }
    });
  }
};

// Cash register
const cashboxes_list = ref([]);

onMounted(() => {
  fetchOptions("/cashboxes", cashboxes_list, "cashboxes");
});

const activeCashRLabel = computed(() => {
  return (
    cashboxes_list.value.find((el) => el.id == cashbox_id.value)?.name ?? ""
  );
});
watch(cashbox_id, (newVal) => {
  if (newVal) {
    localStorage.setItem("cashbox_id", Number(newVal));
    return;
  }
  const storageCashboxId = Number(localStorage.getItem("cashbox_id"));
  if (storageCashboxId) {
    cashbox_id.value = storageCashboxId;
  }
});
// Cash register end

// find Product
const findProductVariant = async (raw_sku) => {
  try {
    isFetchingVariant.value = true;
    const sku = raw_sku.toString().replace(/ЫЛГ/g, "SKU");
    const response = await axios.get(`/showcases?search=${sku}`);

    if (response.status === 200 && response.data.showcase[0]) {
      const {
        quantity,
        variant: { id, product, color, size, sku },
      } = response.data?.showcase[0];
      product_variant_data.value = {
        product_variant_id: id,
        product_variant_name: `${product.name} | ${color.name} | ${size.name} (${sku})`,
        amount_remainder: Number(quantity),
        sku,
        sell_price: Number(product.sell_price),
      };
    }
  } catch (error) {
    console.error(error);
  } finally {
    isFetchingVariant.value = false;
  }

  if (!product_variant_data.value) {
    toast("Товар не найден", {
      theme: "auto",
      type: "error",
    });
    setTimeout(() => {
      product_variant_sku.value = null;
    }, 300);
    return;
  }
  addToList();
  product_variant_sku.value = null;
};

// Autofocus
watch(isDialogVisible, () => {
  if (isDialogVisible) nextTick(() => sku_ref.value?.focus());
});

// Add
const addToList = () => {
  // find if object exists
  if (product_variant_data.value?.amount_remainder <= 0) {
    toast("На витрине отсутствует этот товар.", {
      theme: "auto",
      type: "warning",
    });
    sku_ref.value?.focus();
    setTimeout(() => {
      product_variant_sku.value = null;
    }, 300);
    return;
  }
  const existingObj = product_variants.value.find(
    (el) =>
      el.product_variant_id == product_variant_data.value.product_variant_id
  );

  if (existingObj) {
    let totalQuantity = existingObj.quantity + 1;
    if (totalQuantity > existingObj.amount_remainder) {
      toast(
        `Доступное количество на витрине не может превышать максимально допустимое значение (максимум: ${existingObj.amount_remainder}).`,
        {
          theme: "auto",
          type: "warning",
        }
      );
      product_variant_sku.value = null;
      return;
    }
    product_variants.value = product_variants.value?.map((el) => {
      if (el.product_variant_id == existingObj.product_variant_id) {
        return {
          ...el,
          quantity: totalQuantity,
        };
      }
      return el;
    });
  } else {
    product_variants.value.push({
      ...product_variant_data.value,
      quantity: 1,
    });
  }

  // reset
  product_variant_data.value = null;
  sku_ref.value.focus();
};

// Edit
const editingId = ref(null);

const showEditInput = (id) => {
  editingId.value = id;
};

const hideEditInput = async (variant) => {
  if (variant?.quantity <= 0) {
    toast("Количество товара должно быть больше нуля.", {
      theme: "auto",
      type: "warning",
    });
    return;
  } else if (variant.quantity > variant.amount_remainder) {
    toast(
      `Доступное количество товаров на витрине не может быть превышено, максимально допустимое значение (максимум: ${variant.amount_remainder}).`,
      {
        theme: "auto",
        type: "warning",
      }
    );
    return;
  }
  variant.quantity = Number(variant.quantity);
  editingId.value = null;
};

// Delete
const deleteListItem = (id) => {
  product_variants.value = product_variants.value.filter(
    (el) => el.product_variant_id != id
  );
};

const calculateCount = computed(() => {
  if (!product_variants.value) return 0;
  return Number(
    product_variants.value.reduce(
      (accumulator, el) => accumulator + Number(el.quantity) ?? 0,
      0
    )
  );
});
const calculateTotalPrice = computed(() => {
  if (!product_variants.value) return 0;
  let quantity = (el) => (Number(el.quantity) == 0 ? 1 : Number(el.quantity));

  return transformPrice(
    product_variants.value.reduce(
      (accumulator, el) =>
        accumulator + Number(el.sell_price) * quantity(el) ?? 0,
      0
    )
  );
});

const sellers_list = ref([]);
const isFetchingSellers = ref(false);
onMounted(() => {
  fetchOptions("persons", sellers_list, "persons");
});
</script>

<template>
  <VDialog
    fullscreen
    v-model="isDialogVisible"
    @update:model-value="handleDialogModelValueUpdate"
  >
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn @click="handleDialogModelValueUpdate(true)" v-bind="props"
        >Продажа товаров</VBtn
      >
    </template>

    <!-- Dialog Content -->
    <VCard title="Продажа">
      <DialogCloseBtn
        variant="text"
        size="small"
        @click="handleDialogModelValueUpdate(false)"
      />
      <VCardText>
        <VForm ref="refForm">
          <VRow>
            <VCol cols="3">
              <VSelect
                v-model="cashbox_id"
                label="Выберите кассу"
                :items="cashboxes_list"
                item-title="name"
                item-value="id"
              />
            </VCol>

            <VCol cols="6" class="d-flex align-center">
              <h2>
                Активный терминал:
                {{ activeCashRLabel }}
              </h2>
            </VCol>

            <VCol cols="3">
              <VAutocomplete
                v-model="seller_id"
                label="Выберите продавца"
                variant="filled"
                :items="sellers_list"
                item-title="name"
                item-value="id"
                :loading="isFetchingSellers"
              />
            </VCol>

            <VDivider />

            <VCol cols="12">
              <VTable>
                <thead>
                  <tr>
                    <th data-column="id">ID</th>
                    <th>ТОВАР</th>
                    <th>ЦЕНА</th>
                    <th>СУММА</th>
                    <th>КОЛ-ВО</th>
                    <th data-column="actions">ДЕЙСТВИЯ</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="(variant, i) in product_variants"
                    :key="variant.product_variant_id"
                  >
                    <td>{{ i + 1 }}</td>
                    <td>
                      {{ variant.product_variant_name }}
                    </td>
                    <td>{{ transformPrice(variant.sell_price) }} so'm</td>
                    <td>
                      <b>
                        {{
                          transformPrice(variant.sell_price * variant.quantity)
                        }}
                        so'm
                      </b>
                    </td>
                    <td>
                      <VTextField
                        v-model="variant.quantity"
                        :readonly="editingId !== variant.product_variant_id"
                        :class="{
                          'text-input':
                            editingId !== variant.product_variant_id,
                        }"
                        @blur="hideEditInput(variant)"
                        @keyup.enter="hideEditInput(variant)"
                        @focus="autoSelectInputValue"
                        class="custom-input"
                        density="compact"
                        type="number"
                        :rules="[]"
                      />
                    </td>
                    <td data-column="actions">
                      <VIcon
                        v-if="editingId == variant.product_variant_id"
                        @click.stop="hideEditInput(variant)"
                        size="30"
                        icon="bx-check"
                        style="color: rgb(var(--v-theme-success))"
                        class="mx-2"
                      />
                      <VIcon
                        v-else
                        @click.stop="showEditInput(variant.product_variant_id)"
                        size="30"
                        icon="bx-edit-alt"
                        color="primary"
                        class="mx-2"
                      />
                      <VIcon
                        size="30"
                        icon="mdi-minus-circle-outline"
                        color="error"
                        @click="deleteListItem(variant.product_variant_id)"
                      ></VIcon>
                    </td>
                  </tr>
                </tbody>

                <tfoot v-show="product_variants.length">
                  <tr>
                    <td colspan="3"></td>
                    <td class="text-body-1 pt-3">
                      Общая стоимость: <br />
                      <b>{{ calculateTotalPrice }} </b> SO'M
                    </td>
                    <td class="text-body-1">
                      Общая количество: {{ Number(calculateCount) }}
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
                <tfoot v-show="!product_variants.length">
                  <tr>
                    <td colspan="9" class="text-center text-body-1">
                      Сканируйте штрих-код для добавления товара
                    </td>
                  </tr>
                </tfoot>
              </VTable>
            </VCol>

            <VDivider />

            <VCol cols="12">
              <VRow class="py-3">
                <VCol cols="3" class="d-flex align-center">
                  <VTextField
                    v-model="product_variant_sku"
                    ref="sku_ref"
                    @input="
                      product_variant_sku = product_variant_sku.toUpperCase()
                    "
                    @keyup.enter="findProductVariant(product_variant_sku)"
                    label="Штрих код товара"
                    item-title="name"
                    item-value="id"
                    :rules="[]"
                    autofocus
                  />
                </VCol>

                <VCol cols="1" class="d-flex align-center justify-center">
                  <VProgressCircular
                    color="primary"
                    v-if="isFetchingVariant"
                    indeterminate
                  ></VProgressCircular>
                </VCol>
                <VCardText class="d-flex justify-end gap-2 pt-2">
                  <VBtn
                    :loading="isFetching"
                    :disabled="isFetching"
                    type="button"
                    @click="onSubmit"
                  >
                    Оплатить
                  </VBtn>
                </VCardText>
              </VRow>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>

    <ConfirmDialog
      :payment-invoice="payment_invoice"
      @fetchDatas="
        () => {
          emit('fetchDatas');
          handleDialogModelValueUpdate(false);
        }
      "
    />
  </VDialog>
</template>

<style scoped>
.text-input {
  background-color: transparent !important;
}

.text-input :deep(.v-field__outline) {
  opacity: 0 !important;
}

/* .text-input :deep(.v-field__input) {
  padding-inline-start: 0 !important;
  padding-inline-end: 0 !important;
} */

.text-input :deep(.v-label) {
  opacity: 0 !important;
}

.custom-input {
  margin: 1px;
  width: 100%;
}

thead th {
  font-size: 16px;
  font-weight: 600 !important;
}
</style>
