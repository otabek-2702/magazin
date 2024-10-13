<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import axios from '@axios';
import Skeleton from '@/views/skeleton/Skeleton.vue';
import BarcodeDialog from '@/views/stock/BarcodeDialog.vue';
import { toast } from 'vue3-toastify';

const searchQuery = ref('');
const finalSearch = ref('');
const rowPerPage = ref(30);
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
    (isFetching.value || (currentPage.value === lastFetchedPage.value && !filtersChanged.value))
  ) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  try {
    isFetching.value = true;
    const { data } = await axios.get(
      `/stock?paginate=30&page=${currentPage.value}&search=${finalSearch.value}`,
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

// 👉 watching selected filters
// watch([], () => {
//   // Сбрасываем на первую страницу при изменении фильтров
//   filtersChanged.value = true; // Устанавливаем флаг, что фильтры изменились
//   currentPage.value = 1;
//   fetchData(true);
// });

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


onMounted(() => {
  fetchData();
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
                  {{ stock?.variant.product?.name }} <b>( {{ stock?.variant.color?.name }} | {{ stock?.variant.size?.name }} )</b>
                </td>
                <td>{{ stock.variant?.product?.brand }}</td>
                <td>{{ stock.variant?.product?.category }}</td>
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
