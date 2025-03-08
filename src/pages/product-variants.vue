<script setup>
import { computed, onMounted, ref, watch, watchEffect } from "vue";
import axios from "@axios";
import AddNewDrawer from "@/views/product-variant/AddNewDrawer.vue";
import UpdateDrawer from "@/views/product-variant/UpdateDrawer.vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import BarcodeDialog from "@/views/product-variant/BarcodeDialog.vue";
import DeleteItemDialog from "@/@core/components/DeleteItemDialog.vue";
import { toast } from "vue3-toastify";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const { can } = useAppAbility();

const searchQuery = ref("");
const finalSearch = ref("");
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
    (isFetching.value ||
      (currentPage.value === lastFetchedPage.value && !filtersChanged.value))
  ) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  try {
    isFetching.value = true;
    const { data } = await axios.get(
      `/product_variants?paginate=30&page=${currentPage.value}&search=${finalSearch.value}`
    );

    products.value = data["products_variants"];
    lastFetchedPage.value = currentPage.value;
    currentPage.value = data["meta"]["pagination"]["current_page"];
    totalDatasCount.value = data["meta"]["pagination"]["total"];
    totalPage.value = data["meta"]["pagination"]["total_pages"];
    rowPerPage.value = data["meta"]["pagination"]["per_page"];

    filtersChanged.value = false; // Сбрасываем флаг изменений фильтров после загрузки
  } catch (error) {
    console.error("Ошибка загрузки товаров:", error);
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
const handleSearch = () => {
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

// const fetchStates = async () => {
//   try {
//     const states_r = await axios.get(`/states`);
//     states_list.value = states_r.data.states.filter((el) => el.table === 'products');
//   } catch (error) {
//     console.error('Ошибка :', error);
//   }
// };

onMounted(() => {
  fetchData();
  // fetchStates();
});

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

// Delete
const isDialogVisible = ref(false);
const isDeleting = ref(false);
const deleteData = ref({
  id: 1,
  name: null,
});

const confirmDelete = function (id, name) {
  deleteData.value.id = id;
  deleteData.value.name = name;
  isDialogVisible.value = true;
};

const deleteItem = async function (id) {
  try {
    isDeleting.value = true;
    await axios.delete("/product_variants/" + id);
    toast("Успешно удалено", {
      type: "success",
    });
    await fetchData(true);
    isDialogVisible.value = false;
  } catch (error) {
    console.error("Ошибка :", error);
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard >
          <!-- 👉 Head -->
          <VCardItem>
            <VRow>
              <VCol cols="auto">
                <VCardTitle class="pa-0"> Вариации товаров </VCardTitle>
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
                <Can I="create" a="Product">
                  <VBtn @click="isAddNewDrawerVisible = true"
                    >Добавить новый товар</VBtn
                  >
                </Can>
              </VCol>
            </VRow>
          </VCardItem>

          <VDivider />

          <VTable>
            <thead>
              <tr>
                <th data-column="id">ID</th>
                <th>ИМЯ ПРОДУКТА</th>
                <th>БРЭНД</th>
                <th>КАТЕГОРИЯ</th>
                <th>СЕЗОН</th>
                <th>ПОЛ</th>
                <th
                  data-column="actions"
                  
                >
                  ДЕЙСТВИЯ
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="variant in products" :key="variant.id">
                <td>{{ variant.id }}</td>
                <td>
                  {{ variant.product?.name }}
                  <b>({{ variant.color?.name }} | {{ variant.size?.name }})</b>
                </td>
                <td>{{ variant.product?.brand }}</td>
                <td>{{ variant.product?.category?.name }}</td>
                <td>{{ variant.product?.season?.translate }}</td>
                <td>{{ variant.product?.gender?.translate }}</td>
                <td data-column="actions">
                  <VIcon
                    @click.stop="openBarcodeDialog(variant.id)"
                    size="30"
                    icon="mdi-barcode"
                    style="color: rgb(var(--v-theme-grey-800))"
                  ></VIcon>
                  <Can I="update" a="Products">
                    <VIcon
                      @click.stop="openEditDrawer(variant.id)"
                      size="30"
                      icon="bx-edit-alt"
                      color="primary"
                      class="mx-2"
                    ></VIcon>
                  </Can>
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
              v-model="currentPage"
              :length="totalPage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <DeleteItemDialog
      @confirm="deleteItem"
      :isDialogVisible="isDialogVisible"
      @update:isDialogVisible="isDialogVisible = $event"
      :role="deleteData"
      :isDeleting="isDeleting"
    />

    <Can I="create" a="ProductVariant">
      <AddNewDrawer
        v-model:isDrawerOpen="isAddNewDrawerVisible"
        @fetchDatas="() => fetchData(true)"
      />
    </Can>
    <Can I="update" a="ProductVariant">
      <UpdateDrawer
        :id="updateID"
        v-model:isDrawerOpen="isUpdateDrawerVisible"
        @fetchDatas="() => fetchData(true)"
      />
    </Can>

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
