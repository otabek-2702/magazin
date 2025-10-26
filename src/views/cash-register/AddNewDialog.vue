<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import { autoSelectInputValue, fetchOptions, transformPrice } from "@/helpers";
import ConfirmDialog from "./ConfirmDialog.vue";

const CONFIG = {
  promotion_type: 'none', // 'promotion1' - 3 товара = 1 бесплатно (100% скидка на каждый 3-й самый дешевый)
                          // 'promotion2' - 1+1 акция (50% скидка на каждый 2-й товар)
                          // 'promotion3' - вечерняя акция (30% скидка на все с 20:00 до 01:00)
                          // 'promotion4' - 2+2=2 акция (4 товара = 2 самых дешевых бесплатно, 8 = 4 бесплатно, и т.д.)
                          // 'none' - без акций
  min_promo_items: 2,
};

const emit = defineEmits(["fetchDatas"]);

const isDialogVisible = ref(false);
const isFetching = ref(false);
const isFetchingVariant = ref(false);
const refForm = ref();
const cashbox_id = ref();
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

const onSubmit = async () => {
  const { valid } = await refForm.value?.validate();
  if (!valid) return;

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
};

const handleDialogModelValueUpdate = (val) => {
  if (val) {
    // Multiple attempts to focus with increasing delays
    setTimeout(() => {
      nextTick(() => {
        sku_ref.value?.focus();
      });
    }, 300);
  }
  isDialogVisible.value = val;

  if (val === false) {
    product_variant_sku.value = null;
    product_variant_data.value = null;
    product_variants.value = [];
    payment_invoice.value = {};
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
      setSavedCashBoxId();
    });
  }
};

// Cash register
const cashboxes_list = ref([]);

const setSavedCashBoxId = () => {
  const savedCashBoxId = Number(localStorage.getItem("cashbox_id"));
  if (cashboxes_list.value.some((el) => el.id == savedCashBoxId)) {
    nextTick(() => {
      cashbox_id.value = savedCashBoxId;
    });
  }
};

onMounted(async () => {
  await fetchOptions("/cashboxes", cashboxes_list, "cashboxes");

  setSavedCashBoxId();
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
});
// Cash register end

// find Product
const findProductVariant = async (raw_sku) => {
  try {
    isFetchingVariant.value = true;
    const sku = raw_sku?.toString().replace(/ЫЛГ/g, "SKU");
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
        price: Number(product.sell_price),
        sell_price: Number(product.sell_price),
        sale: product.sale,
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

  reloadSales();
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
  reloadSales();
};

// Delete
const deleteListItem = (id) => {
  product_variants.value = product_variants.value.filter(
    (el) => el.product_variant_id != id
  );
  reloadSales();
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

  return transformPrice(
    product_variants.value.reduce(
      (accumulator, el) => accumulator + el.price * el.quantity ?? 0,
      0
    )
  );
});
const calculateTotalSale = computed(() => {
  if (!product_variants.value) return 0;

  return transformPrice(
    product_variants.value.reduce(
      (accumulator, el) =>
        accumulator + el.sale * (!el.no_own_sale ? el.quantity : 1) ?? 0,
      0
    )
  );
});

const calculateTotalPriceWithSale = computed(() => {
  if (!product_variants.value) return 0;

  return transformPrice(
    product_variants.value.reduce(
      (accumulator, el) =>
        accumulator +
          (el.price * el.quantity -
            el.sale * (!el.no_own_sale ? el.quantity : 1)) ?? 0,
      0
    )
  );
});

const sellers_list = ref([]);
// const promoted_products_list = ref([]);
const isFetchingSellers = ref(false);
onMounted(() => {
  //fetchOptions("product_variants/promotions", promoted_products_list, null);
  fetchOptions("persons", sellers_list, "persons");
});

// Skidka
const reloadSales = () => {
  let promotedProductsCount = 0;

  product_variants.value?.forEach((prod, index) => {
    if (prod.sale === 0 || prod.no_own_sale) {
      product_variants.value[index] = {
        ...prod,
        no_own_sale: true,
      };
      promotedProductsCount += prod.quantity;
    }
  });

  if (promotedProductsCount < CONFIG.min_promo_items) {
    product_variants.value.forEach((variant) => {
      if (variant.no_own_sale) {
        variant.sale = 0;
      }
    });
    return;
  }

  const prodCountForSale = Math.floor(promotedProductsCount / 2);

  product_variants.value.forEach((variant) => {
    if (variant.no_own_sale) {
      variant.sale = 0;
    }
  });

  const sortedVariants = [...product_variants.value].sort((a, b) => {
    if (a.sale > b.sale) {
      return -1;
    } else if (a.no_own_sale < b.no_own_sale) {
      return 1;
    } else {
      return a.price - b.price;
    }
  });

  const promoProducts = sortedVariants.filter(v => v.no_own_sale);
  const totalPromoCount = promoProducts.reduce((sum, v) => sum + v.quantity, 0);

  if (CONFIG.promotion_type === 'promotion1') {
    applyPromotion1(promoProducts, totalPromoCount);
  } else if (CONFIG.promotion_type === 'promotion2') {
    applyPromotion2(sortedVariants, prodCountForSale);
  } else if (CONFIG.promotion_type === 'promotion3') {
    applyPromotion3(sortedVariants);
  } else if (CONFIG.promotion_type === 'promotion4') {
    applyPromotion4(promoProducts, totalPromoCount);
  } else if (CONFIG.promotion_type === 'none') {
    // no promotion
  }

  product_variants.value = sortedVariants;
};

const applyPromotion1 = (promoProducts, totalPromoCount) => {
  if (totalPromoCount >= 3) {
    const freeCount = Math.floor(totalPromoCount / 3);
    const sortedByPrice = [...promoProducts].sort((a, b) => a.price - b.price);

    let remainingFree = freeCount;
    for (let variant of sortedByPrice) {
      if (remainingFree <= 0) break;

      const freeFromThis = Math.min(variant.quantity, remainingFree);
      variant.sale = freeFromThis * variant.price;
      remainingFree -= freeFromThis;
    }
  }
};

const applyPromotion2 = (sortedVariants, prodCountForSale) => {
  let remainingFreeProds = prodCountForSale;

  for (let variant of sortedVariants) {
    if (remainingFreeProds <= 0) break;
    if (!variant.no_own_sale) continue;

    const availableFreeProds = Math.min(variant.quantity, remainingFreeProds);
    variant.sale = availableFreeProds * (variant.price / 2);
    remainingFreeProds -= availableFreeProds;
  }
};

const applyPromotion3 = (sortedVariants) => {
  const now = new Date();
  const hour = now.getHours();
  if ((hour >= 20 && hour <= 23) || (hour >= 0 && hour <= 1)) {
    sortedVariants.forEach((variant) => {
      variant.sale = variant.price * variant.quantity * 0.3;
    });
  }
};

const applyPromotion4 = (promoProducts, totalPromoCount) => {
  if (totalPromoCount >= 4) {
    const freeCount = Math.floor(totalPromoCount / 4) * 2;
    const sortedByPrice = [...promoProducts].sort((a, b) => a.price - b.price);

    let remainingFree = freeCount;
    for (let variant of sortedByPrice) {
      if (remainingFree <= 0) break;

      const freeFromThis = Math.min(variant.quantity, remainingFree);
      variant.sale = freeFromThis * variant.price;
      remainingFree -= freeFromThis;
    }
  }
};
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
                    <th>КОЛ-ВО</th>
                    <th>ФАКТИЧЕСКАЯ СУММА</th>
                    <th>СКИДКА</th>
                    <th>СУММА</th>
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
                      <span class="font-weight-black text-h5">{{
                        variant.is_promoted ? "*" : ""
                      }}</span>
                    </td>
                    <td>{{ transformPrice(variant.price) }} so'm</td>
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
                    <td>
                      <b>
                        {{ transformPrice(variant.price * variant.quantity) }}
                        so'm
                      </b>
                    </td>
                    <td>
                      <b>
                        {{
                          transformPrice(
                            variant.sale *
                              (!variant.no_own_sale ? variant.quantity : 1)
                          )
                        }}
                        {{ Number(variant.sale) ? "so'm" : "" }}
                      </b>
                    </td>
                    <td>
                      <b
                        >{{
                          transformPrice(
                            variant.price * variant.quantity - variant.sale
                          )
                        }}
                        so'm</b
                      >
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
                      Общая к-во: <br />{{ Number(calculateCount) }}
                    </td>
                    <td class="text-body-1 pt-3">
                      Общая стоимость: <br />
                      <b>{{ calculateTotalPrice }} </b> SO'M
                    </td>
                    <td class="text-body-1 pt-3">
                      Общая скидка: <br />
                      <b>{{ calculateTotalSale }} </b> SO'M
                    </td>
                    <td class="text-body-1 pt-3">
                      Общая сумма: <br />
                      <b>{{ calculateTotalPriceWithSale }} </b> SO'M
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
                    СОЗДАТЬ
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
