<script setup>
import { computed, ref } from "vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import BarcodeDialog from "@/views/stock/BarcodeDialog.vue";
import AddNewWayBillToBranchDialog from "@/views/invoice-departure/AddNewDialog.vue";
import { useFetch } from "@/hooks/useFetch";
import axios from "@/plugins/axios";
import { getPrettyDate } from "@/helpers";

// Initialize useFetch hook with your configuration
const {
  state,
  items: products,
  totalPages,
  paginationData,
  fetchData,
  metaDatas,
  handleSearch,
  searchQuery,
  isFetching,
} = useFetch({
  baseUrl: "stock",
});

const isBarcodeDialogVisible = ref(false);

// BarCode
const barcodeDialogId = ref(0);
const openBarcodeDialog = (id) => {
  barcodeDialogId.value = id;
  isBarcodeDialogVisible.value = true;
};

// end BarCode

// EXCEL
const isFetchingReport = ref(false);
const downloadReport = async (endpoint, filename) => {
  try {
    isFetchingReport.value = true;
    const response = await axios.post(
      `/exports/${endpoint}`,
      {},
      {
        responseType: "blob",
        headers: {
          Accept: "application/octet-stream",
          "Content-Type": "application/json",
        },
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}|${getPrettyDate()}.xlsx`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } finally {
    isFetchingReport.value = false;
  }
};

const metaDatasList = computed(() => [
  {
    icon: "mdi-cash",
    color: "primary",
    title: "Общая сумма товаров",
    stats: metaDatas.value?.total_price,
    append: "so'm",
  },
  {
    icon: "mdi-package-variant",
    color: "success",
    title: "Общее количество товаров",
    stats: metaDatas.value?.total_quantity,
    append: "",
  },
]);
</script>

<template>
  <section>
    <VRow>
      <VCol
        v-for="meta in metaDatasList"
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
                  <AnimatedNumber :number="meta.stats" /> {{ meta.append }}
                </h6>
              </div>
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
        <VCard>
          <VCardItem>
            <VRow>
              <VCol cols="auto">
                <VCardTitle> Главный склад </VCardTitle>
              </VCol>

              <VSpacer />

              <VCol cols="auto">
                <VBtn
                  color="success"
                  :disabled="isFetchingReport"
                  :loading="isFetchingReport"
                  prepend-icon="mdi-file-excel"
                  class="font-weight-bold"
                  @click="downloadReport('stock', 'Главный_склад')"
                >
                  EXCEL
                </VBtn>
              </VCol>
            </VRow>
          </VCardItem>
          <VCardText>
            <VRow>
              <VCol cols="auto">
                <Can I="create" a="DepartureInvoice">
                  <AddNewWayBillToBranchDialog
                    @fetchDatas="() => fetchData(true)"
                  />
                </Can>
              </VCol>

              <VSpacer />
              <!-- 👉 Search  -->

              <VCol cols="12" sm="3">
                <VTextField
                  v-model="searchQuery"
                  @keyup.enter="handleSearch"
                  placeholder="Поиск товара"
                  :rules="[]"
                  density="compact"
                />
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <VTable>
            <thead>
              <tr>
                <th data-column="id">ID</th>
                <th>ИМЯ ПРОДУКТА</th>
                <th>БРЭНД</th>
                <th>КАТЕГОРИЯ</th>
                <th>КОЛИЧЕСТВО</th>
                <th>ПОЛ</th>
                <th data-column="actions">ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="stock in products" :key="stock.id">
                <td>{{ stock.id }}</td>
                <td>
                  {{ stock?.variant.product?.name }}
                  <b
                    >( {{ stock?.variant.color?.name }} |
                    {{ stock?.variant.size?.name }} )</b
                  >
                </td>
                <td>{{ stock.variant?.product?.brand }}</td>
                <td>{{ stock.variant?.product?.category }}</td>
                <td>{{ stock.quantity }}</td>
                <td>{{ stock.variant?.product?.gender }}</td>
                <td data-column="actions">
                  <VIcon
                    @click="
                      (event) => {
                        event.stopPropagation();
                        openBarcodeDialog(stock.id);
                      }
                    "
                    size="30"
                    icon="mdi-barcode"
                    style="color: rgb(var(--v-theme-grey-800))"
                  ></VIcon>
                </td>
              </tr>
            </tbody>
            <Skeleton :count="7" v-show="isFetching && !products.length" />

            <tfoot v-show="!isFetching && !products.length">
              <tr>
                <td colspan="9" class="text-center text-body-1">
                  Нет доступных данных
                </td>
              </tr>
            </tfoot>
          </VTable>

          <VDivider />

          <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <div class="d-flex align-center" style="width: 300px">
              <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
            </div>

            <VPagination
              v-if="products.length"
              v-model="state.currentPage"
              :length="totalPages"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <BarcodeDialog
      v-model:isDrawerOpen="isBarcodeDialogVisible"
      :productId="barcodeDialogId"
      @fetchDatas="() => fetchData(true)"
    />
  </section>
</template>

<style lang="scss"></style>
