<script setup>
import { computed, onMounted, ref, watch } from "vue";
import axios from "@axios";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import BarcodeDialog from "@/views/product-variant/BarcodeDialog.vue";
import { fetchOptions, getPrettyDate } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";

// Initialize branches state
const selectedBranch = ref();
const branches_list = ref([]);

// Initialize barcode dialog state
const isBarcodeDialogVisible = ref(false);
const barcodeDialogId = ref(0);

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
  baseUrl: "showcases",
  resourceKey: "showcase",
});

// Watch for branch selection changes to update filters
watch(selectedBranch, (newValue) => {
  if (newValue !== undefined) {
    fetchData(
      {
        additionalParams: {
          branch_id: newValue,
        },
      },
      true
    );
  }
});

// Barcode dialog handler
const openBarcodeDialog = (id) => {
  barcodeDialogId.value = id;
  isBarcodeDialogVisible.value = true;
};

// Initialize component
onMounted(() => {
  fetchData();
  fetchOptions("branches", branches_list, "branches");
});

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
    icon: "mdi-tag-multiple",
    color: "primary",
    title: "Общая стоимость товаров",
    stats: metaDatas.value?.total_price,
    append: "so'm",
  },
  {
    icon: "mdi-cart-plus",
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
                <VCardTitle> Фильтры поиска </VCardTitle>
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
              <VCol cols="auto">
                <VBtn
                  color="success"
                  :disabled="isFetchingReport"
                  :loading="isFetchingReport"
                  prepend-icon="mdi-file-excel"
                  class="font-weight-bold"
                  @click="downloadReport('showcases', 'витрина')"
                >
                  EXCEL
                </VBtn>
              </VCol>
            </VRow>
          </VCardItem>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ИМЯ ПРОДУКТА</th>
                <th>ФИЛИАЛ</th>
                <!-- <th>
                  <VSelect
                    v-model="selectedBranch"
                    label="ФИЛИАЛ"
                    :items="branches_list"
                    item-title="name"
                    item-value="id"
                    variant="plain"
                    :rules="[]"
                  />
                </th> -->
                <th>БРЭНД</th>
                <th>КАТЕГОРИЯ</th>
                <th>КОЛИЧЕСТВО</th>
                <th>ПОЛ</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td>{{ product.id }}</td>
                <td>
                  {{ product?.variant.product?.name }}
                  <b
                    >( {{ product?.variant.color?.name }} |
                    {{ product?.variant.size?.name }} )</b
                  >
                </td>
                <td>{{ product.branch?.name }}</td>
                <td>{{ product.variant?.product?.brand }}</td>
                <td>{{ product.variant?.product?.category }}</td>
                <td>{{ product.quantity }}</td>
                <td>{{ product.variant?.product?.gender }}</td>
                <td
                  class="text-center"
                  :style="{ width: '80px', zIndex: '10' }"
                >
                  <VIcon
                    @click="
                      (event) => {
                        event.stopPropagation();
                        openBarcodeDialog(product.variant?.id);
                      }
                    "
                    size="30"
                    icon="mdi-barcode"
                    style="color: rgb(var(--v-theme-grey-800))"
                  ></VIcon>
                </td>
              </tr>
            </tbody>
            <Skeleton :count="8" v-show="isFetching && !products.length" />

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
      @fetchDatas="() => fetchData({}, true)"
    />
  </section>
</template>

<style lang="scss"></style>
