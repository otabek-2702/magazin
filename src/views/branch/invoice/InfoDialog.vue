<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import { fetchOptions, transformPrice } from "@/helpers";
import Skeleton from "@/views/skeleton/Skeleton.vue";

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
const isFormValid = ref(false);
const refForm = ref();
const to_branch_id = ref();
const status = ref();
const sku_ref = ref();
const product_variant_sku = ref();
const product_variant_data = ref();
const quantity_ref = ref();
const quantity = ref();
const product_variants = ref([]);

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const response = await axios.get(`/stock_movement_invoices/${props.id}`);

    if (response.status === 200) {
      const {
        data: { stock_movement_invoice },
      } = response;

      to_branch_id.value = stock_movement_invoice.to_branch.id;
      status.value = stock_movement_invoice.status;
      product_variants.value = stock_movement_invoice.items;
    }
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    isFetchingStart.value = false;
  }
};

const onSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = "submit";
      try {
        await axios.put(`/stock_movement_invoices/${props.id}`, {
          to_branch_id: to_branch_id.value ?? 0,

          items: product_variants.value,
        });
        emit("fetchDatas");
        toast("Успешно", {
          theme: "auto",
          type: "success",
          dangerouslyHTMLString: true,
        });
        handleDialogModelValueUpdate(false);
      } catch (error) {
        console.error(error);
      } finally {
        isFetching.value = "";
      }
    }
  });
};

const onConfirm = async () => {
  isFetching.value = "confirm";
  try {
    const reponse = await axios.post(
      `/stock_movement_invoices/confirm/${props.id}`
    );
    if (reponse.status === 200) {
      toast("Успешно", {
        theme: "auto",
        type: "success",
        dangerouslyHTMLString: true,
      });
      emit("fetchDatas");

      handleDialogModelValueUpdate(false);
    }
  } catch (error) {
    console.log(error);
  } finally {
    isFetching.value = "";
  }
};

const onReject = async () => {
  isFetching.value = "reject";
  try {
    const reponse = await axios.post(
      `/stock_movement_invoices/reject/${props.id}`
    );
    if (reponse.status === 200) {
      toast("Успешно", {
        theme: "auto",
        type: "success",
        dangerouslyHTMLString: true,
      });
      emit("fetchDatas");

      handleDialogModelValueUpdate(false);
    }
  } catch (error) {
    console.log(error);
  } finally {
    isFetching.value = "";
  }
};

const onConfirmSubmit = async () => {
  await onSubmit()
  await onConfirm()
} 
const onRejectSubmit = async () => {
  await onSubmit()
  await onReject()
} 

const handleDialogModelValueUpdate = (val) => {
  emit("update:isDialogOpen", false);
  if (!val) {
    nextTick(() => {
      to_branch_id.value = null;
    product_variant_sku.value = null;
    product_variant_data.value = null;
    quantity.value = null;
    product_variants.value = [];
    refForm.value?.reset();
    refForm.value?.resetValidation();
    });
  }
};

const product_variants_list = ref([]);
const branches_list = ref([]);

watch(
  () => props.isDialogOpen,
  (newVal) => {
    if (newVal && props.id) {
      fetchDataById();
    }
  }
);

onMounted(() => {
  fetchOptions("/branches", branches_list, "branches");
});

// find Product
const findProductVariant = async (raw_sku) => {
  const sku = raw_sku.replace(/ылг/g, "sku");
  try {
    const response = await axios.get(`/stock?search=${sku}`);

    if (response.status === 200 && response.data.stock) {
      const { quantity, variant : {id, product, color, size, sku} } =
        response.data.stock[0];
      product_variant_data.value = {
        product_variant_id: id,
        product_variant_name: `${product.name} | ${color.name} | ${size.name}`,
        quantity,
        sku,
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
  quantity.value = product_variant_data.value.quantity ?? 0;
  product_variant_sku.value = null;
};

// Add
const addToList = () => {
  if (product_variant_data.value) {
    // find if object exists
    if (product_variant_data.value.quantity <= 0) {
      toast("На складе отсутствует этот товар.", {
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
    let totalQuantity = Number(quantity.value ?? 0) + Number(existingObj?.quantity ?? 0);

    if (
      quantity.value > product_variant_data.value?.quantity ||
      totalQuantity > product_variant_data.value?.quantity
    ) {
      toast("Доступное количество на складе не может быть превышено.", {
        theme: "auto",
        type: "warning",
        dangerouslyHTMLString: true,  
      });
      quantity_ref.value.focus();
      return;
    }

    if (existingObj) {
      product_variants.value = product_variants.value?.map((el) => {
        if (el.product_variant_id == existingObj.product_variant_id) {
          return {
            ...product_variant_data.value,
            quantity: totalQuantity,
          };
        }
        return el;
      });
    } else {
      product_variants.value.push({
        ...product_variant_data.value,
        quantity: quantity.value,
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
  quantity.value = null;
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
    }else  if (variant.quantity > variant.quantity) {
    toast(
      `Доступное количество на складе не может превышать максимально допустимое значение (максимум: ${variant.quantity}).`,
      {
        theme: "auto",
        type: "warning",
        dangerouslyHTMLString: true,
      }
    );
    return;
  }
  variant.quantity = Number(variant.quantity)
  editingId.value = null;
};


// Delete
const deleteListItem = (id) => {
  product_variants.value = product_variants.value.filter(
    (el) => el.product_variant_id != id
  );
};

const calculateCount = computed(() => {
  if(!product_variants.value) return 0
  return transformPrice(
    product_variants.value.reduce(
      (accumulator, el) => accumulator + Number(el.quantity) ?? 0,
      0
    )
  );
});
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
                v-model="to_branch_id"
                label="Выберите филиал"
                :items="branches_list"
                item-title="name"
                item-value="id"
                :readonly="status != 'Черновик'"
                :clearable="status == 'Черновик'"
              />
            </VCol>

            <VDivider />

            <VCol cols="12">
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th style="width: 48px">ID</th>
                    <th>ТОВАР</th>
                    <th>КОЛИЧЕСТВО</th>
                    <th v-if="status == 'Черновик'">ДЕЙСТВИЯ</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="(variant, i) in product_variants"
                    :key="variant.product_variant_id"
                  >
                    <td>{{ i + 1 }}</td>
                    <td>
                      {{ variant?.product_variant_name }}
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
                        :autofocus="editingId == variant.product_variant_id"
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
                        v-if="editingId === variant.product_variant_id"
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
                      Общее количество: {{ calculateCount }}
                    </td>
                    <td></td>
                    <td v-if="status == 'Черновик'"></td>
                  </tr>
                </tfoot>

                <Skeleton
                  :count="4"
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
                <VCol cols="3">
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
                  />
                </VCol>

                <VCol cols="5">
                  <h4 class="pt-1">Товар: {{ product_variant_data?.product_variant_name }}</h4>
                  <p class="pt-2 mb-0">
                    На складе:
                    <b>{{ product_variant_data?.quantity ?? 0 }}</b>
                  </p>
                </VCol>

                <VCol cols="3">
                  <VTextField
                    v-model="quantity"
                    ref="quantity_ref"
                    @keyup.enter="addToList"
                    label="Количество"
                    type="number"
                    :rules="[]"
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
          </VRow>
          <VCardText class="d-flex justify-end gap-2 pt-2">
            <VBtn
              v-if="status == 'Черновик'"
              :loading="isFetching == 'submit'"
              :disabled="isFetching == 'submit'"
              type="button"
              @click="onSubmit"
              class="me-3"
            >
              Сохранить изменения
            </VBtn>
            <VBtn
              :loading="isFetching == 'confirm'"
              :disabled="isFetching == 'confirm'"
              type="button"
              @click="onConfirmSubmit"
              color="success"
              v-if="status == 'Черновик'"
              class="me-3"
            >
              Подтвердить
              <VIcon end icon="bx-check-circle" />
            </VBtn>
            <VBtn
              :loading="isFetching == 'reject'"
              :disabled="isFetching == 'reject'"
              type="button"
              @click="onRejectSubmit"
              color="secondary"
              v-if="status == 'Черновик'"
            >
              Отменить
              <VIcon end icon="bx-minus-circle" />
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
}
</style>
