<script setup>
import { computed, onMounted, ref, watch } from "vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { fetchOptions, formatTimestamp, transformPrice } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewOutputDrawer from "@/views/cash-register/cash-box/AddNewOutputDrawer.vue";

const route = useRoute();
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
  baseUrl: "cashbox_movements",
  params: { cashbox_id: route?.params?.id },
  resourceKey: "cashbox_movements",
  immediate: true,
  initialPage: 1,
  perPage: 30,
  debounceMs: 300,
});

// cash data
const cashbox_data = ref();

// Initialize component
onMounted(() => {
  fetchOptions(`/cashboxes/${route.params.id}`, cashbox_data, "cashbox");
  fetchData();
});

const resolveInvoiceStatus = (status) => {
  const roleMap = {
    Прибыль: { color: "success", prepend: "" },
    Убыток: { color: "error", prepend: "-" },
    Инкассация: { color: "error", prepend: "-" },
    
  };

  return roleMap[status] || { color: "primary" };
};

const invoicesListMeta = computed(() => [
  {
    icon: "mdi-cash-multiple",
    color: "primary",
    title: "Итоговая сумма в кассе",
    stats: transformPrice(cashbox_data.value?.remains),
  },
  {
    icon: "mdi-cash-plus",
    color: "success",
    title: "Доход",
    stats: transformPrice(0),
  },
  {
    icon: "mdi-cash-minus",
    color: "error",
    title: "Расход",
    stats: transformPrice(0),
  },
]);

const isAddNewOutputDrawerVisible = ref(false);
</script>

<template>
  <section>
    <VRow>
      <VCol
        v-for="meta in invoicesListMeta"
        :key="meta.title"
        cols="12"
        sm="6"
        lg="3"
      >
        <VCard>
          <VCardText class="d-flex justify-space-between">
            <div>
              <span>{{ meta.title }}</span>
              <div class="d-flex align-center gap-2">
                <h6 :class="`text-h6 text-${meta.color}`">
                  {{ meta.stats }} so'm
                </h6>
              </div>
              <span class="text-sm">{{ meta.subtitle }}</span>
            </div>

            <VAvatar
              rounded
              variant="tonal"
              :color="meta.color"
              :icon="meta.icon"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard id="invoice-list" >
          <VCardTitle class="d-flex align-center gap-4 py-6">
            <span>{{cashbox_data?.name}}</span>
            <VSpacer />
            <VBtn @click="isAddNewOutputDrawerVisible = true"
              >Добавить Расход
            </VBtn>
          </VCardTitle>

          <VDivider />

          <!-- SECTION Table -->
          <VTable>
            <!-- 👉 Table head -->
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ВРЕМЯ СОЗДАНИЯ</th>
                <th>ОБЩЕЕ КОЛИЧЕСТВО ТОВАРОВ</th>
                <th>ТИП ОПЛАТЫ</th>
                <th>КОММЕНТАРИЙ</th>
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
                    :color="resolveInvoiceStatus(invoice.type).color"
                    density="compact"
                    label
                    class="text-uppercase text-subtitle-1"
                  >
                    {{ resolveInvoiceStatus(invoice.type).prepend
                    }}{{ transformPrice(invoice.sum) }}
                  </VChip>
                </td>
                <td>{{ invoice.payment_type }}</td>
                <td>{{ invoice.comment }}</td>
              </tr>
            </tbody>

            <Skeleton :count="4" v-if="isFetching" />

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
      </VCol>
    </VRow>
    <AddNewOutputDrawer
      v-model:isDrawerOpen="isAddNewOutputDrawerVisible"
      @fetchDatas="() => fetchData(true)"
      :cashbox_id="parseInt(route?.params?.id)"
    />
  </section>
</template>

<style lang="scss"></style>
