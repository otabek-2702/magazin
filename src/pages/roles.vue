<script setup>
import { avatarText } from '@core/utils/formatters';
import { computed, ref, watch, watchEffect } from 'vue';
import axios from '@axios';
import AddNewRoleDrawer from '@/views/role/AddNewRoleDrawer.vue';
import UpdateRoleDrawer from '@/views/role/UpdateRoleDrawer.vue';
import DeleteItemDialog from '@core/components/DeleteItemDialog.vue';
import Skeleton from '@/views/skeleton/Skeleton.vue';
import { toast } from 'vue3-toastify';
import { useAppAbility } from '@/plugins/casl/useAppAbility';

const { can } = useAppAbility();
const searchQuery = ref('');
const finalSearch = ref('');
const isFetching = ref(false);
const rowPerPage = ref(10);
const currentPage = ref(1);
const totalPage = ref(1);
const totalRoles = ref(0);
const roles = ref([]);
const updateID = ref(0);

const fetchData = async () => {
  try {
    isFetching.value = true;
    const roles_r = await axios.get(`/roles?page=${currentPage.value}&search=${finalSearch.value}`);
    roles.value = await roles_r.data['roles'];

    currentPage.value = await roles_r.data['meta']['current_page'];
    totalRoles.value = await roles_r.data['meta']['total'];
    totalPage.value = await roles_r.data['meta']['last_page'];
    rowPerPage.value = await roles_r.data['meta']['per_page'];
  } catch (error) {
    console.error('Ошибка :', error);
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

const resolveUserRoleVariant = (role) => {
  const roleLowerCase = role.toLowerCase();
  if (roleLowerCase === 'subscriber')
    return {
      color: 'primary',
      icon: 'bx-user',
    };
  if (roleLowerCase === 'author')
    return {
      color: 'warning',
      icon: 'bx-cog',
    };
  if (roleLowerCase === 'maintainer')
    return {
      color: 'success',
      icon: 'bx-doughnut-chart',
    };
  if (roleLowerCase === 'editor')
    return {
      color: 'info',
      icon: 'bx-pencil',
    };
  if (roleLowerCase === 'admin')
    return {
      color: 'error',
      icon: 'bx-laptop',
    };

  return {
    color: 'primary',
    icon: 'bx-user',
  };
};

const roleData = ref({
  id: 1,
  name: null,
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
  const firstIndex = roles.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0;
  const lastIndex = roles.value.length + (currentPage.value - 1) * rowPerPage.value;

  return `${firstIndex}-${lastIndex} of ${totalRoles.value}`;
});

// Pages end

// Add
const isAddNewRoleDrawerVisible = ref(false);
const addNewRole = async (roleData) => {
  let { name, name_uz, name_ru, permission } = roleData;
  try {
    await axios.post('/roles', {
      name: name,
      name_uz: name_uz,
      name_ru: name_ru,
      permissions: Array.from(permission),
    });
    await fetchData();
  } catch (error) {
    console.error(error);
  }
};

// Update
const isUpdateRoleDrawerVisible = ref(false);
const updateRole = async (roleData) => {
  let { name, name_uz, name_ru, permission, id } = roleData;
  try {
    await axios.put('/roles/' + id, {
      name: name,
      name_uz: name_uz,
      name_ru: name_ru,
      permissions: Array.from(permission),
    });
    await fetchData();
  } catch (error) {
    console.error(error);
  }
};

const openEditDrawer = function (id) {
  updateID.value = id;
  isUpdateRoleDrawerVisible.value = true;
};

const confirmDelete = function (id, name) {
  roleData.value.id = id;
  roleData.value.name = name;
  isDialogVisible.value = true;
};

const isDialogVisible = ref(false);

const deleteItem = async function (id) {
  try {
    await axios.delete('/roles/' + id);
    toast('Успешно удалено', {
      theme: 'auto',
      type: 'success',
      dangerouslyHTMLString: true,
    });
    await fetchData();
    isDialogVisible.value = false;
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard title="Фильтры поиска">
          <!-- 👉 Search  -->
          <VDivider />

          <VRow class="pa-3 justify-end">
            <VCol cols="6" class="app-user-search-filter gap-3">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="searchElements"
                placeholder="Поиск роли"
                density="compact"
                class="w-100"
              />
              <Can I="add" a="Role">
                <VBtn @click="isAddNewRoleDrawerVisible = true">Добавить новую роль</VBtn>
              </Can>
            </VCol>
          </VRow>

          <VDivider />

          <VTable class="text-no-wrap">
            <!-- 👉 table head -->
            <thead>
              <tr>
                <th scope="col" style="width: 48px">ID</th>
                <th scope="col">ИМЯ</th>
                <th scope="col">ПРАВА</th>
                <th scope="col" v-if="can('update', 'Role') || can('delete', 'Role')">ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <!-- 👉 table body -->
            <tbody>
              <tr v-for="role in roles" :key="role.id">
                <td class="text-capitalize text-high-emphasis">
                  <span class="text-base">{{ role.id }}</span>
                </td>

                <!-- 👉 User -->
                <td>
                  <div class="d-flex align-center">
                    <span class="text-base">{{ role.name_ru }}</span>
                  </div>
                </td>

                <td class="text-capitalize text-high-emphasis">
                  <VRow class="pa-2 gap-2" style="margin: 0 !important">
                    <VChip
                      v-for="permission in role.permissions"
                      color="success"
                      variant="outlined"
                    >
                      {{ permission['name_ru'] }}
                    </VChip>
                  </VRow>
                </td>

                <!-- 👉 Actions -->
                <td class="text-center" style="width: 80px">
                  <div style="cursor: pointer">
                    <Can I="update" a="Role">
                      <VIcon
                        @click="openEditDrawer(role.id)"
                        size="30"
                        icon="bx-edit-alt"
                        style="color: rgb(var(--v-global-theme-primary))"
                      ></VIcon>
                    </Can>

                    <Can I="delete" a="Role">
                      <VIcon
                        size="30"
                        icon="bx-trash"
                        style="color: red"
                        @click="confirmDelete(role.id, role.name_ru)"
                      ></VIcon>
                    </Can>
                  </div>
                </td>
              </tr>
            </tbody>

            <Skeleton :count="4" v-show="isFetching && !roles.length" />

            <!-- 👉 table footer  -->
            <tfoot v-if="isFetching && !roles.length">
              <tr>
                <td colspan="7" class="text-center text-body-1">Нет данных</td>
              </tr>
            </tfoot>
          </VTable>

          <VDivider />

          <!-- SECTION Pagination -->
          <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <!-- 👉 Pagination and pagination meta -->
            <div class="d-flex align-center" v-if="roles.length">
              <h6 class="text-sm font-weight-regular">
                {{ paginationData }}
              </h6>
            </div>
            <VPagination
              v-if="roles.length"
              v-model="currentPage"
              size="small"
              :total-visible="1"
              :length="totalPage"
            />
          </VCardText>
          <!-- !SECTION -->
        </VCard>
      </VCol>
    </VRow>
    <!--     👉 Add New Role -->
    <AddNewRoleDrawer v-model:isDrawerOpen="isAddNewRoleDrawerVisible" @role-data="addNewRole" />
    <UpdateRoleDrawer
      :id="updateID"
      v-model:isDrawerOpen="isUpdateRoleDrawerVisible"
      @role-data="updateRole"
    />
    <DeleteItemDialog
      @confirm="deleteItem"
      :isDialogVisible="isDialogVisible"
      @update:isDialogVisible="isDialogVisible = $event"
      :role="roleData"
    />
  </section>
</template>

<style lang="scss">
.app-user-search-filter {
  display: flex;
  align-items: center;
}
</style>
