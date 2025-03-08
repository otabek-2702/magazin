<script setup>
import { computed, ref, watch, watchEffect } from "vue";
import axios from "@axios";
import AddNewUserDrawer from "@/views/user/AddNewUserDrawer.vue";
import UpdateUserDrawer from "@/views/user/UpdateUserDrawer.vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import DeleteItemDialog from "@/@core/components/DeleteItemDialog.vue";
import { toast } from "vue3-toastify";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const { can } = useAppAbility();
const searchQuery = ref("");
const finalSearch = ref("");
const rowPerPage = ref(10);
const currentPage = ref(1);
const totalPage = ref(1);
const totalUsers = ref(0);
const users = ref([]);
const updateID = ref(0);

const lastFetchedPage = ref(null);
const isFetching = ref(false);

const fetchData = async (force = false) => {
  if (
    !force &&
    (isFetching.value || currentPage.value === lastFetchedPage.value)
  ) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  isFetching.value = true;
  users.value = [];
  try {
    const users_r = await axios.get(
      `/users?page=${currentPage.value}&search=${finalSearch.value}`
    );

    users.value = users_r.data["users"];
    lastFetchedPage.value = currentPage.value; // Сохраняем последнюю загруженную страницу
    currentPage.value = users_r.data["meta"]["current_page"];
    totalUsers.value = users_r.data["meta"]["total"];
    totalPage.value = users_r.data["meta"]["last_page"];
    rowPerPage.value = users_r.data["meta"]["per_page"];
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
  const firstIndex = users.value.length
    ? (currentPage.value - 1) * rowPerPage.value + 1
    : 0;
  const lastIndex =
    users.value.length + (currentPage.value - 1) * rowPerPage.value;

  return `${firstIndex}-${lastIndex} of ${totalUsers.value}`;
});

// Pages end

const openEditDrawer = (id) => {
  updateID.value = id;
  isUpdateUserDrawerVisible.value = true;
};

const isAddNewDrawerVisible = ref(false);
const isUpdateUserDrawerVisible = ref(false);

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
    await axios.delete("/users/" + id);
    toast("Успешно удалено", {
      type: "success",
    });
    fetchData(true);
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
    <VCard>
      <!-- 👉 Head -->
      <VCardItem>
        <VRow>
          <VCol cols="auto">
            <VCardTitle class="pa-0"> Сотрудники </VCardTitle>
          </VCol>
          <VSpacer />

          <!-- 👉 Search  -->
          <VCol cols="12" sm="3">
            <VTextField
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              placeholder="Поиск сотрудника"
              :rules="[]"
              density="compact"
            />
          </VCol>
          <VCol cols="auto">
            <Can I="create" a="User">
              <VBtn @click="isAddNewDrawerVisible = true"
                >Добавить нового сотрудника</VBtn
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
            <th>ФИО</th>
            <th>ЛОГИН</th>
            <th>РОЛЬ</th>
            <th
              data-column="actions"
              v-if="can('update', 'User') || can('delete', 'User')"
            >
              ДЕЙСТВИЯ
            </th>
          </tr>
        </thead>

        <!-- 👉 Table body -->
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.login }}</td>
            <td>{{ user.role.name_ru }}</td>
            <td data-column="actions">
              <Can I="update" a="User">
                <VIcon
                  @click.stop="openEditDrawer(user.id)"
                  size="30"
                  icon="bx-edit-alt"
                  color="primary"
                ></VIcon>
              </Can>
              <Can I="delete" a="User">
                <VIcon
                  size="30"
                  icon="bx-trash"
                  color="error"
                  @click="confirmDelete(user.id, user.name)"
                ></VIcon>
              </Can>
            </td>
          </tr>
        </tbody>

        <Skeleton :count="4" v-show="isFetching && !users.length" />

        <tfoot v-if="!isFetching && !users.length">
          <tr>
            <td colspan="7" class="text-center text-body-1">
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
          v-if="users.length"
          v-model="currentPage"
          :length="totalPage"
        />
      </VCardText>
    </VCard>
    <Can I="create" a="User">
      <AddNewUserDrawer
        v-model:isDrawerOpen="isAddNewDrawerVisible"
        @fetchDatas="() => fetchData(true)"
      />
    </Can>
    <Can I="update" a="User">
      <UpdateUserDrawer
        :id="updateID"
        v-model:isDrawerOpen="isUpdateUserDrawerVisible"
        @fetchDatas="() => fetchData(true)"
      />
    </Can>
    <DeleteItemDialog
      @confirm="deleteItem"
      :isDialogVisible="isDialogVisible"
      @update:isDialogVisible="isDialogVisible = $event"
      :role="deleteData"
      :isDeleting="isDeleting"
    />
  </section>
</template>

<style lang="scss"></style>
