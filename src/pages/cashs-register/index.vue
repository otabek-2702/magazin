<script setup>
import { ref, watch } from "vue";
import { Uzbek } from "flatpickr/dist/l10n/uz";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { formatTimestamp, getFormattedToday, transformPrice } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewDialog from "@/views/cash-register/AddNewDialog.vue";
import InfoDialog from "@/views/cash-register/InfoDialog.vue";
import AppDateTimePicker from "@/@core/components/AppDateTimePicker.vue";
import { requiredValidator } from "@/@core/utils/validators";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const { can } = useAppAbility();

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
    "Не оплачено": { color: "error" },
    Отклонено: { color: "warning" },
    Оплачено: { color: "success" },
  };

  return roleMap[status] || { color: "primary" };
};

const dateValue = ref(getFormattedToday());
const resetDate = () => {
  dateValue.value = getFormattedToday();
};

watch(dateValue, (newVal, oldValue) => {
  if (newVal === oldValue || !newVal) return;
  const [from, to, ...other] = newVal?.split(" — ");

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
            <Can I="create" a="Payment">
              <AddNewDialog @fetchDatas="() => fetchData(true)" />
            </Can>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- SECTION Table -->
      <VTable>
        <!-- 👉 Table head -->
        <thead>
          <tr>
            <th data-column="id">ID</th>
            <th>ВРЕМЯ СОЗДАНИЯ</th>
            <th>СТАТУС</th>
            <th>К-ВО ТОВАРОВ</th>
            <th>КАССА</th>
            <th>ТИП ОПЛАТЫ</th>
            <th>СУММА</th>
          </tr>
        </thead>

        <!-- 👉 Table Body -->
        <tbody>
          <tr
            v-for="invoice in invoices"
            :key="invoice.id"
            @click="handleInfoDialogOpen(invoice.id)"
            class="cursor-pointer"
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
                {{ invoice.status }}
              </VChip>
            </td>
            <td>{{ invoice.full_qty }}</td>
            <td>{{ invoice.cashbox.name }}</td>
            <td>{{ invoice.payment_type }}</td>
            <td>
              {{
                transformPrice(
                  Number(invoice.total_amount) -
                    Number(invoice.sale) -
                    Number(invoice.cashback_discount_price)
                )
              }}
            </td>
          </tr>
        </tbody>

        <Skeleton :count="7" v-if="isFetching" />

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
