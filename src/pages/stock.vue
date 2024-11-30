<script setup>
import { computed,  ref} from "vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import BarcodeDialog from "@/views/stock/BarcodeDialog.vue";
import AddNewWayBillToBranchDialog from "@/views/invoice-departure/AddNewDialog.vue";
import { useFetch } from "@/hooks/useFetch";

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
        <VCard title="Фильтры поиска">
          <VCardText>
            <VRow>
              <VCol cols="auto">
                <AddNewWayBillToBranchDialog
                  @fetchDatas="() => fetchData(true)"
                />
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
                <th style="width: 48px">ID</th>
                <th>ИМЯ ПРОДУКТА</th>
                <th>БРЭНД</th>
                <th>КАТЕГОРИЯ</th>
                <th>КОЛИЧЕСТВО</th>
                <th>ПОЛ</th>
                <th>ДЕЙСТВИЯ</th>
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
                <td
                  class="text-center"
                  :style="{ width: '80px', zIndex: '10' }"
                >
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
