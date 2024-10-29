<script setup>
import { computed, onMounted, ref, watch } from "vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { fetchOptions } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewDialog from "@/views/cash-register/AddNewDialog.vue";
import InfoDialog from "@/views/cash-register/InfoDialog.vue";

// Initialize branches state
const branches_list = ref([]);

// Initialize useFetch hook with your configuration
const {
  state,
  items: invoices,
  currentPage,
  totalPages: totalPage,
  paginationData,
  fetchData,
  handleSearch,
  searchQuery,
  isFetching,
} = useFetch({
  baseUrl: "payment_invoices",
  resourceKey: "payment_invoices",
  immediate: true,
  initialPage: 1,
  perPage: 30,
  debounceMs: 300,
});

// Initialize component
onMounted(() => {
  fetchData();
  fetchOptions("branches", branches_list, "branches");
});

// Show one
const infoDialogItemId = ref(0);
const isInfoDialogVisible = ref(false);

const handleInfoDialogOpen = (id) => {
  console.log(id);
  infoDialogItemId.value = id;
  isInfoDialogVisible.value = true;
};

const resolveInvoiceStatus = (status) => {
  const roleMap = {
    "Не опачено": { color: "primary" },
    Отклонено: { color: "secondary" },
    Подтверждено: { color: "success" },
  };

  return roleMap[status] || { color: "primary" };
};

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
  <section>
    <VCard id="invoice-list">
      <VCardText class="d-flex align-center flex-wrap gap-4">
        <VSpacer />

        <div class="d-flex align-center flex-wrap gap-6">
          <AddNewDialog @fetchDatas="() => fetchData(true)" />
        </div>
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
            <th>Время Создания</th>
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
            <td>{{invoice.cashbox.name}}</td>
          </tr>
        </tbody>

        <Skeleton :count="3" v-if="isFetching" />

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
          :total-visible="7"
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
