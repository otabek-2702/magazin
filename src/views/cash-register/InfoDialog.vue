<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import {
  autoSelectInputValue,
  fetchOptions,
  formatTimestamp,
  removeSpaces,
  transformPrice,
} from "@/helpers";
import Skeleton from "@/views/skeleton/Skeleton.vue";
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
const isFormValid = ref(false);
const refForm = ref();
const cashbox_id = ref();
const status = ref();
const product_variant_sku = ref();
const product_variant_data = ref();
const product_variants = ref([]);
const check_id = ref();
const check_date = ref();
const sale_price = ref();

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const response = await axios.get(`/payment_invoices/${props.id}`);
    if (response.status === 200) {
      const {
        data: { payment_invoice },
      } = response;

      check_id.value = payment_invoice.id;
      status.value = payment_invoice.status;
      product_variants.value = payment_invoice.items;
      check_id.value = payment_invoice.id;
      check_date.value = formatTimestamp(payment_invoice.created_at);
      cashbox_id.value = payment_invoice.cashbox.id;
      sale_price.value = parseInt(payment_invoice.sale)
    }
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    isFetchingStart.value = false;
  }
};

const onConfirm = async () => {
  isConfirmDialogVisible.value = true;
};

const onReject = async () => {
  isFetching.value = "reject";
  try {
    const reponse = await axios.post(`/payment_invoices/reject/${props.id}`);
    if (reponse.status === 200) {
      toast("Успешно", {
        theme: "auto",
        type: "success",
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

onMounted(() => {
  fetchOptions("/cashboxes", cashboxes_list, "cashboxes");
});

// Cash register
const activeCashRLabel = computed(() => {
  return (
    cashboxes_list.value?.find((el) => el.id == cashbox_id.value)?.name ?? ""
  );
});

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

const calculateTotalPriceWithSale = computed(() => removeSpaces(calculateTotalPrice.value) - removeSpaces(sale_price.value));
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
                :items="cashboxes_list"
                item-title="name"
                item-value="id"
                :readonly="status !== 'Не опачено'"
                :clearable="status == 'Не опачено'"
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
                  </tr>
                </tbody>

                <tfoot v-show="product_variants.length">
                  <tr>
                    <td colspan="3"></td>
                    <td class="text-body-1 pt-3">
                      Общая стоимость: <br />
                      <b v-if="sale_price">{{ calculateTotalPrice }} - {{ sale_price }} = {{ calculateTotalPriceWithSale }}</b>
                      <b v-else>{{ calculateTotalPrice }} </b> SO'M
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
          <VCardText class="d-flex justify-end align-center gap-4 pt-8">
            <VBtn
              :loading="isFetching == 'submit'"
              :disabled="isFetching == 'submit'"
              type="button"
              @click="onConfirm"
              v-if="status == 'Не опачено'"
            >
              Оплатить
            </VBtn>
            <VBtn
              :loading="isFetching == 'reject'"
              :disabled="isFetching == 'reject'"
              type="button"
              @click="onReject"
              color="secondary"
              v-if="status == 'Не опачено'"
            >
              Отменить
              <VIcon end icon="bx-minus-circle" />
            </VBtn>
            <template v-if="status && status !== 'Не опачено'">
              <h2>Этот чек уже оплачен!</h2>

              <VBtn
                color="info"
                v-print="{
                  id: 'receipt-content',
                }"
              >
                <VIcon size="20" icon="mdi-printer" class="me-2" />
                Печать чека
              </VBtn>
            </template>
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
      :sale_price="sale_price"
    />

    <ConfirmDialog
      v-model:isDialogOpen="isConfirmDialogVisible"
      :total-price="calculateTotalPrice"
      :id="props.id"
      :status="status"
      @fetchDatas="
        () => {
          emit('fetchDatas');
          handleDialogModelValueUpdate(false);
        }
      "
      v-model:sale_price="sale_price"
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
