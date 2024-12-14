<script setup>
import { computed, nextTick, ref, watch } from "vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import { formatTimestamp, removeSpaces, transformPrice } from "@/helpers";
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

const isFetchingStart = ref(true);
const isFetching = ref("");
const refForm = ref();
const payment_invoice = ref({});
const invoice_status = computed(() => ({
  draft: payment_invoice.value?.status === "Не опачено",
  confirmed: payment_invoice.value?.status === "Оплачено",
  rejected: payment_invoice.value?.status === "Отклонено",
}));

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const response = await axios.get(`/payment_invoices/${props.id}`);
    if (response.status === 200) {
      const { data } = response;

      payment_invoice.value = data.payment_invoice;
    }
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    isFetchingStart.value = false;
  }
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
    console.error(error);
  } finally {
    isFetching.value = "";
  }
};

const handleDialogModelValueUpdate = (val) => {
  emit("update:isDialogOpen", false);
  if (!val) {
    nextTick(() => {
      payment_invoice.value = {};
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

watch(
  () => props.isDialogOpen,
  (newVal) => {
    if (newVal && props.id) {
      fetchDataById();
    }
  }
);


const calculateTotalPriceWithSale = computed(() =>
  transformPrice(
    payment_invoice.value.total_amount -
      removeSpaces(payment_invoice.value.sale)
  )
);
</script>

<template>
  <VDialog
    fullscreen
    :model-value="props.isDialogOpen"
    @update:model-value="handleDialogModelValueUpdate"
  >
    <VCard title="Продажа">
      <DialogCloseBtn
        variant="text"
        size="small"
        @click="handleDialogModelValueUpdate(false)"
      />
      <VCardText v-show="!isFetchingStart">
        <VForm ref="refForm">
          <VRow>
            <VCol cols="3">
              <VSelect
                label="Выберите кассу"
                :model-value="payment_invoice?.cashbox?.name"
                :readonly="true"
                :clearable="false"
              />
            </VCol>

            <VCol cols="6" class="d-flex align-center gap-6">
              <h2>
                Время Создания :
                {{ formatTimestamp(payment_invoice?.created_at) }}
              </h2>
            </VCol>

            <VCol cols="3">
              <VAutocomplete
                :model-value="payment_invoice?.person?.name"
                label="Выберите продавца"
                variant="filled"
                readonly
                :clearable="false"
              />
            </VCol>

            <VDivider />

            <VCol cols="12">
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th style="width: 48px">ID</th>
                    <th>ТОВАР</th>
                    <th>ЦЕНА</th>
                    <th>КОЛ-ВО</th>
                    <th>СКИДКА</th>
                    <th>СУММА</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="(variant, i) in payment_invoice?.items"
                    :key="variant.product_variant_id"
                  >
                    <td>{{ i + 1 }}</td>
                    <td>{{ variant.product_variant_name }} ({{ variant.product_variant_sku }})</td>
                    <td>{{ transformPrice(variant.original_price) }} so'm</td>
                    <td>{{ variant.quantity }}</td>
                    <td>{{ transformPrice(variant.sale, true) }}</td>
                    <td>
                      <b> {{ transformPrice(variant.sell_price) }} so'm </b>
                    </td>
                  </tr>
                </tbody>

                <tfoot v-show="payment_invoice?.items?.length">
                  <tr>
                    <td colspan="4"></td>
                    <td class="text-body-1">
                      Общая количество: {{ payment_invoice?.total_count }}
                    </td>
                    <td class="text-body-1 pt-3">
                      Общая стоимость: <br />
                      <b v-if="transformPrice(payment_invoice?.sale, true)"
                        >{{ transformPrice(payment_invoice?.total_amount) }}
                        <span class="text-h5 font-weight-black">-</span>
                        {{ transformPrice(payment_invoice?.sale, true) }} =
                        {{ calculateTotalPriceWithSale }}</b
                      >
                      <b v-else
                        >{{ transformPrice(payment_invoice?.total_amount) }}
                      </b>
                      SO'M
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </VTable>
            </VCol>

            <VDivider />
          </VRow>
          <VCardText class="d-flex justify-end align-center gap-4 pt-8">
            <ConfirmDialog
              :payment-invoice="payment_invoice"
              @fetchDatas="
                () => {
                  emit('fetchDatas');
                  handleDialogModelValueUpdate(false);
                }
              "
            />
            <VBtn
              :loading="isFetching == 'reject'"
              :disabled="isFetching == 'reject'"
              type="button"
              @click="onReject"
              color="secondary"
              v-if="invoice_status.draft"
            >
              Отменить
              <VIcon end icon="bx-minus-circle" />
            </VBtn>

            <!-- Confirmed | Rejected -->
            <template v-if="invoice_status.confirmed">
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
            <h2 v-else-if="invoice_status.rejected">
              Этот чек отменён. Операция не завершена.
            </h2>
          </VCardText>
        </VForm>
      </VCardText>

      <!-- Loader -->
      <div
        v-if="isFetchingStart"
        class="d-flex h-screen align-center justify-center"
      >
        <VProgressCircular color="primary" indeterminate></VProgressCircular>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped>
thead th {
  font-size: 16px;
  font-weight: 600 !important;
}
</style>
