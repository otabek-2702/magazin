<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import axios from '@axios';
import Skeleton from '@/views/skeleton/Skeleton.vue';
// import InfoDialog from '@/views/stock/InfoDialog.vue';
import { useAppAbility } from '@/plugins/casl/useAppAbility';
import BarcodeDialog from '@/views/stock/BarcodeDialog.vue';
import { toast } from 'vue3-toastify';

const { can } = useAppAbility();
const searchQuery = ref('');
const finalSearch = ref('');
const rowPerPage = ref(30);
const currentPage = ref(1);
const totalPage = ref(1);
const lastFetchedPage = ref(null);
const totalDatasCount = ref(0);
const products = ref([]);
const updateID = ref(0);

// Get main datas start
const isFetching = ref(false);
const filtersChanged = ref(false);

const fetchData = async (force = false) => {
  if (
    !force &&
    (isFetching.value || (currentPage.value === lastFetchedPage.value && !filtersChanged.value))
  ) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  try {
    isFetching.value = true;
    const { data } = await axios.get(
      `/stock?paginate=30&page=${currentPage.value}&search=${finalSearch.value}&product_id=${selectedProduct.value ?? ''}&batch_id=${selectedBatch.value??''}`,
    );

    products.value = data['stock'];
    lastFetchedPage.value = currentPage.value;
    currentPage.value = data['meta']['pagination']['current_page'];
    totalDatasCount.value = data['meta']['pagination']['total'];
    totalPage.value = data['meta']['pagination']['total_pages'];
    rowPerPage.value = data['meta']['pagination']['per_page'];

    filtersChanged.value = false; // Сбрасываем флаг изменений фильтров после загрузки
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
  } finally {
    isFetching.value = false;
  }
};

// Get main datas end

const selectedProduct = ref()
const selectedBatch = ref()
// 👉 watching selected filters
watch([selectedProduct, selectedBatch], () => {
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
    finalSearch.value = '';
    currentPage.value = 1;
    fetchData(true);
  }
});

const batches_list = ref([])
const fetchBatches = async () => {
  try {
    const reponse = await axios.get(`/batches`);
    batches_list.value = reponse.data.batches
  } catch (error) {
    console.error('Ошибка :', error);
  }
};

onMounted(() => {
  fetchData();
  fetchBatches();
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
  const firstIndex = products.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0;
  const lastIndex = products.value.length + (currentPage.value - 1) * rowPerPage.value;

  return `${firstIndex}-${lastIndex} of ${totalDatasCount.value}`;
});

// Pages end

// BarCode
const barcodeDialogId = ref(0);
const openBarcodeDialog = (id) => {
  barcodeDialogId.value = id;
  isBarcodeDialogVisible.value = true;
};

// end BarCode
const products_list =  computed(() => products.value?.map((el) => ({name: el.variant.product.name, id: el.variant.id})))

const getProductName = (variant) => {
  return variant.product.name;
};
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard title="Фильтры поиска">
          <DeleteItemDialog
            @confirm="deleteItem"
            :isDialogVisible="isDialogVisible"
            @update:isDialogVisible="isDialogVisible = $event"
            :role="deleteData"
            :isDeleting="isDeleting"
          />
          <VCardText class="d-flex flex-wrap">
            <VCol cols="3" sm="3">
              <VSelect
                v-model="selectedBatch"
                label="Выберите партию"
                :items="batches_list"
                item-title="name"
                item-value="id"
              />
            </VCol>

            <VSpacer />

            <VCol cols="6" class="app-user-search-filter d-flex align-center">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="searchElements"
                placeholder="Поиск товара"
                :rules="[]"
                density="compact"
                class="me-6"
              />
              <Can I="add" a="Products">
                <AddNewDialog />
              </Can>
            </VCol>
          </VCardText>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>
                  <VSelect
                    v-model="selectedProduct"
                    label="ИМЯ ПРОДУКТА"
                    :items="products_list"
                    :rules="[]"
                    item-title="name"
                    item-value="id"
                    style="width: 200px"
                    variant="plain"
                  />
                </th>
                <th>БРЭНД</th>
                <th>КАТЕГОРИЯ</th>
                <th>РАЗМЕР</th>
                <th>ЦВЕТ</th>
                <th>КОЛИЧЕСТВО</th>
                <th>ПОЛ</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="stock in products" :key="stock.id">
                <td>{{ stock.id }}</td>
                <td>
                  {{ stock.variant?.product?.name }}
                </td>
                <td>{{ stock.variant?.product?.brand }}</td>
                <td>{{ stock.variant?.product?.category }}</td>
                <td>{{ stock.variant?.size?.name }}</td>
                <td>{{ stock.variant?.color?.name }}</td>
                <td>{{ stock.quantity }}</td>
                <td>{{ stock.variant?.product?.gender }}</td>
                <td class="text-center" :style="{ width: '80px', zIndex: '10' }">
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
            <Skeleton :count="9" v-show="isFetching && !products.length" />

            <tfoot v-show="!isFetching && !products.length">
              <tr>
                <td colspan="9" class="text-center text-body-1">Нет доступных данных</td>
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
              size="small"
              :total-visible="1"
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
