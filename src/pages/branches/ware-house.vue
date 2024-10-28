<script setup>
import { computed, onMounted, ref, watch, watchEffect } from "vue";
import axios from "@axios";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import BarcodeDialog from "@/views/product-variant/BarcodeDialog.vue";
import AddNewWayBillToShowcaseDialog from "@/views/branch/invoice/AddNewDialog.vue";
import { fetchOptions, transformPrice } from "@/helpers";

const searchQuery = ref("");
const finalSearch = ref("");
const selectedBranch = ref();
const rowPerPage = ref(30);
const totalQuantity = ref(0);
const totalPrice = ref(0);
const currentPage = ref(1);
const totalPage = ref(1);
const lastFetchedPage = ref(null);
const totalDatasCount = ref(0);
const products = ref([]);

// Get main datas start
const isFetching = ref(false);
const filtersChanged = ref(false);

const fetchData = async (force = false) => {
  if (
    !force &&
    (isFetching.value ||
      (currentPage.value === lastFetchedPage.value && !filtersChanged.value))
  ) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  try {
    isFetching.value = true;
    const { data } = await axios.get(
      `/warehouses?paginate=30&page=${currentPage.value}&search=${finalSearch.value}`
    );

    products.value = data["warehouses"];
    lastFetchedPage.value = currentPage.value;
    currentPage.value = data["meta"]["pagination"]["current_page"];
    totalDatasCount.value = data["meta"]["pagination"]["total"];
    totalPage.value = data["meta"]["pagination"]["total_pages"];
    rowPerPage.value = data["meta"]["pagination"]["per_page"];
    totalQuantity.value = data["total_quantity"];
    totalPrice.value = data["total_price"];

    filtersChanged.value = false; // Сбрасываем флаг изменений фильтров после загрузки
  } catch (error) {
    console.error("Ошибка загрузки товаров:", error);
  } finally {
    isFetching.value = false;
  }
};

// Get main datas end

// 👉 watching selected filters
watch([], () => {
  // Сбрасываем на первую страницу при изменении фильтров
  filtersChanged.value = true; // Устанавливаем флаг, что фильтры изменились
  currentPage.value = 1;
  fetchData(true);
});

// search
const searchElements = () => {
  finalSearch.value = searchQuery.value;
  currentPage.value = 1;
  fetchData(true);
};

watch(searchQuery, (newVal) => {
  if (!newVal) {
    finalSearch.value = "";
    currentPage.value = 1;
    fetchData(true);
  }
});

const branches_list = ref([]);

onMounted(() => {
  fetchData();
  fetchOptions("branches", branches_list, "branches");
});

const isBarcodeDialogVisible = ref(false);

// Pages start

// 👉 watching current page
watch(currentPage, () => {
  if (!isFetching.value) {
    fetchData();
  }
});

// 👉 Watching current page
watchEffect(() => {
  if (currentPage.value > totalPage.value) currentPage.value = totalPage.value;
});

// 👉 Computing pagination data
const paginationData = computed(() => {
  const firstIndex = products.value.length
    ? (currentPage.value - 1) * rowPerPage.value + 1
    : 0;
  const lastIndex =
    products.value.length + (currentPage.value - 1) * rowPerPage.value;

  return `${firstIndex}-${lastIndex} of ${totalDatasCount.value}`;
});

// Pages end

// BarCode
const barcodeDialogId = ref(0);
const openBarcodeDialog = (id) => {
  barcodeDialogId.value = id;
  isBarcodeDialogVisible.value = true;
  console.log(branches_list.value)

};

// end BarCode
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard title="Фильтры поиска">
          <!-- <DeleteItemDialog
            @confirm="deleteItem"
            :isDialogVisible="isDialogVisible"
            @update:isDialogVisible="isDialogVisible = $event"
            :role="deleteData"
            :isDeleting="isDeleting"
          /> -->
          <VCardText class="d-flex flex-wrap">
            <AddNewWayBillToShowcaseDialog @fetchDatas="() => fetchData(true)" />

            <VSpacer />

            <VCol cols="4" class="app-user-search-filter d-flex align-center">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="searchElements"
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
                <!-- <th>ФИЛИАЛ</th> -->
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
                <td>К-во: {{ transformPrice(totalQuantity ?? 0) }}</td>
                <td>Сумма: {{ transformPrice(totalPrice ?? 0) }}</td>
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
              v-model="currentPage"
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
      @fetchDatas="() => fetchData(true)"
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
