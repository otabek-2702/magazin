<script setup>
import { computed, ref, watch, watchEffect } from "vue";
import axios from "@axios";
import AddNewRoleDrawer from "@/views/role/AddNewRoleDrawer.vue";
import UpdateRoleDrawer from "@/views/role/UpdateRoleDrawer.vue";
import DeleteItemDialog from "@core/components/DeleteItemDialog.vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { toast } from "vue3-toastify";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const { can } = useAppAbility();
const searchQuery = ref("");
const finalSearch = ref("");
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
    roles.value = [];
    const roles_r = await axios.get(
      `/roles?page=${currentPage.value}&search=${finalSearch.value}`
    );
    roles.value = await roles_r.data["roles"];

    currentPage.value = await roles_r.data["meta"]["current_page"];
    totalRoles.value = await roles_r.data["meta"]["total"];
    totalPage.value = await roles_r.data["meta"]["last_page"];
    rowPerPage.value = await roles_r.data["meta"]["per_page"];
  } catch (error) {
    console.error("Ошибка :", error);
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

// const resolveUserRoleVariant = (role) => {
//   const roleLowerCase = role.toLowerCase();
//   if (roleLowerCase === 'subscriber')
//     return {
//       color: 'primary',
//       icon: 'bx-user',
//     };
//   if (roleLowerCase === 'author')
//     return {
//       color: 'warning',
//       icon: 'bx-cog',
//     };
//   if (roleLowerCase === 'maintainer')
//     return {
//       color: 'success',
//       icon: 'bx-doughnut-chart',
//     };
//   if (roleLowerCase === 'editor')
//     return {
//       color: 'info',
//       icon: 'bx-pencil',
//     };
//   if (roleLowerCase === 'admin')
//     return {
//       color: 'error',
//       icon: 'bx-laptop',
//     };

//   return {
//     color: 'primary',
//     icon: 'bx-user',
//   };
// };

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
  const firstIndex = roles.value.length
    ? (currentPage.value - 1) * rowPerPage.value + 1
    : 0;
  const lastIndex =
    roles.value.length + (currentPage.value - 1) * rowPerPage.value;

  return `${firstIndex}-${lastIndex} of ${totalRoles.value}`;
});

// Pages end

// Add
const isAddNewDrawerVisible = ref(false);

// Update
const isUpdateRoleDrawerVisible = ref(false);
const updateRole = async (roleData) => {
  let { name, name_uz, name_ru, permission, id } = roleData;
  try {
    await axios.put("/roles/" + id, {
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
    await axios.delete("/roles/" + id);
    toast("Успешно удалено", {
      type: "success",
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
    <VCard>
      <!-- 👉 Head -->
      <VCardItem>
        <VRow>
          <VCol cols="auto">
            <VCardTitle class="pa-0"> Роли </VCardTitle>
          </VCol>
          <VSpacer />

          <!-- 👉 Search  -->
          <VCol cols="12" sm="3">
            <VTextField
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              placeholder="Поиск роли"
              :rules="[]"
              density="compact"
            />
          </VCol>
          <VCol cols="auto">
            <Can I="create" a="Role">
              <VBtn @click="isAddNewDrawerVisible = true"
                >Добавить новую роль</VBtn
              >
            </Can>
          </VCol>
        </VRow>
      </VCardItem>

      <VDivider />

      <VTable>
        <!-- 👉 Table Head -->
        <thead>
          <tr>
            <th data-column="id">ID</th>
            <th>ИМЯ</th>
            <th>ПРАВА</th>
            <th
              data-column="actions"
              v-if="can('update', 'Role') || can('delete', 'Role')"
            >
              ДЕЙСТВИЯ
            </th>
          </tr>
        </thead>

        <!-- 👉 Table body -->
        <tbody>
          <tr v-for="role in roles" :key="role.id">
            <td>{{ role.id }}</td>

            <td>
              <div>{{ role.name_ru }}</div>
            </td>

            <td>
              <VRow class="pa-2 gap-2 ma-0">
                <VChip
                  v-for="permission in role.permissions"
                  color="success"
                  variant="outlined"
                >
                  {{ permission.name_ru }}
                </VChip>
              </VRow>
            </td>

            <!-- 👉 Actions -->
            <td data-column="actions">
              <Can I="update" a="Role">
                <VIcon
                  @click="openEditDrawer(role.id)"
                  size="30"
                  icon="bx-edit-alt"
                  color="primary"
                ></VIcon>
              </Can>

              <Can I="delete" a="Role">
                <VIcon
                  size="30"
                  icon="bx-trash"
                  color="error"
                  @click="confirmDelete(role.id, role.name_ru)"
                ></VIcon>
              </Can>
            </td>
          </tr>
        </tbody>

        <Skeleton :count="4" v-show="isFetching && !roles.length" />

        <!-- 👉 table footer  -->
        <tfoot v-if="!isFetching && !roles.length">
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
          :length="totalPage"
        />
      </VCardText>
    </VCard>

    <!--     👉 Add New Role -->
    <Can I="create" a="Role">
      <AddNewRoleDrawer
        v-model:isDrawerOpen="isAddNewDrawerVisible"
        @fetchDatas="() => fetchData(true)"
      />
    </Can>

    <Can I="update" a="Role">
      <UpdateRoleDrawer
        :id="updateID"
        v-model:isDrawerOpen="isUpdateRoleDrawerVisible"
        @fetchDatas="() => fetchData(true)"
        @role-data="updateRole"
      />
    </Can>

    <DeleteItemDialog
      @confirm="deleteItem"
      :isDialogVisible="isDialogVisible"
      @update:isDialogVisible="isDialogVisible = $event"
      :role="roleData"
    />
  </section>
</template>

<style lang="scss"></style>
