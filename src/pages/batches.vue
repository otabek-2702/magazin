<script setup>
import { computed, onMounted, ref, watch, watchEffect } from "vue";
import axios from "@axios";
import AddNewDrawer from "@/views/batch/AddNewDrawer.vue";
import UpdateDrawer from "@/views/batch/UpdateDrawer.vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { useAppAbility } from "@/plugins/casl/useAppAbility";
import DeleteItemDialog from "@/@core/components/DeleteItemDialog.vue";
import { toast } from "vue3-toastify";

const { can } = useAppAbility();
const searchQuery = ref("");
const finalSearch = ref("");
const rowPerPage = ref(10);
const currentPage = ref(1);
const totalPage = ref(1);
const totalDatasCount = ref(0);
const batches = ref([]);
const updateID = ref(0);

// Get main datas start
const lastFetchedPage = ref(null);
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
      `/batches?paginate=30&page=${currentPage.value}&search=${finalSearch.value}`
    );

    batches.value = data["batches"];
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
//     states_list.value = states_r.data.states.filter((el) => el.table === 'batches');
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
// const isInfoDialogVisible = ref(false);

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
  const firstIndex = batches.value.length
    ? (currentPage.value - 1) * rowPerPage.value + 1
    : 0;
  const lastIndex =
    batches.value.length + (currentPage.value - 1) * rowPerPage.value;

  return `${firstIndex}-${lastIndex} of ${totalDatasCount.value}`;
});

// Edit
const openEditDrawer = (id) => {
  updateID.value = id;
  isUpdateDrawerVisible.value = true;
};

// // Show one
// const infoDialogItemId = ref(0);

// const handleInfoDialogOpen = (id) => {
//   infoDialogItemId.value = id;
//   isInfoDialogVisible.value = true;
// };

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
    await axios.delete("/batches/" + id);
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

const transformDate = (date) => {
  const value = new Date(date);
  const addZero = (v) => (v < 10 ? "0" + v.toString() : v);
  return `${addZero(value.getDate())}-${addZero(
    value.getMonth() + 1
  )}-${value.getFullYear()}`;
};
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard>
          <!-- 👉 Head -->
          <VCardItem>
            <VRow>
              <VCol cols="auto">
                <VCardTitle class="pa-0"> Партии товаров </VCardTitle>
              </VCol>
              <VSpacer />

              <!-- 👉 Search  -->
              <VCol cols="12" sm="3">
                <VTextField
                  v-model="searchQuery"
                  @keyup.enter="handleSearch"
                  placeholder="Поиск партии "
                  :rules="[]"
                  density="compact"
                />
              </VCol>
              <VCol cols="auto">
                <Can I="create" a="Batch">
                  <VBtn @click="isAddNewDrawerVisible = true"
                    >Добавить новую партию</VBtn
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
                <th>ДАТА</th>
                <th>ИМЯ</th>
                <th>ДОРОЖНЫЕ РАСХОДЫ</th>
                <th>ОПИСАНИЕ</th>
                <th
                  v-if="can('update', 'Batch') || can('delete', 'Batch')"
                  data-column="actions"
                >
                  ДЕЙСТВИЯ
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                class="cursor-pointer"
                v-for="batch in batches"
                :key="batch.id"
              >
                <td>{{ batch.id }}</td>
                <td>{{ transformDate(batch.created_at) }}</td>
                <td>{{ batch.name }}</td>
                <td>{{ batch.road_expenses }}</td>
                <td class="overflow-hide">{{ batch.description }}</td>
                <td data-column="actions">
                  <Can I="update" a="Batch">
                    <VIcon
                      @click.stop="openEditDrawer(batch.id)"
                      size="30"
                      icon="bx-edit-alt"
                      color="primary"
                      class="mx-2"
                    ></VIcon>
                  </Can>
                  <Can I="delete" a="Batch">
                    <VIcon
                      size="30"
                      icon="bx-trash"
                      color="error"
                      @click="confirmDelete(batch.id, batch.name)"
                    ></VIcon>
                  </Can>
                </td>
              </tr>
            </tbody>
            <Skeleton :count="6" v-show="isFetching && !batches.length" />

            <tfoot v-show="!isFetching && !batches.length">
              <tr>
                <td colspan="6" class="text-center text-body-1">
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
              v-if="batches.length"
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

    <Can I="create" a="Batch">
      <AddNewDrawer
        v-model:isDrawerOpen="isAddNewDrawerVisible"
        @fetchDatas="() => fetchData(true)"
      />
    </Can>
    <Can I="update" a="Batch">
      <UpdateDrawer
        :id="updateID"
        v-model:isDrawerOpen="isUpdateDrawerVisible"
        @fetchDatas="() => fetchData(true)"
      />
    </Can>
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
