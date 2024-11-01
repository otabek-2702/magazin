<script setup>
import { computed, onMounted, ref, watch } from "vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { fetchOptions, formatTimestamp, transformPrice } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewDialog from "@/views/cash-register/AddNewDialog.vue";
import InfoDialog from "@/views/cash-register/InfoDialog.vue";

const route = useRoute();
console.log(route);
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
    Убыток: { color: "error", prepend: "-" },
    Прибыль: { color: "success", prepend: "" },
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
    stats: transformPrice(
      invoices.value?.reduce((acc, el) => {
        if (el.type === "Прибыль") {
          return acc + Number(el.sum);
        }
        return acc;
      }, 0)
    ),
  },
  {
    icon: "mdi-cash-minus",
    color: "error",
    title: "Расход",
    stats: transformPrice(
      invoices.value?.reduce((acc, el) => {
        if (el.type === "Убыток") {
          return acc + Number(el.sum);
        }
        return acc;
      }, 0)
    ),
  },
]);
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
        <VCard id="invoice-list">
          <VCardText class="d-flex align-center flex-wrap gap-4" :title="''">
            <VSpacer />

            <div class="d-flex align-center flex-wrap gap-6">
              <!-- <AddNewDialog @fetchDatas="() => fetchData(true)" /> -->
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
                <th>ОБЩЕЕ КОЛИЧЕСТВО ТОВАРОВ</th>
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
      <InfoDialog
        v-model:isDialogOpen="isInfoDialogVisible"
        :id="infoDialogItemId"
        @fetchDatas="() => fetchData(true)"
      />
    </VRow>
  </section>
</template>

<style lang="scss"></style>
