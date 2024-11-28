<script setup>
import { computed, onMounted, ref, watch } from "vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { fetchOptions, formatTimestamp } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewDialog from "@/views/return/AddNewDialog.vue";
import InfoDialog from "@/views/return/InfoDialog.vue";

// Initialize useFetch hook with your configuration
const {
  state,
  items: invoices,
  totalPages: totalPage,
  paginationData,
  fetchData,
  handleSearch,
  searchQuery,
  isFetching,
} = useFetch({
  baseUrl: "refunds",
});

// Initialize component
onMounted(() => {
  fetchData();
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
    Черновик: { color: "primary" },
    Отклонено: { color: "secondary" },
    Подтверждено: { color: "success" },
  };

  return roleMap[status] || { color: "primary" };
};

</script>

<template>
  <section>
    <VCard>
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
            <th>КАССА</th>
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
          </tr>
        </tbody>

        <Skeleton :count="5" v-if="isFetching" />

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
