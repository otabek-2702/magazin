<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import axios from '@axios';
import Skeleton from '@/views/skeleton/Skeleton.vue';
import InfoDialog from '@/views/invoice/InfoDialog.vue';
import BarcodeDialog from '@/views/invoice/BarcodeDialog.vue';
import DeleteItemDialog from '@/@core/components/DeleteItemDialog.vue';
import { toast } from 'vue3-toastify';
import AddNewDialog from '@/views/invoice/AddNewDialog.vue';
import { transformPrice } from '@/helpers';

const searchQuery = ref('');
const finalSearch = ref('');
const rowPerPage = ref(30);
const currentPage = ref(1);
const totalPage = ref(1);
const lastFetchedPage = ref(null);
const totalDatasCount = ref(0);
const invoices = ref([]);
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
      `/invoices?paginate=30&page=${currentPage.value}&search=${finalSearch.value}`,
    );

    invoices.value = data['invoices'];
    lastFetchedPage.value = currentPage.value;
    currentPage.value = data['meta']['pagination']['current_page'];
    totalDatasCount.value = data['meta']['pagination']['total'];
    totalPage.value = data['meta']['pagination']['total_pages'];
    rowPerPage.value = data['meta']['pagination']['per_page'];

    filtersChanged.value = false; // Сбрасываем флаг изменений фильтров после загрузки
  } catch (error) {
    console.error('Ошибка загрузки :', error);
  } finally {
    isFetching.value = false;
  }
};

// Get main datas end

// 👉 watching selected filters
// watch([selectedState], () => {
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

// const fetchStates = async () => {
//   try {
//     const states_r = await axios.get(`/states`);
//     states_list.value = states_r.data.states.filter((el) => el.table === 'invoices');
//   } catch (error) {
//     console.error('Ошибка :', error);
//   }
// };

onMounted(() => {
  fetchData();
  // fetchStates();
});

const isInfoDialogVisible = ref(false);
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
  const firstIndex = invoices.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0;
  const lastIndex = invoices.value.length + (currentPage.value - 1) * rowPerPage.value;

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

// Show one
const infoDialogItemId = ref(0);

const handleInfoDialogOpen = (id) => {
  infoDialogItemId.value = id;
  isInfoDialogVisible.value = true;
};

const resolveInvoiceStatus = (status) => {
  const roleMap = {
    'Черновик': { color: 'primary' },
    'Отклонено': { color: 'secondary' },
    'Подтверждено': { color: 'success' },
  };

  return roleMap[status] || { color: 'primary' };
};
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard title="Фильтры поиска">
          <VCardText class="d-flex flex-wrap">
            <!-- <VCol cols="3" sm="3">
              <VSelect
                
                v-model="selectedState"
                label="Выберите статус"
                :items="states_list"
                item-title="name_ru"
                item-value="id"
                
                
              />
            </VCol> -->

            <VSpacer />

            <VCol cols="6" class="app-user-search-filter d-flex align-center">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="searchElements"
                placeholder="Поиск "
                :rules="[]"
                density="compact"
                class="me-6"
              />
              <Can I="add" a="Invoices">
                <AddNewDialog @fetchDatas="() => fetchData(true)" />
              </Can>
            </VCol>
          </VCardText>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ПАРТИЯ</th>
                <th>КУРС</th>
                <th>СТАТУС</th>
                <th>ОБЩАЯ СУММА</th>
                <!-- <th>ДЕЙСТВИЯ</th> -->
              </tr>
            </thead>

            <tbody>
              <tr v-for="invoice in invoices" :key="invoice.id" @click="handleInfoDialogOpen(invoice.id)" style="cursor: pointer">
                <td>{{ invoice.id }}</td>

                <td>{{ invoice.batch.name }}</td>
                <td>{{ transformPrice(invoice.exchange_rate) }} {{ invoice.currency.symbol }}</td>
                <td>
                  <VChip
                    :color="resolveInvoiceStatus(invoice.status).color"
                    density="compact"
                    label
                    class="text-uppercase"
                  >
                    {{ invoice.status }}
                  </VChip>
                </td>
                <td>{{ transformPrice(invoice.total_amount) }}{{ invoice.currency.symbol }}</td>

                <!-- <td class="text-center" :style="{ width: '80px', zIndex: '10' }">
                  <VIcon
                    @click="
                      (event) => {
                        event.stopPropagation();
                        openBarcodeDialog(invoice.id);
                      }
                    "
                    size="30"
                    icon="mdi-barcode"
                    style="color: rgb(var(--v-theme-grey-800))"
                  ></VIcon>
                  <Can I="update" a="Invoices">
                    <VIcon
                      @click="
                        (event) => {
                          event.stopPropagation();
                          openEditDrawer(invoice.id);
                        }
                      "
                      size="30"
                      icon="bx-edit-alt"
                      style="color: rgb(var(--v-global-theme-primary))"
                      class="mx-2"
                    ></VIcon>
                  </Can>
                </td> -->
              </tr>
            </tbody>
            <Skeleton :count="5" v-show="isFetching && !invoices.length" />

            <tfoot v-show="!isFetching && !invoices.length">
              <tr>
                <td colspan="15" class="text-center text-body-1">Нет доступных данных</td>
              </tr>
            </tfoot>
          </VTable>

          <VDivider />

          <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <div class="d-flex align-center" style="width: 300px">
              <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
            </div>

            <VPagination
              v-if="invoices.length"
              v-model="currentPage"
              size="small"
              :total-visible="1"
              :length="totalPage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <InfoDialog
      v-model:isDialogOpen="isInfoDialogVisible"
      :id="infoDialogItemId"
      @fetchDatas="() => fetchData(true)"
    />
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
