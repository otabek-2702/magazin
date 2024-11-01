<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import { autoSelectInputValue, fetchOptions, transformPrice } from "@/helpers";
import CheckDialog from "./CheckDialog.vue";
import ConfirmDialog from "./ConfirmDialog.vue";

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

const isConfirmDialogVisible = ref(false);

const isFetchingStart = ref(true);
const isFetching = ref("");
const isFetchingVariant = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const cashbox_id = ref();
const status = ref();
const sku_ref = ref();
const product_variant_sku = ref();
const product_variant_data = ref();
const product_variants = ref([]);
const check_id = ref();
const check_date = ref();

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const response = await axios.get(`/refunds/${props.id}`);
    if (response.status === 200) {
      const {
        data: { refund },
      } = response;
      console.log(refund.status);

      check_id.value = refund.id;
      status.value = refund.status;
      product_variants.value = refund.items;
      check_id.value = refund.id;
      check_date.value = formatTimestamp(refund.created_at);
    }
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    isFetchingStart.value = false;
  }
};

const onConfirm = async () => {
  isFetching.value = "confirm";
  try {
    const reponse = await axios.post(`/refunds/confirm/${props.id}`);
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
    const reponse = await axios.post(`/refunds/reject/${props.id}`);
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

const handleDialogModelValueUpdate = (val) => {
  emit("update:isDialogOpen", false);
  if (!val) {
    nextTick(() => {
      product_variant_sku.value = null;
      product_variant_data.value = null;
      product_variants.value = [];
      status.value = null;
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

const cashboxes_list = ref([]);

watch(
  () => props.isDialogOpen,
  (newVal) => {
    if (newVal && props.id) {
      fetchDataById();
    }
  }
);

// Autofocus
watch(()=>props.isDialogOpen, (newVal) => {
  if (newVal) sku_ref.value?.focus();
});

onMounted(() => {
  fetchOptions("/cashboxes", cashboxes_list, "cashboxes");
});

// Cash register
const activeCashRLabel = computed(() => {
  return (
    cashboxes_list.value?.find((el) => el.id == cashbox_id.value)?.name ?? ""
  );
});
onMounted(() => {
  const storageCashR = Number(localStorage.getItem("cashbox_id"));
  if (storageCashR) {
    cashbox_id.value = storageCashR;
  }
});
watch(cashbox_id, (newVal) => {
  if (newVal) {
    localStorage.setItem("cashbox_id", Number(newVal));
  }
});

// find Product


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
      dangerouslyHTMLString: true,
    });
    return;
  } else if (variant.quantity > variant.amount_remainder) {
    toast(
      `Доступное количество товаров на витрине не может быть превышено, максимально допустимое значение (максимум: ${variant.amount_remainder}).`,
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

const calculateCount = computed(() => {
  if (!product_variants.value) return 0;
  return transformPrice(
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
function formatTimestamp(isoString) {
  const date = new Date(isoString);

  // Format each part with leading zeros
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
</script>

<template>
  <VDialog fullscreen v-model="props.isDialogOpen">
    <VCard title="Продажа">
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
                clearable
                clear-icon="bx-x"
                :items="cashboxes_list"
                item-title="name"
                item-value="id"
              />
            </VCol>

            <VCol cols="6" class="d-flex align-center gap-6">
              <h2>
                Активный терминал:
                {{ activeCashRLabel }}
              </h2>
              <h2>
                Время Создания :
                {{ check_date }}
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
                    <!-- <th v-if="status == 'Черновик'">ДЕЙСТВИЯ</th> -->
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
                    <!-- <td
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
                    </td> -->
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
                      Общая количество: {{ calculateCount }}
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
          </VRow>
          <VCardText class="d-flex justify-end gap-4 pt-5">
            <VBtn
              :loading="isFetching == 'confirm'"
              :disabled="isFetching == 'confirm'"
              @click="onConfirm"
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
              type="button"
              @click="onReject"
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
    <CheckDialog
      v-if="product_variants.length"
      :items="product_variants"
      :total-price="calculateTotalPrice"
      :total-count="Number(calculateCount)"
      :cash-register="activeCashRLabel"
      :checkId="check_id"
    />

    <ConfirmDialog
      v-model:isDialogOpen="isConfirmDialogVisible"
      :total-price="calculateTotalPrice"
      :id="props.id"
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
