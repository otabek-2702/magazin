<script setup>
import { computed, onMounted, ref, watch } from "vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { fetchOptions } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewDialog from "@/views/cash-register/AddNewDialog.vue";

// Initialize branches state
const branches_list = ref([]);

// Initialize useFetch hook with your configuration
const {
  items: invoices,
  currentPage,
  totalPages: totalPage,
  paginationData,
  fetchData,
  handleSearch,
  searchQuery,
  isFetching,
} = useFetch({
  baseUrl: "warehouse_movement_invoices",
  resourceKey: "warehouse_movement_invoices",
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

</script>

<template>
  <section>
    <VCard id="invoice-list">
      <VCardText class="d-flex align-center flex-wrap gap-4">
          <VSpacer />
  
          <div class="d-flex align-center flex-wrap gap-6">
  
            <AddNewDialog />
          </div>
        </VCardText>

      <VDivider />

      <!-- SECTION Table -->
      <VTable class="text-no-wrap">
        <!-- 👉 Table head -->
        <thead>
          <tr>
            <th style="width: 48px">ID</th>
          </tr>
        </thead>

        <!-- 👉 Table Body -->
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.id">
            <td>{{ invoice.id }}</td>
          </tr>
        </tbody>

        <Skeleton :count="8" v-show="isFetching && !invoices?.length" />

        <tfoot v-show="!isFetching && !invoices?.length">
          <tr>
            <td colspan="9" class="text-center text-body-1">
              Нет доступных данных
            </td>
          </tr>
        </tfoot>
      </VTable>
      <!-- !SECTION -->

      <VDivider />

      <!-- SECTION Pagination -->
      <VDivider />

      <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
        <div class="d-flex align-center" style="width: 300px">
          <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
        </div>

        <VPagination
          v-if="invoices.length"
          v-model="currentPage"
          :total-visible="7"
          :length="totalPage"
        />
      </VCardText>
      <!-- !SECTION -->
    </VCard>
  </section>
</template>

<style lang="scss"></style>
