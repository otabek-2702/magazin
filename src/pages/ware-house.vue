<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import axios from '@axios';
import AddNewDrawer from '@/views/ware-house/AddNewDrawer.vue';
import UpdateDrawer from '@/views/ware-house/UpdateDrawer.vue';
import ChangeStateItem from '@/views/ware-house/ChangeStateItem.vue';
import Skeleton from '@/views/skeleton/Skeleton.vue';
import InfoDialog from '@/views/ware-house/InfoDialog.vue';
import AcceptItem from '@/views/ware-house/AcceptItem.vue';
import { useAppAbility } from '@/plugins/casl/useAppAbility';
import BarcodeDialog from '@/views/ware-house/BarcodeDialog.vue';

const { can } = useAppAbility();
const searchQuery = ref('');
const finalSearch = ref('');
const rowPerPage = ref(10);
const currentPage = ref(1);
const totalPage = ref(1);
const totalDatasCount = ref(0);
const products = ref([]);
const updateID = ref(0);

const selectedState = ref();

const states_list = ref([]);

// Get main datas start
const lastFetchedPage = ref(null);
const isFetching = ref(false);
const filtersChanged = ref(false);

const fetchData = async (force = false) => {
  if (
    !force &&
    (isFetching.value || (currentPage.value === lastFetchedPage.value && !filtersChanged.value))
  ) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  isFetching.value = true;
  let state = '';

  if (selectedState.value) {
    state = '&state=' + selectedState.value;
  }

  try {
    const products_r = {
      products: [
        {
          id: 1,
          name: 'T-Shirt',
          brand: {
            id: 1,
            name: 'Brand A',
          },
          price: 25.99,
          stock: 100,
          bar_code: '123456789012',
          categories: ['Clothing', "Men's Wear"],
        },
        {
          id: 2,
          name: 'Jeans',
          brand: {
            id: 2,
            name: 'Brand B',
          },
          price: 49.99,
          stock: 50,
          bar_code: '987654321098',
          categories: ['Clothing', "Men's Wear"],
        },
        {
          id: 3,
          name: 'Sneakers',
          brand: {
            id: 3,
            name: 'Brand C',
          },
          price: 75.5,
          stock: 30,
          bar_code: '234567890123',
          categories: ['Footwear', 'Unisex'],
        },
        {
          id: 4,
          name: 'Jacket',
          brand: {
            id: 4,
            name: 'Brand D',
          },
          price: 99.99,
          stock: 15,
          bar_code: '345678901234',
          categories: ['Outerwear', "Men's Wear"],
        },
        {
          id: 5,
          name: 'Dress',
          brand: {
            id: 5,
            name: 'Brand E',
          },
          price: 59.99,
          stock: 20,
          bar_code: '456789012345',
          categories: ['Clothing', "Women's Wear"],
        },
        {
          id: 6,
          name: 'Hat',
          brand: {
            id: 6,
            name: 'Brand F',
          },
          price: 15.99,
          stock: 80,
          bar_code: '567890123456',
          categories: ['Accessories', 'Unisex'],
        },
      ],
      meta: {                                        
        current_page: 1,
        from: 1,
        last_page: 1,
        links: [
          {
            url: null,
            label: '&laquo; Previous',
            active: false,
          },
          {
            url: 'https://api.skaldofmarket.jasondev.uz/products?page=1',
            label: '1',
            active: true,
          },
          {
            url: null,
            label: 'Next &raquo;',
            active: false,
          },
        ],
        path: 'https://api.skaldofmarket.jasondev.uz/products',
        per_page: 30,
        to: 6,
        total: 6,
      },
    };
    await axios.get(`/candidates?page=${currentPage.value}${state}&search=${finalSearch.value}`);

    products.value = products_r['products'];
    lastFetchedPage.value = currentPage.value;
    currentPage.value = products_r['meta']['current_page'];
    totalDatasCount.value = products_r['meta']['total'];
    totalPage.value = products_r['meta']['last_page'];
    rowPerPage.value = products_r['meta']['per_page'];

    filtersChanged.value = false; // Сбрасываем флаг изменений фильтров после загрузки
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
  } finally {
    isFetching.value = false;
  }
};

// Get main datas end

// 👉 watching selected filters
watch([selectedState], () => {
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

const fetchStates = async () => {
  try {
    const states_r = await axios.get(`/states`);
    states_list.value = states_r.data.states.filter((el) => el.table === 'products');
  } catch (error) {
    console.error('Ошибка :', error);
  }
};

onMounted(() => {
  fetchData();
  fetchStates();
});

const resolveStateVariant = (state) => {
  const roleLowerCase = state.toLowerCase();
  const roleMap = {
    new: { color: 'primary', icon: 'bx-user' },
    cancel: { color: 'warning', icon: 'bx-cog' },
    archive: { color: 'secondary', icon: 'bx-cog' },
    success: { color: 'success', icon: 'bx-doughnut-chart' },
    invite: { color: 'info', icon: 'bx-pencil' },
    block: { color: 'error', icon: 'bx-laptop' },
  };

  return roleMap[roleLowerCase] || { color: 'primary', icon: 'bx-user' };
};

const isAddNewDrawerVisible = ref(false);
const isUpdateDrawerVisible = ref(false);
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

// Edit
const openEditDrawer = (id) => {
  updateID.value = id;
  isUpdateDrawerVisible.value = true;
};

// Show one
const infoDialogItemId = ref(0);

const handleInfoDialogOpen = (id) => {
  infoDialogItemId.value = id;
  isInfoDialogVisible.value = true;
};
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard title="Фильтры поиска">
          <VDivider />

          <VCardText class="d-flex flex-wrap">
            <VCol cols="3" sm="3">
              <VSelect
                v-model="selectedState"
                label="Выберите статус"
                :items="states_list"
                item-title="name_ru"
                item-value="id"
                clearable
                clear-icon="bx-x"
              />
            </VCol>

            <!-- <VSpacer /> -->

            <!-- <div class="app-user-search-filter d-flex align-center"> -->
            <VCol cols="6" class="app-user-search-filter d-flex align-center">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="searchElements"
                placeholder="Поиск товара"
                density="compact"
                class="me-6"
              />
              <!-- <Can I="add" a="Role">
                <VBtn @click="isAddNewDrawerVisible = true"> Добавить товара </VBtn>
              </Can> -->
            </VCol>

            <!-- </div> -->
          </VCardText>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ИМЯ ПРОДУКТА</th>
                <th>БРЭНД</th>
                <th>ОСТАТОК</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody>
              <tr
                @click="() => handleInfoDialogOpen(product.id)"
                :style="{ cursor: 'pointer' }"
                v-for="product in products"
                :key="product.id"
              >
                <td>{{ product.id }}</td>
                <td>
                  {{ product.name }}
                </td>
                <td>{{ product.brand?.name }}</td>
                <td>{{ product.stock }}</td>
                <!-- <td>{{ product.phone_number }}</td> -->
                <!-- <td>
                  <VChip
                    :color="resolveStateVariant(product.state?.slug).color"
                    density="compact"
                    label
                    class="text-uppercase"
                  >
                    {{ product.state.name_ru }}
                  </VChip>
                </td> -->
                <td class="text-center" :style="{ width: '80px', zIndex: '10' }">
                  <VIcon
                    @click="
                      (event) => {
                        event.stopPropagation();
                        openBarcodeDialog(product.id);
                      }
                    "
                    size="30"
                    icon="mdi-barcode"
                    style="color: rgb(var(--v-theme-grey-800))"
                  ></VIcon>
                  <!-- <Can I="update" a="Role">
                    <VIcon
                      @click="
                        (event) => {
                          event.stopPropagation();
                          openEditDrawer(product.id);
                        }
                      "
                      size="30"
                      icon="bx-edit-alt"
                      style="color: rgb(var(--v-global-theme-primary))"
                    ></VIcon>
                  </Can>

                  <Can I="change" a="Candidatestate">
                    <ChangeStateItem
                      @fetchDatas="() => fetchData(true)"
                      :isDialogVisible="true"
                      :id="product.id"
                      :state_slug="product.state?.slug"
                    />
                    <AcceptItem
                      v-if="true || product.state?.slug === 'invite'"
                      @fetchDatas="() => fetchData(true)"
                      :isDialogVisible="true"
                      :id="product.id"
                    />
                  </Can> -->
                </td>
              </tr>
            </tbody>
            <Skeleton :count="5" v-show="isFetching && !products.length" />

            <tfoot v-show="!isFetching && !products.length">
              <tr>
                <td colspan="5" class="text-center text-body-1">Нет доступных данных</td>
              </tr>
            </tfoot>
          </VTable>

          <VDivider />

          <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <div class="d-flex align-center" style="width: 300px">
              <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
            </div>

            <VPagination
              v-if="true || products.length"
              v-model="currentPage"
              size="small"
              :total-visible="1"
              :length="totalPage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <AddNewDrawer
      v-model:isDrawerOpen="isAddNewDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />
    <UpdateDrawer
      :id="updateID"
      v-model:isDrawerOpen="isUpdateDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />

    <InfoDialog
      v-model:isDrawerOpen="isInfoDialogVisible"
      :productId="infoDialogItemId"
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
