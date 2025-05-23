<script setup>
import { computed, ref, watch, watchEffect } from "vue";
import axios from "@axios";
import AddNewDrawer from "@/views/supplier/AddNewDrawer.vue";
import UpdateDrawer from "@/views/supplier/UpdateDrawer.vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import DeleteItemDialog from "@/@core/components/DeleteItemDialog.vue";
import { toast } from "vue3-toastify";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const { can } = useAppAbility();
const searchQuery = ref("");
const finalSearch = ref("");
const isFetching = ref(false);
const rowPerPage = ref(10);
const currentPage = ref(1);
const totalPage = ref(1);
const totalCompanies = ref(0);
const suppliers = ref([]);
const updateID = ref(0);

const lastFetchedPage = ref(null);

const fetchData = async (force = false) => {
  if (
    !force &&
    (isFetching.value || currentPage.value === lastFetchedPage.value)
  ) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  isFetching.value = true;

  try {
    const response = await axios.get(
      `/suppliers?page=${currentPage.value}&search=${finalSearch.value}`
    );

    suppliers.value = response.data["suppliers"];
    // lastFetchedPage.value = currentPage.value; // Сохраняем последнюю загруженную страницу
    // currentPage.value = response.data['meta']['current_page'];
    // totalCompanies.value = response.data['meta']['total'];
    // totalPage.value = response.data['meta']['last_page'];
    // rowPerPage.value = response.data['meta']['per_page'];
  } catch (error) {
    console.error("Ошибка загрузки кандидатов:", error);
  } finally {
    isFetching.value = false;
  }
};

// search
const handleSearch = async () => {
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

onMounted(() => {
  fetchData();
});

const isAddNewDrawerVisible = ref(false);
const isUpdateDrawerVisible = ref(false);

// // Pages start

// // 👉 watching current page
// watch(currentPage, () => {
//   if (!isFetching.value) {
//     fetchData();
//   }
// });

// // 👉 Watching current page
// watchEffect(() => {
//   if (currentPage.value > totalPage.value) currentPage.value = totalPage.value;
// });

// // 👉 Computing pagination data
// const paginationData = computed(() => {
//   const firstIndex = suppliers.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0;
//   const lastIndex = suppliers.value.length + (currentPage.value - 1) * rowPerPage.value;

//   return `${firstIndex}-${lastIndex} of ${totalCompanies.value}`;
// });

// // Pages end

const openEditDrawer = (id) => {
  updateID.value = id;
  isUpdateDrawerVisible.value = true;
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
    await axios.delete("/suppliers/" + id);
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
        <VCard>
          <VCardItem>
            <VRow>
              <VCol cols="auto">
                <VCardTitle class="pa-0"> Поставщики </VCardTitle>
              </VCol>
              <VSpacer />

              <!-- 👉 Search  -->
              <VCol cols="12" sm="3">
                <VTextField
                  v-model="searchQuery"
                  @keyup.enter="handleSearch"
                  placeholder="Поиск поставщика"
                  :rules="[]"
                  density="compact"
                />
              </VCol>
              <VCol cols="auto">
                <Can I="create" a="Supplier">
                  <VBtn @click="isAddNewDrawerVisible = true"
                    >Добавить нового поставщика</VBtn
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
                <th>ИМЯ</th>
                <th>НОМЕР ТЕЛЕФОНА</th>
                <th>АДРЕС</th>
                <th
                  data-column="actions"
                  v-if="can('update', 'Supplier') || can('delete', 'Supplier')"
                >
                  ДЕЙСТВИЯ
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="supplier in suppliers" :key="supplier.id">
                <td>{{ supplier.id }}</td>
                <td>{{ supplier.name }}</td>
                <td>{{ supplier.phone_number }}</td>
                <td>{{ supplier.address }}</td>
                <td data-column="actions">
                  <Can I="update" a="Supplier">
                    <VIcon
                      @click.stop="openEditDrawer(supplier.id)"
                      size="30"
                      icon="bx-edit-alt"
                      color="primary"
                    ></VIcon>
                  </Can>

                  <Can I="delete" a="Supplier">
                    <VIcon
                      size="30"
                      icon="bx-trash"
                      color="error"
                      @click="confirmDelete(supplier.id, supplier.title)"
                    ></VIcon>
                  </Can>
                </td>
              </tr>
            </tbody>

            <Skeleton :count="5" v-show="isFetching && !suppliers.length" />

            <tfoot v-if="!isFetching && !suppliers.length">
              <tr>
                <td colspan="5" class="text-center text-body-1">
                  Нет доступных данных
                </td>
              </tr>
            </tfoot>
          </VTable>

          <VDivider />

          <!-- <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <div class="d-flex align-center" style="width: 300px">
              <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
            </div>

            <VPagination
              v-if="suppliers.length"
              v-model="currentPage"
              
              :length="totalPage"
            />
          </VCardText> -->
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
    <Can I="create" a="Supplier">
      <AddNewDrawer
        v-model:isDrawerOpen="isAddNewDrawerVisible"
        @fetchDatas="() => fetchData(true)"
      />
    </Can>
    <Can I="update" a="Supplier">
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
