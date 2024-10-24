<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import { autoSelectInputValue, fetchOptions, transformPrice } from "@/helpers";

const emit = defineEmits(["fetchDatas"]);

const isDialogVisible = ref(false);
const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const selectedCashR = ref();
const sku_ref = ref();
const product_variant_sku = ref();
const product_variant_data = ref();
const quantity_ref = ref();
const quantity = ref(1);
const product_variants = ref([]);

const onSubmit = () => {
  // refForm.value?.validate().then(async ({ valid }) => {
  //   if (valid) {
  //     isFetching.value = true;
  //     try {
  //       await axios.post("/warehouse_movement_invoices", {
  //         branch_id: to_branch_id.value ?? 0,
  //         items: product_variants.value,
  //       });
  //       emit("fetchDatas");
  //       toast("Успешно добавлено", {
  //         theme: "auto",
  //         type: "success",
  //         dangerouslyHTMLString: true,
  //       });
  //       handleDrawerModelValueUpdate(false);
  //     } catch (error) {
  //       console.error(error);
  //     } finally {
  //       isFetching.value = false;
  //     }
  //   }
  // });
};

const handleDrawerModelValueUpdate = (val) => {
  isDialogVisible.value = val;
  if (val === false) {
    to_branch_id.value = null;
    product_variant_sku.value = null;
    product_variant_data.value = null;
    quantity.value = 1;
    product_variants.value = [];
    refForm.value?.reset();
    refForm.value?.resetValidation();
  }
};

const product_variants_list = ref([]);
const branches_list = ref([]);

watch(
  isDialogVisible,
  () => {
    fetchOptions("/branches", branches_list, "branches");
  },
  { once: true }
);

// Cash register
const activeCashRLabel = computed(() => {
  return selectedCashR.value === 1
    ? "Касса №1"
    : selectedCashR.value === 1
    ? "Касса №2"
    : "";
});
onMounted(() => {
  const storageCashR = Number(localStorage.getItem("selectedCashRegister"));
  if (storageCashR) {
    selectedCashR.value = storageCashR;
  }
});
watch(selectedCashR, (newVal) => {
  if (newVal) {
    localStorage.setItem("selectedCashRegister", Number(newVal));
  }
});

// find Product
const findProductVariant = async (raw_sku) => {
  const sku = raw_sku.replace(/ылг/g, "sku");
  try {
    const response = await axios.get(`/showcases?search=${sku}`);

    if (response.status === 200 && response.data.showcase) {
      const {
        quantity,
        variant: { id, product, color, size, sku },
      } = response.data.showcase[0];
      product_variant_data.value = {
        product_variant_id: id,
        product_variant_name: `${product.name} | ${color.name} | ${size.name}`,
        quantity: Number(quantity),
        sku,
        sell_price: Number(product.sell_price),
      };
    }
  } catch (error) {
    console.log(error);
  }

  if (!product_variant_data.value) {
    toast("Товар не найден", {
      theme: "auto",
      type: "error",
      dangerouslyHTMLString: true,
    });
    return;
  }
  quantity_ref.value.focus();
  quantity.value = 1;
  product_variant_sku.value = null;
};

// Autofocus
watch(isDialogVisible, () => {
  if (isDialogVisible) sku_ref.value?.focus();
});

// Add
const addToList = () => {
  if (product_variant_data.value) {
    // find if object exists
    if (product_variant_data.value?.quantity <= 0) {
      toast("На витрине отсутствует этот товар.", {
        theme: "auto",
        type: "warning",
        dangerouslyHTMLString: true,
      });
      sku_ref.value.focus();
      return;
    }
    const existingObj = product_variants.value.find(
      (el) =>
        el.product_variant_id == product_variant_data.value.product_variant_id
    );
    let totalQuantity =
      Number(quantity.value ?? 0) + Number(existingObj?.quantity ?? 0);

    if (
      quantity.value > product_variant_data.value?.quantity ||
      totalQuantity > product_variant_data.value?.quantity
    ) {
      toast(
        "Доступное количество товаров на витрине не может быть превышено.",
        {
          theme: "auto",
          type: "warning",
          dangerouslyHTMLString: true,
        }
      );
      quantity_ref.value.focus();
      return;
    }

    if (existingObj) {
      product_variants.value = product_variants.value?.map((el) => {
        if (el.product_variant_id == existingObj.product_variant_id) {
          return {
            ...product_variant_data.value,
            quantity: Number(totalQuantity),
          };
        }
        return el;
      });
    } else {
      product_variants.value.push({
        ...product_variant_data.value,
        quantity: Number(quantity.value),
      });
    }
  } else {
    toast("Товар не найден", {
      theme: "auto",
      type: "error",
      dangerouslyHTMLString: true,
    });
  }

  // reset
  product_variant_data.value = null;
  quantity.value = 1;
  sku_ref.value.focus();
};

// Edit
const editingId = ref(null);

const showEditInput = (id) => {
  editingId.value = id;
};

const hideEditInput = async (variant) => {
  if (variant.quantity <= 0) {
    toast("Количество товара должно быть больше нуля.", {
      theme: "auto",
      type: "warning",
      dangerouslyHTMLString: true,
    });
    return;
  } else if (variant.quantity > variant.quantity) {
    toast(
      `Доступное количество товаров на витрине не может быть превышено, максимально допустимое значение (максимум: ${variant.quantity}).`,
      {
        theme: "auto",
        type: "warning",
        dangerouslyHTMLString: true,
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
  return product_variants.value.reduce(
    (accumulator, el) => accumulator + Number(el.quantity) ?? 0,
    0
  );
});
const calculateTotalPrice = computed(() => {
  if (!product_variants.value) return 0;
  let quantity = el => Number(el.quantity) == 0 ? 1 : Number(el.quantity);

  return transformPrice(
    product_variants.value.reduce(
      (accumulator, el) => accumulator + Number(el.sell_price) * quantity(el) ?? 0,
      0
    )
  );
});
</script>

<template>
  <VDialog fullscreen v-model="isDialogVisible">
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn @click="isDialogVisible = true" v-bind="props"
        >Продажа товаров</VBtn
      >
    </template>

    <!-- Dialog Content -->
    <VCard title="Продажа">
      <DialogCloseBtn
        variant="text"
        size="small"
        @click="isDialogVisible = false"
      />
      <VCardText>
        <VForm ref="refForm" v-model="isFormValid">
          <VRow>
            <VCol cols="3">
              <VSelect
                v-model="selectedCashR"
                label="Выберите кассу"
                clearable
                clear-icon="bx-x"
                :items="[
                  { title: 'Kassa №1', value: 1 },
                  { title: 'Kassa №2', value: 2 },
                ]"
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
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th style="width: 48px">ID</th>
                    <th>ТОВАР</th>
                    <th>СТОИМОСТЬ ОДНОГО ТОВАРА</th>
                    <th>ОБЩАЯ СТОИМОСТЬ</th>
                    <th>КОЛИЧЕСТВО</th>
                    <th>ДЕЙСТВИЯ</th>
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
                        class="custom-input"
                        density="compact"
                        type="number"
                        :rules="[]"
                      />
                    </td>
                    <td
                      class="text-center"
                      :style="{ width: '80px', zIndex: '10' }"
                    >
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
                        style="color: rgb(var(--v-global-theme-primary))"
                        class="mx-2"
                      />
                      <VIcon
                        size="30"
                        icon="mdi-minus-circle-outline"
                        style="color: red"
                        @click="deleteListItem(variant.product_variant_id)"
                      ></VIcon>
                    </td>
                  </tr>
                </tbody>

                <tfoot v-show="product_variants.length" >
                  <tr >
                    <td colspan="3"></td>
                    <td class="text-body-1 pt-3">
                      Общая стоимость: <br />
                      <b>{{ calculateTotalPrice }} </b> SO'M
                    </td>
                    <td class="text-body-1">
                      Общая количество: {{ calculateCount }}
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
              <VForm>
                <VRow>
                  <VCol cols="3" class="d-flex align-center">
                    <VTextField
                      v-model="product_variant_sku"
                      ref="sku_ref"
                      @input="
                        product_variant_sku = product_variant_sku.toUpperCase()
                      "
                      @keyup.enter="findProductVariant(product_variant_sku)"
                      label="Штрих код товара"
                      :items="product_variants_list"
                      item-title="name"
                      item-value="id"
                      :rules="[]"
                      autofocus
                    />
                  </VCol>

                  <VCol cols="5">
                    <h4 class="pt-1">
                      Товар: {{ product_variant_data?.product_variant_name }}
                    </h4>
                    <h4>Штрих-код: {{ product_variant_data?.sku }}</h4>
                    <p class="pt-2 mb-0">
                      Имеется в наличии:
                      <b>{{ product_variant_data?.quantity ?? 0 }} шт</b>
                    </p>
                  </VCol>
                  <VCol cols="1" class="d-flex align-center">
                    <h3 class="pt-1">
                      Стоимость:
                      {{ transformPrice(product_variant_data?.sell_price) }}
                    </h3>
                  </VCol>

                  <VCol cols="2" class="d-flex align-center">
                    <VTextField
                      v-model="quantity"
                      ref="quantity_ref"
                      @keyup.enter="addToList"
                      label="Количество"
                      type="number"
                      :rules="[]"
                      @focus="autoSelectInputValue"
                    />
                  </VCol>
                  <VCol cols="1" class="d-flex justify-center align-center">
                    <VBtn
                      @click="addToList"
                      style="
                        color: white !important;
                        background-color: #4caf50 !important;
                        border-radius: 5px !important;
                      "
                    >
                      <VIcon size="35" icon="bx-plus"></VIcon>
                    </VBtn>
                  </VCol>
                </VRow>
              </VForm>
            </VCol>
          </VRow>
          <VCardText class="d-flex justify-end gap-2 pt-2">
            <VBtn
              :loading="isFetching"
              :disabled="isFetching"
              type="button"
              @click="onSubmit"
            >
              Отправить
            </VBtn>
          </VCardText>
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
