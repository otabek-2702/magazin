<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import {
  autoSelectInputValue,
  fetchOptions,
  removeSpaces,
  transformPrice,
} from "@/helpers";
import Skeleton from "../skeleton/Skeleton.vue";

const props = defineProps({
  id: {
    required: true,
  },
  isDialogOpen: {
    type: Boolean,
    required: true,
  },
});
const emit = defineEmits(["update:isDialogOpen", "fetchDatas"]);

const isFetchingStart = ref(true);
const isFetching = ref("");
const isFetchingVariant = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const batches_id = ref();
const currency_id = ref();
const exchange_rate = ref();
const status = ref();
const product_variants_id = ref();
const quantity = ref(1);
const price = ref("");
const rate_symbol = ref();
const product_variants = ref([]);
const variant_search_input = ref("");
const product_variant_ref = ref();
const price_ref = ref();
const quantity_ref = ref();

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const response = await axios.get(`/invoices/${props.id}`);

    if (response.status === 200) {
      const {
        data: { invoice },
      } = response;
      batches_id.value = invoice.batch.id;
      currency_id.value = invoice.currency.id;
      exchange_rate.value = invoice.exchange_rate;

      status.value = invoice.status;
      product_variants.value = invoice.items;
    }
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    isFetchingStart.value = false;
  }
};
const onSubmit = async (reject_or_submit = false) => {
  const { valid } = await refForm.value?.validate();
  if (!valid) return false;

  isFetching.value = "submit";
  try {
    const response = await axios.put(`/invoices/${props.id}`, {
      batch_id: batches_id.value ?? 0,
      currency_id: currency_id.value,
      exchange_rate: exchange_rate.value,
      items: product_variants.value.map(el => ({
        product_variant_id: el.product_variant_id,
        price: removeSpaces(el.price),
        quantity: el.quantity
      })),
    });

    if (!reject_or_submit) {
      emit("fetchDatas");
      toast("Успешно", {
        theme: "auto",
        type: "success",
      });
      handleDialogModelValueUpdate(false);
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    isFetching.value = "";
  }
};

const onConfirm = async () => {
  isFetching.value = "confirm";
  try {
    const reponse = await axios.post(`/invoices/confirm/${props.id}`);
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
    const reponse = await axios.post(`/invoices/reject/${props.id}`);
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

const onConfirmSubmit = async () => {
  let isSubmitted = await onSubmit(true);
  if (isSubmitted === true) {
    await onConfirm();
  }
};

const onRejectSubmit = async () => {
  // let isSubmitted = await onSubmit(true);
  // if (isSubmitted === true) {
  await onReject();
  // }
};

const handleDialogModelValueUpdate = (val) => {
  emit("update:isDialogOpen", false);
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
      product_variants.value = [];
      product_variants_id.value = null;
      price.value = null;
      quantity.value = 1;
    });
  }
};

const fetchVariants = async () => {
  isFetchingVariant.value = true;
  try {
    const response = await axios.get("/product_variants", {
      params: {
        paginate: 100,
        search: variant_search_input.value?.slice(0, 5),
      },
    });

    if (response.status === 200) {
      if (product_variants_id.value?.length) {
        const newDatas = response.data.products_variants?.map((el) => ({
          product_variant_id: el.id,
          product_variant_name: `${el.product?.name} | ${el.color?.name} | ${el.size?.name} `,
        }));

        const oldData = product_variants_list.value.filter((e) =>
          product_variants_id.value.includes(e.product_variant_id)
        );
        product_variants_list.value = newDatas.concat(oldData);
      } else {
        product_variants_list.value = response.data.products_variants?.map(
          (el) => ({
            product_variant_id: el.id,
            product_variant_name: `${el.product?.name} | ${el.color?.name} | ${el.size?.name} `,
          })
        );
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    isFetchingVariant.value = false;
  }
};
const product_variants_list = ref([]);
const batches_list = ref([]);
const exchanges_list = ref([]);

// auto exchange_rate
watch(currency_id, (newVal) => {
  if (!exchange_rate)
    exchange_rate.value =
      exchanges_list.value.find((e) => e.id == newVal)?.rate ?? null;
});

watch(variant_search_input, (newVal) => {
  if (newVal?.length >= 2) {
    fetchVariants();
  }
});

onMounted(() => {
  fetchVariants();
  fetchOptions("/batches", batches_list, "batches");
  fetchOptions("/exchange_rates", exchanges_list, "exchange_rates");
});
watch(
  () => props.isDialogOpen,
  (newVal) => {
    if (newVal && props.id) {
      fetchDataById();
    }
  }
);

watch(currency_id, (newVal) => {
  if (newVal) {
    rate_symbol.value =
      exchanges_list.value?.find((el) => el.id == currency_id.value)?.symbol ??
      "";
  }
});

// format
const addToList = () => {
  if (product_variants_id.value?.length && price.value && quantity.value >= 0) {
    product_variants_id.value?.map((el) => {
      const productObj = product_variants_list.value.find(
        (e) => e.product_variant_id == el
      );

      // product exists
      const existingProductObj = product_variants.value.find(
        (e) => e.product_variant_id == el
      );
      if (existingProductObj) {
        product_variants.value = product_variants.value.map((elem) => {
          if (
            elem.product_variant_id == existingProductObj.product_variant_id
          ) {
            return {
              ...productObj,
              price: removeSpaces(price.value),
              quantity:
                Number(quantity.value) + Number(existingProductObj.quantity),
            };
          }
          return elem;
        });
        return;
      }

      product_variants.value.push({
        ...productObj,
        price: price.value,
        quantity: quantity.value,
      });
    });

    // reset
    product_variants_id.value = null;
    price.value = null;
    quantity.value = 1;
    product_variant_ref.value.focus();
  } else {
    toast("Заполните все поля формы", {
      theme: "auto",
      type: "error",
    });
  }
};

// Edit
const editingId = ref(null);

const showEditInput = (id) => {
  editingId.value = id;
};

const hideEditInput = (variant) => {
  variant.price = removeSpaces(variant.price);
  variant.quantity = Number(variant.quantity);
  editingId.value = null;
};

// Delete
const deleteListItem = (id) => {
  product_variants.value = product_variants.value.filter(
    (el) => el.product_variant_id != id
  );
};

const calculatePrice = computed(() => {
  return transformPrice(
    product_variants.value.reduce(
      (accumulator, el) =>
        accumulator + Number(el.quantity) * removeSpaces(el.price),
      0
    )
  );
});

const calculateCount = computed(() => {
  return transformPrice(
    product_variants.value.reduce(
      (accumulator, el) => accumulator + Number(el.quantity),
      0
    )
  );
});

const resolveInvoiceStatus = (status) => {
  const roleMap = {
    Черновик: { color: "primary" },
    Отклонено: { color: "secondary" },
    Подтверждено: { color: "success" },
  };

  return roleMap[status] || { color: "primary" };
};
</script>

<template>
  <VDialog
    fullscreen
    :model-value="props.isDialogOpen"
    @update:model-value="handleDialogModelValueUpdate"
  >
    <VCard :title="`Накладная #${props.id}`">
      <DialogCloseBtn
        variant="text"
        size="small"
        @click="handleDialogModelValueUpdate(false)"
      />
      <VCardText>
        <VForm ref="refForm" v-model="isFormValid">
          <VRow>
            <VCol cols="4">
              <VAutocomplete
                v-model="batches_id"
                label="Выберите партию"
                :items="batches_list"
                item-title="name"
                item-value="id"
                :readonly="status != 'Черновик'"
                :clearable="status == 'Черновик'"
              />
            </VCol>
            <VCol cols="2">
              <VSelect
                v-model="currency_id"
                label="Валюта"
                :items="exchanges_list"
                item-title="name"
                item-value="id"
                :readonly="status != 'Черновик'"
                :clearable="status == 'Черновик'"
              />
            </VCol>
            <VCol cols="3">
              <VTextField
                v-model="exchange_rate"
                :readonly="currency_id == 3 || status != 'Черновик'"
                :clearable="status == 'Черновик'"
                label="Курс"
                :prefix="rate_symbol"
                type="number"
              />
            </VCol>
            <VCol cols="3" class="d-flex align-center">
              <h3>
                Статус:
                <VChip
                  :color="resolveInvoiceStatus(status).color"
                  density="comfortable"
                  label
                  class="text-uppercase font-weight-bold text-body-1"
                  v-if="status"
                >
                  {{ status }}
                </VChip>
              </h3>
            </VCol>

            <VDivider />

            <VCol cols="12">
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th style="width: 48px">ID</th>
                    <th>ТОВАР</th>
                    <th>ЦЕНА</th>
                    <th>КОЛИЧЕСТВО</th>
                    <th v-if="status == 'Черновик'">ДЕЙСТВИЯ</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="(variant, i) in product_variants"
                    :key="variant.id"
                  >
                    <td>{{ i + 1 }}</td>
                    <td>
                      {{ variant.product_variant_name }}
                    </td>
                    <td>
                      <VTextField
                        v-model="variant.price"
                        :value="transformPrice(variant.price, true)"
                        :readonly="editingId !== variant.product_variant_id"
                        :class="{
                          'text-input':
                            editingId !== variant.product_variant_id,
                        }"
                        @keyup.enter="hideEditInput(variant)"
                        class="custom-input"
                        density="compact"
                        :prefix="rate_symbol"
                        :rules="[]"
                      />
                    </td>
                    <td>
                      <VTextField
                        v-model="variant.quantity"
                        :readonly="editingId !== variant.product_variant_id"
                        :class="{
                          'text-input':
                            editingId !== variant.product_variant_id,
                        }"
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
                      v-if="status == 'Черновик'"
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

                <tfoot v-show="product_variants.length">
                  <tr>
                    <td colspan="2"></td>
                    <td class="text-body-1">
                      Общая цена: {{ rate_symbol }}
                      {{ transformPrice(calculatePrice) }}
                    </td>
                    <td class="text-body-1">
                      Общее количество: {{ transformPrice(calculateCount) }}
                    </td>
                    <td></td>
                    <td v-if="status == 'Черновик'"></td>
                  </tr>
                </tfoot>

                <Skeleton
                  :count="5"
                  v-show="isFetchingStart && !product_variants.length"
                />

                <tfoot v-show="!isFetchingStart && !product_variants.length">
                  <tr>
                    <td colspan="9" class="text-center text-body-1">
                      Нет доступных данных
                    </td>
                  </tr>
                </tfoot>
              </VTable>
            </VCol>

            <VDivider />

            <VForm v-if="status == 'Черновик'" class="w-100 py-5">
              <VRow>
                <VCol cols="4">
                  <VAutocomplete
                    v-model="product_variants_id"
                    label="Выберите товар"
                    variant="filled"
                    :items="product_variants_list"
                    ref="product_variant_ref"
                    item-title="product_variant_name"
                    item-value="product_variant_id"
                    :rules="[]"
                    v-model:search="variant_search_input"
                    :loading="isFetchingVariant"
                    multiple
                  />
                </VCol>

                <VCol cols="4" class="d-flex align-center">
                  <VTextField
                    v-model="price"
                    :value="transformPrice(price, true)"
                    label="Цена"
                    :rules="[]"
                    ref="price_ref"
                    @keyup.enter="quantity_ref.focus()"
                  />
                </VCol>

                <VCol cols="3" class="d-flex align-center">
                  <VTextField
                    v-model="quantity"
                    label="Количество"
                    type="number"
                    :rules="[]"
                    ref="quantity_ref"
                    @keyup.enter="addToList"
                    @focus="autoSelectInputValue"
                  />
                </VCol>
                <VCol cols="1" class="d-flex justify-center align-center">
                  <VBtn
                    @click="addToList"
                    type="button"
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
          </VRow>
          <VCardText class="d-flex justify-end gap-2 pt-2">
            <VBtn
              v-if="status == 'Черновик'"
              :loading="isFetching == 'submit'"
              :disabled="isFetching == 'submit'"
              @click="onSubmit"
              type="button"
              class="me-3"
            >
              Сохранить изменения
            </VBtn>
            <VBtn
              :loading="isFetching == 'confirm'"
              :disabled="isFetching == 'confirm'"
              @click="onConfirmSubmit"
              color="success"
              v-if="status == 'Черновик'"
              class="me-3"
              type="button"
            >
              Подтвердить
              <VIcon end icon="bx-check-circle" />
            </VBtn>
            <VBtn
              :loading="isFetching == 'reject'"
              :disabled="isFetching == 'reject'"
              @click="onRejectSubmit"
              color="secondary"
              v-if="status == 'Черновик'"
              type="button"
            >
              Отменить <VIcon end icon="bx-minus-circle" />
            </VBtn>
          </VCardText>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.bg-green {
  background-color: green;
}

.text-input :deep(.v-field__outline) {
  opacity: 0 !important;
}

.text-input :deep(.v-label) {
  opacity: 0 !important;
}

.custom-input {
  margin: 1px;
  width: 100%;
}
</style>
