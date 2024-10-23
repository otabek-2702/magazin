<script setup>
import { computed, ref, watch, watchEffect } from 'vue';
import axios from '@axios';
import AddNewDrawer from '@/views/branch/AddNewDrawer.vue';
import UpdateDrawer from '@/views/branch/UpdateDrawer.vue';
import Skeleton from '@/views/skeleton/Skeleton.vue';
import DeleteItemDialog from '@/@core/components/DeleteItemDialog.vue';
import { toast } from 'vue3-toastify';
import { useAppAbility } from '@/plugins/casl/useAppAbility';

const { can } = useAppAbility();
const searchQuery = ref('');
const finalSearch = ref('');
const isFetching = ref(false);
const rowPerPage = ref(10);
const currentPage = ref(1);
const totalPage = ref(1);
const totalDatasCount = ref(0);
const branches = ref([]);
const updateID = ref(0);

const lastFetchedPage = ref(null);

const fetchData = async (force = false) => {
  if (!force && (isFetching.value || currentPage.value === lastFetchedPage.value)) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  isFetching.value = true;

  try {
    const response = await axios.get(
      `/branches?page=${currentPage.value}&search=${finalSearch.value}`,
    );

    branches.value = response.data['branches'];
    // lastFetchedPage.value = currentPage.value; // Сохраняем последнюю загруженную страницу
    // currentPage.value = response.data['meta']['current_page'];
    // totalDatasCount.value = response.data['meta']['total'];
    // totalPage.value = response.data['meta']['total_pages'];
    // rowPerPage.value = response.data['meta']['per_page'];
  } catch (error) {
    console.error('Ошибка загрузки кандидатов:', error);
  } finally {
    isFetching.value = false;
  }
};

// search
const searchElements = async () => {
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
//   const firstIndex = branches.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0;
//   const lastIndex = branches.value.length + (currentPage.value - 1) * rowPerPage.value;

//   return `${firstIndex}-${lastIndex} of ${totalDatasCount.value}`;
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
    await axios.delete('/branches/' + id);
    toast('Успешно удалено', {
      theme: 'auto',
      type: 'success',
      dangerouslyHTMLString: true,
    });
    await fetchData(true);
    isDialogVisible.value = false;
  } catch (error) {
    console.error('Ошибка :', error);
  } finally {
    isDeleting.value = false;
  }
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
            <VSpacer />

            <VCol cols="6" class="app-user-search-filter d-flex align-center">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="searchElements"
                placeholder="Поиск филиала"
                :rules="[]"
                density="compact"
                class="me-6"
              />
              <Can I="add" a="Branch">
                <VBtn @click="isAddNewDrawerVisible = true"> Добавить новый филиал </VBtn>
              </Can>
            </VCol>
          </VCardText>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ИМЯ</th>
                <th>АДРЕС</th>
                <th v-if="can('update', 'Branch') || can('delete', 'Branch')">ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="branch in branches" :key="branch.id">
                <td>{{ branch.id }}</td>
                <td>{{ branch.name }}</td>
                <td class="overflow-hide">
                  {{ branch.address }}
                </td>
                <td class="text-center" style="width: 80px">
                  <Can I="update" a="Branch">
                    <VIcon
                      @click="
                        (event) => {
                          event.stopPropagation();
                          openEditDrawer(branch.id);
                        }
                      "
                      size="30"
                      icon="bx-edit-alt"
                      style="color: rgb(var(--v-global-theme-primary))"
                    ></VIcon>
                  </Can>

                  <Can I="delete" a="Branch">
                    <VIcon
                      size="30"
                      icon="bx-trash"
                      style="color: red"
                      @click="confirmDelete(branch.id, branch.title)"
                    ></VIcon>
                  </Can>
                </td>
              </tr>
            </tbody>

            <Skeleton :count="4" v-show="isFetching && !branches.length" />

            <tfoot v-if="!isFetching && !branches.length">
              <tr>
                <td colspan="7" class="text-center text-body-1">Нет доступных данных</td>
              </tr>
            </tfoot>
          </VTable>

          <VDivider />

          <!-- <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <div class="d-flex align-center" style="width: 300px">
              <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
            </div>

            <VPagination
              v-if="branches.length"
              v-model="currentPage"
              :total-visible="7"
              :length="totalPage"
            />
          </VCardText> -->
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
  </section>
</template>

<style lang="css">
.app-user-search-filter {
  inline-size: 385px;
}

.text-capitalize {
  text-transform: capitalize;
}
</style>
