<script setup>
import { nextTick, onMounted, ref, watch, watchEffect } from "vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import {
  autoSelectInputValue,
  fetchOptions,
  removeSpaces,
  transformPrice,
} from "@/helpers";

const emit = defineEmits(["fetchDatas"]);

const isDialogVisible = ref(false);
const isFetching = ref("");
const isFetchingVariant = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const cashbox_id = ref(localStorage.getItem("cashbox_id"));
const sku_ref = ref();
const product_variant_sku = ref();
const product_variant_data = ref();
const price = ref();
const price_ref = ref();
const product_variants = ref([]);
const return_id = ref();
const status = ref();

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = "submit";
      try {
        const response = await axios.post("/refunds", {
          cashbox_id: cashbox_id.value,
          items: product_variants.value,
        });
        emit("fetchDatas");
        toast("Успешно", {
          theme: "auto",
          type: "success",
        });
        return_id.value = response.data.refund.id;
        status.value = "Черновик";
      } catch (error) {
        console.error(error);
      } finally {
        isFetching.value = "";
      }
    }
  });
};

const handleDialogModelValueUpdate = (val) => {
  isDialogVisible.value = val;
  if (val === false) {
    product_variant_sku.value = null;
    product_variant_data.value = null;
    product_variants.value = [];
    refForm.value?.reset();
    refForm.value?.resetValidation();
    nextTick(() => {
      const storageCashboxId = Number(localStorage.getItem("cashbox_id"));
      if (storageCashboxId) {
        cashbox_id.value = storageCashboxId;
      }
    });
  } else {
    nextTick(() => {
      sku_ref.value?.focus();
    });
  }
};

const cashboxes_list = ref([]);

onMounted(() => {
  fetchOptions("/cashboxes", cashboxes_list, "cashboxes");
});

// Cash register
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

// find Product
const findProductVariant = async (raw_sku) => {
  try {
    isFetchingVariant.value = true;
    const sku = raw_sku.toString().replace(/ЫЛГ/g, "SKU");
    const response = await axios.get(`/showcases?search=${sku}`);

    if (response.status === 200 && response.data.showcase[0]) {
      const {
        variant: { id, product, color, size, sku },
      } = response.data?.showcase[0];
      product_variant_data.value = {
        product_variant_id: id,
        product_variant_name: `${product.name} | ${color.name} | ${size.name}`,
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
      type: "error",
    });
    setTimeout(() => {
      product_variant_sku.value = null;
    }, 300);
    return;
  }
  price.value = product_variant_data.value.sell_price;
  price_ref.value?.focus();
  product_variant_sku.value = null;
};

// Autofocus
watch(isDialogVisible, () => {
  if (isDialogVisible) sku_ref.value?.focus();
});

// Add
const addToList = () => {
  // find if object exists
  const existingObj = product_variants.value.find(
    (el) =>
      el.product_variant_id == product_variant_data.value.product_variant_id
  );

  if (existingObj) {
    product_variants.value = product_variants.value?.map((el) => {
      if (el.product_variant_id == existingObj.product_variant_id) {
        return {
          ...el,
          price: removeSpaces(price.value),
          quantity: existingObj.quantity + 1,
        };
      }
      return el;
    });
  } else {
    product_variants.value.push({
      ...product_variant_data.value,
      price: removeSpaces(price.value),
      quantity: 1,
    });
  }

  // reset
  product_variant_data.value = null;
  price.value = null;
  sku_ref.value.focus();
};

// // Edit
// const editingId = ref(null);

// const showEditInput = (id) => {
//   editingId.value = id;
// };

// const hideEditInput = async (variant) => {
//   if (variant?.quantity <= 0) {
//     toast("Количество товара должно быть больше нуля.", {
//       theme: "auto",
//       type: "warning",
//
//     });
//     return;
//   } else if (variant.quantity > variant.amount_remainder) {
//     toast(
//       `Доступное количество товаров на витрине не может быть превышено, максимально допустимое значение (максимум: ${variant.amount_remainder}).`,
//       {
//         theme: "auto",
//         type: "warning",
//
//       }
//     );
//     return;
//   }
//   variant.quantity = Number(variant.quantity);
//   editingId.value = null;
// };

// // Delete
// const deleteListItem = (id) => {
//   product_variants.value = product_variants.value.filter(
//     (el) => el.product_variant_id != id
//   );
// };

const onConfirm = async () => {
  isFetching.value = "confirm";
  try {
    const reponse = await axios.post(`/refunds/confirm/${return_id.value}`);
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
    isFetching.value = "";
  }
};

const onReject = async () => {
  isFetching.value = "reject";
  try {
    const reponse = await axios.post(`/refunds/reject/${return_id.value}`);
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
    isFetching.value = "";
  }
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
      (accumulator, el) => accumulator + Number(el.price) * quantity(el) ?? 0,
      0
    )
  );
});
</script>

<template>
  <VDialog fullscreen v-model="isDialogVisible">
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn @click="handleDialogModelValueUpdate(true)" v-bind="props"
        >Возврат Товаров
      </VBtn>
    </template>

    <!-- Title -->
    <VCard title="Возврат">
      <DialogCloseBtn
        variant="text"
        size="small"
        @click="handleDialogModelValueUpdate(false)"
      />
      <VCardText>
        <VForm ref="refForm" v-model="isFormValid">
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

            <VDivider />

            <VCol cols="12">
              <VTable>
                <thead>
                  <tr>
                    <th data-column="id">ID</th>
                    <th>ТОВАР</th>
                    <th>СТОИМОСТЬ ОДНОГО ТОВАРА</th>
                    <th>ОБЩАЯ СТОИМОСТЬ</th>
                    <th>КОЛИЧЕСТВО</th>
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
                    <td>{{ transformPrice(variant.price) }} so'm</td>
                    <td>
                      <b>
                        {{ transformPrice(variant.price * variant.quantity) }}
                        so'm
                      </b>
                    </td>
                    <td>
                      {{ variant.quantity }}
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
              <VRow>
                <VCol cols="4" class="d-flex align-center gap-4">
                  <VTextField
                    v-model="product_variant_sku"
                    ref="sku_ref"
                    @input="
                      product_variant_sku = product_variant_sku.toUpperCase()
                    "
                    @keyup.enter="findProductVariant(product_variant_sku)"
                    label="Штрих код товара"
                    :rules="[]"
                    autofocus
                  />
                  <VTextField
                    v-model="price"
                    ref="price_ref"
                    @focus="autoSelectInputValue"
                    :value="transformPrice(price, true)"
                    @keyup.enter="addToList"
                    label="Цена"
                    :rules="[]"
                  />
                </VCol>
                <VCol cols="4">
                  <h4 class="pt-1">
                    Товар: {{ product_variant_data?.product_variant_name }}
                  </h4>
                  <p class="pt-2 mb-0">
                    Цена:
                    <b
                      >{{
                        transformPrice(product_variant_data?.sell_price)
                      }}
                      so'm</b
                    >
                  </p>
                </VCol>
                <VCol cols="1" class="d-flex align-center justify-center">
                  <VProgressCircular
                    color="primary"
                    v-if="isFetchingVariant"
                    indeterminate
                  ></VProgressCircular>
                </VCol>
                <VSpacer />

                <VCol cols="2" class="d-flex justify-end gap-2 align-center">
                  <VBtn
                    :loading="isFetching === 'submit'"
                    :disabled="isFetching === 'submit'"
                    type="button"
                    @click="onSubmit"
                    v-if="!status"
                  >
                    Принять
                  </VBtn>
                  <VBtn
                    :loading="isFetching === 'confirm'"
                    :disabled="isFetching === 'confirm'"
                    @click="onConfirm"
                    color="success"
                    v-if="status === 'Черновик'"
                    class="me-3"
                    type="button"
                  >
                    Подтвердить
                    <VIcon end icon="bx-check-circle" />
                  </VBtn>
                  <VBtn
                    :loading="isFetching === 'reject'"
                    :disabled="isFetching === 'reject'"
                    type="button"
                    @click="onReject"
                    color="secondary"
                    v-if="status === 'Черновик'"
                  >
                    Отменить
                    <VIcon end icon="bx-minus-circle" />
                  </VBtn>
                </VCol>
              </VRow>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
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
