<script setup>
import { computed, ref, watch, watchEffect } from 'vue';
import axios from '@axios';
import AddNewDrawer from '@/views/category/AddNewDrawer.vue';
import UpdateDrawer from '@/views/category/UpdateDrawer.vue';
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
const categories = ref([]);
const updateID = ref(0);

const lastFetchedPage = ref(null);

const fetchData = async (force = false) => {
  if (!force && (isFetching.value || currentPage.value === lastFetchedPage.value)) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  isFetching.value = true;

  try {
    const response = await axios.get(
      `/categories?page=${currentPage.value}&search=${finalSearch.value}`,
    );

    categories.value = response.data['categories'];
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
//   const firstIndex = categories.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0;
//   const lastIndex = categories.value.length + (currentPage.value - 1) * rowPerPage.value;

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
    await axios.delete('/categories/' + id);
    toast('Успешно удалено', {
      
      type: 'success',
      
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
                placeholder="Поиск категории"
                :rules="[]"
                density="compact"
                class="me-6"
              />
              <Can I="add" a="Category">
                <VBtn @click="isAddNewDrawerVisible = true"> Добавить новую категорию </VBtn>
              </Can>
            </VCol>
          </VCardText>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ИМЯ</th>
                <th>ОПИСАНИЕ</th>
                <th v-if="can('update', 'Category') || can('delete', 'Category')">ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="category in categories" :key="category.id">
                <td>{{ category.id }}</td>
                <td>{{ category.name }}</td>
                <td class="overflow-hide">
                  {{ category.description }} 
                </td>
                <td class="text-center" style="width: 80px">
                  <Can I="update" a="Category">
                    <VIcon
                      @click="
                        (event) => {
                          event.stopPropagation();
                          openEditDrawer(category.id);
                        }
                      "
                      size="30"
                      icon="bx-edit-alt"
                      style="color: rgb(var(--v-global-theme-primary))"
                    ></VIcon>
                  </Can>

                  <Can I="delete" a="Category">
                    <VIcon
                      size="30"
                      icon="bx-trash"
                      style="color: red"
                      @click="confirmDelete(category.id, category.title)"
                    ></VIcon>
                  </Can>
                </td>
              </tr>
            </tbody>

            <Skeleton :count="4" v-show="isFetching && !categories.length" />

            <tfoot v-if="!isFetching && !categories.length">
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
              v-if="categories.length"
              v-model="currentPage"
              
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
