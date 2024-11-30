<script setup>
import { computed, ref, watch, watchEffect } from 'vue';
import axios from '@axios';
import AddNewEmployeeDrawer from '@/views/employee/AddNewEmployeeDrawer.vue';
import UpdateEmployeeDrawer from '@/views/employee/UpdateEmployeeDrawer.vue';
import Skeleton from '@/views/skeleton/Skeleton.vue';
import DeleteItemDialog from '@/@core/components/DeleteItemDialog.vue';
import { toast } from 'vue3-toastify';
import { useAppAbility } from '@/plugins/casl/useAppAbility';

const { can } = useAppAbility();
const searchQuery = ref('');
const finalSearch = ref('');
const rowPerPage = ref(10);
const currentPage = ref(1);
const totalPage = ref(1);
const totalEmployees = ref(0);
const employees = ref([]);
const updateID = ref(0);

const lastFetchedPage = ref(null);
const isFetching = ref(false);

const fetchData = async (force = false) => {
  if (!force && (isFetching.value || currentPage.value === lastFetchedPage.value)) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  isFetching.value = true;

  try {
    const employees_r = await axios.get(
      `/users?page=${currentPage.value}&search=${finalSearch.value}`,
    );

    employees.value = employees_r.data['users'];
    lastFetchedPage.value = currentPage.value; // Сохраняем последнюю загруженную страницу
    currentPage.value = employees_r.data['meta']['current_page'];
    totalEmployees.value = employees_r.data['meta']['total'];
    totalPage.value = employees_r.data['meta']['last_page'];
    rowPerPage.value = employees_r.data['meta']['per_page'];
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
  const firstIndex = employees.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0;
  const lastIndex = employees.value.length + (currentPage.value - 1) * rowPerPage.value;

  return `${firstIndex}-${lastIndex} of ${totalEmployees.value}`;
});

// Pages end

const openEditDrawer = (id) => {
  updateID.value = id;
  isUpdateEmployeeDrawerVisible.value = true;
};

const isAddNewEmployeeDrawerVisible = ref(false);
const isUpdateEmployeeDrawerVisible = ref(false);

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
    await axios.delete('/users/' + id);
    toast('Успешно удалено', {
      
      type: 'success',
      
    });
    fetchData(true);
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
          <VDivider />

          <VRow class="pa-3 justify-end">
            <VCol cols="6" class="app-user-search-filter d-flex align-center">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="searchElements"
                placeholder="Поиск сотрудника"
                :rules="[]"
                density="compact"
                class="me-6"
              />
              <Can I="add" a="User">
                <VBtn @click="isAddNewEmployeeDrawerVisible = true"
                  >Добавить нового сотрудника</VBtn
                >
              </Can>
            </VCol>
          </VRow>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ФИО</th>
                <th>Логин</th>
                <th v-if="can('update', 'User') || can('delete', 'User')">Действия</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="employee in employees" :key="employee.id">
                <td>{{ employee.id }}</td>
                <td>{{ employee.name }}</td>
                <td>{{ employee.login }}</td>
                <td class="text-center" style="width: 80px">
                  <Can I="update" a="User">
                    <VIcon
                      @click="
                        (event) => {
                          event.stopPropagation();
                          openEditDrawer(employee.id);
                        }
                      "
                      size="30"
                      icon="bx-edit-alt"
                      style="color: rgb(var(--v-global-theme-primary))"
                    ></VIcon>
                  </Can>
                  <Can I="delete" a="User">
                    <VIcon
                      size="30"
                      icon="bx-trash"
                      style="color: red"
                      @click="confirmDelete(employee.id, employee.name)"
                    ></VIcon>
                  </Can>
                </td>
              </tr>
            </tbody>

            <Skeleton :count="4" v-show="isFetching && !employees.length" />

            <tfoot v-if="!isFetching && !employees.length">
              <tr>
                <td colspan="7" class="text-center text-body-1">Нет доступных данных</td>
              </tr>
            </tfoot>
          </VTable>

          <VDivider />

          <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <div class="d-flex align-center" style="width: 300px">
              <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
            </div>

            <VPagination
              v-if="employees.length"
              v-model="currentPage"
              
              :length="totalPage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <AddNewEmployeeDrawer
      v-model:isDrawerOpen="isAddNewEmployeeDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />
    <UpdateEmployeeDrawer
      :id="updateID"
      v-model:isDrawerOpen="isUpdateEmployeeDrawerVisible"
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
