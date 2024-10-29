<script setup>
import { computed, onMounted, ref, watch } from "vue";
import axios from "@axios";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import BarcodeDialog from "@/views/product-variant/BarcodeDialog.vue";
import { fetchOptions, transformPrice } from "@/helpers";
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
  currentPage,
  totalPages: totalPage,
  paginationData,
  fetchData,
  handleSearch,
  searchQuery,
  isFetching,
} = useFetch({
  baseUrl: "showcases",
  resourceKey: "showcase",
  immediate: true,
  initialPage: 1,
  perPage: 30,
  debounceMs: 300,
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
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard title="Фильтры поиска">
          <VCardText class="d-flex flex-wrap">
            <VSpacer />

            <VCol cols="4" class="app-user-search-filter d-flex align-center">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="handleSearch"
                placeholder="Поиск товара"
                :rules="[]"
                density="compact"
                class="me-6"
              />
            </VCol>
          </VCardText>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ИМЯ ПРОДУКТА</th>
                <th>
                  <VSelect
                    v-model="selectedBranch"
                    label="ФИЛИАЛ"
                    :items="branches_list"
                    item-title="name"
                    item-value="id"
                    variant="plain"
                    :rules="[]"
                  />
                </th>
                <th>БРЭНД</th>
                <th>КАТЕГОРИЯ</th>
                <th>КОЛИЧЕСТВО</th>
                <th>ПОЛ</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>К-во: {{ transformPrice(state.totalQuantity ?? 0) }}</td>
                <td>Сумма: {{ transformPrice(state.totalPrice ?? 0) }}</td>
                <td></td>
                <td></td>
              </tr>
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
            <Skeleton
              :count="8"
              v-show="isFetching && !products.length"
            />

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
              :total-visible="7"
              :length="totalPage"
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

<style lang="scss">
.app-user-search-filter {
  inline-size: 385px;
}

.text-capitalize {
  text-transform: capitalize;
}
</style>
