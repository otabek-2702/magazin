<script setup>
import {  onMounted, ref, watch } from "vue";
import { Uzbek } from "flatpickr/dist/l10n/uz";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import {  formatTimestamp, getFormattedToday } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewDialog from "@/views/cash-register/AddNewDialog.vue";
import InfoDialog from "@/views/cash-register/InfoDialog.vue";
import AppDateTimePicker from "@/@core/components/AppDateTimePicker.vue";
import { requiredValidator } from "@/@core/utils/validators";

const {
  state,
  items: invoices,
  totalPages: totalPage,
  paginationData,
  fetchData,
  isFetching,
} = useFetch({
  baseUrl: "payment_invoices",
  params: {
    from_date: getFormattedToday(),
    to_date: getFormattedToday(),
  },
});

// Show one
const infoDialogItemId = ref(0);
const isInfoDialogVisible = ref(false);

const handleInfoDialogOpen = (id) => {
  infoDialogItemId.value = id;
  isInfoDialogVisible.value = true;
};

const resolveInvoiceStatus = (status) => {
  const roleMap = {
    "Не опачено": { color: "error" },
    Отклонено: { color: "warning" },
    Оплачено: { color: "success" },
  };

  return roleMap[status] || { color: "primary" };
};

const dateValue = ref();
const resetDate = () => {
  dateValue.value = getFormattedToday();
};
onMounted(() => {
  resetDate();
});

watch(dateValue, (newVal) => {
  const [from, to, ...other] = newVal.split(" — ");

  state.value.params = {
    ...state.value.params,
    from_date: from,
    to_date: to || from,
  };
});
</script>

<template>
  <section>
    <VCard>
      <VCardText>
        <VRow>
          <VCol cols="12" sm="3">
            <AppDateTimePicker
              v-model="dateValue"
              :config="{ mode: 'range', locale: Uzbek }"
              placeholder="Выберите диапазон дат"
              :rules="[requiredValidator]"
              clearable
              @click:clear="resetDate"
              density="compact"
            />
          </VCol>
          <VSpacer />

          <VCol cols="auto">
            <AddNewDialog @fetchDatas="() => fetchData(true)" />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- SECTION Table -->
      <VTable>
        <!-- 👉 Table head -->
        <thead>
          <tr>
            <th style="width: 48px">ID</th>
            <th>ВРЕМЯ СОЗДАНИЯ</th>
            <th>СТАТУС</th>
            <th>ОБЩЕЕ КОЛИЧЕСТВО ТОВАРОВ</th>
            <th>КАССА</th>
            <th>ТИП ОПЛАТЫ</th>
          </tr>
        </thead>

        <!-- 👉 Table Body -->
        <tbody v-if="invoices?.length && !isFetching">
          <tr
            v-for="invoice in invoices"
            :key="invoice.id"
            @click="handleInfoDialogOpen(invoice.id)"
            style="cursor: pointer"
          >
            <td>{{ invoice.id }}</td>
            <td>{{ formatTimestamp(invoice?.created_at) }}</td>
            <td>
              <VChip
                :color="resolveInvoiceStatus(invoice.status).color"
                density="compact"
                label
                class="text-uppercase"
              >
                {{
                  invoice.status == "Не опачено"
                    ? "Не оплачено"
                    : invoice.status
                }}
              </VChip>
            </td>
            <td>{{ invoice.full_qty }}</td>
            <td>{{ invoice.cashbox.name }}</td>
            <td>{{ invoice.payment_type }}</td>
          </tr>
        </tbody>

        <Skeleton :count="6" v-if="isFetching" />

        <tfoot v-show="!isFetching && !invoices?.length">
          <tr>
            <td colspan="9" class="text-center text-body-1">
              Нет доступных данных
            </td>
          </tr>
        </tfoot>
      </VTable>

      <!-- SECTION Pagination -->
      <VDivider />

      <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
        <div class="d-flex align-center" style="width: 300px">
          <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
        </div>

        <VPagination
          v-if="invoices.length"
          v-model="state.currentPage"
          
          :length="totalPage"
        />
      </VCardText>
    </VCard>
    <InfoDialog
      v-model:isDialogOpen="isInfoDialogVisible"
      :id="infoDialogItemId"
      @fetchDatas="() => fetchData(true)"
    />
  </section>
</template>

<style lang="scss"></style>
