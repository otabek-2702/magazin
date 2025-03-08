<script setup>
import { ref } from "vue";
import axios from "@axios";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import DeleteItemDialog from "@/@core/components/DeleteItemDialog.vue";
import { toast } from "vue3-toastify";
import { useFetch } from "@/hooks/useFetch";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const { can } = useAppAbility();

const isFetching = ref(false);
const editingId = ref(null);
const isDialogVisible = ref(false);
const isDeleting = ref(false);
const deleteData = ref({ id: null, name: null });

const {
  state,
  items: sizes,
  totalPages: totalPage,
  paginationData,
  fetchData,
  handleSearch,
  searchQuery,
  isFetching: isFetchingStart,
} = useFetch({
  baseUrl: "sizes",
});

// Add
const onAddSubmit = async () => {
  try {
    isFetching.value = true;
    await axios.post("/sizes", {
      name: searchQuery.value,
    });
    fetchData(true);

    toast("Успешно добавлено", {
      type: "success",
    });
    searchQuery.value = null;
  } catch (error) {
    console.error(error);
  } finally {
    isFetching.value = false;
  }
};

// Edit
const showEditInput = (id) => {
  editingId.value = id;
};

const hideEditInput = async (size) => {
  if (editingId.value === size.id) {
    try {
      await axios.put(`/sizes/${size.id}`, { name: size.name });
      await fetchData(true);
      toast("Успешно обновлено", { type: "success" });
    } catch (error) {
      console.error("Ошибка при обновлении размера:", error);
      toast("Ошибка при обновлении", { type: "error" });
    }
  }
  editingId.value = null;
};

// Delete
const confirmDelete = (id, name) => {
  deleteData.value = { id, name };
  isDialogVisible.value = true;
};

const deleteItem = async (id) => {
  try {
    isDeleting.value = true;
    await axios.delete(`/sizes/${id}`);
    toast("Успешно удалено", { type: "success" });
    await fetchData(true);
  } catch (error) {
    console.error("Ошибка при удалении:", error);
    toast("Ошибка при удалении", { type: "error" });
  } finally {
    isDeleting.value = false;
    isDialogVisible.value = false;
  }
};
</script>
<template>
  <VCard title="Размеры">
    <DeleteItemDialog
      @confirm="deleteItem"
      :isDialogVisible="isDialogVisible"
      @update:isDialogVisible="isDialogVisible = $event"
      :role="deleteData"
      :isDeleting="isDeleting"
    />
    <VCardText class="d-flex flex-wrap">
      <VSpacer />
      <VCol cols="8">
        <VTextField
          @keyup.enter="handleSearch"
          :disabled="isFetching"
          label="Имя"
          v-model="searchQuery"
          density="compact"
          :rules="[]"
        />
      </VCol>
      <VCol cols="4" class="app-user-search-filter d-flex align-center">
        <Can I="create" a="Size">
          <VBtn :disabled="isFetching" :loader="isFetching" @click="onAddSubmit"
            >Добавить</VBtn
          >
        </Can>
      </VCol>
    </VCardText>

    <VDivider />

    <VTable>
      <thead>
        <tr>
          <th data-column="id">ID</th>
          <th>ИМЯ</th>
          <th
            data-column="actions"
            v-if="can('update', 'Size') || can('delete', 'Size')"
          >
            ДЕЙСТВИЯ
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="size in sizes" :key="size.id" :style="{ cursor: 'pointer' }">
          <td>{{ size.id }}</td>
          <td>
            <VTextField
              v-model="size.name"
              :readonly="editingId !== size.id"
              @blur="hideEditInput(size)"
              :class="{ 'text-input': editingId !== size.id }"
              class="custom-input"
              density="compact"
            />
          </td>
          <td data-column="actions">
            <Can I="update" a="Size">
              <VIcon
                @click.stop="showEditInput(size.id)"
                size="30"
                icon="bx-edit-alt"
                color="primary"
                class="mx-2"
              />
            </Can>
            <Can I="delete" a="Size">
              <VIcon
                size="30"
                icon="bx-trash"
                color="error"
                @click.stop="confirmDelete(size.id, size.name)"
              />
            </Can>
          </td>
        </tr>
      </tbody>
      <Skeleton :count="3" v-if="isFetchingStart && !sizes.length" />

      <tfoot v-if="!isFetchingStart && !sizes.length">
        <tr>
          <td colspan="3" class="text-center text-body-1">
            Нет доступных данных
          </td>
        </tr>
      </tfoot>
    </VTable>

    <!-- SECTION Pagination -->
    <VDivider />

    <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
      <div class="d-flex align-center" style="width: 300px">
        <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
      </div>

      <VPagination
        v-if="sizes.length"
        v-model="state.currentPage"
        :length="totalPage"
      />
    </VCardText>
  </VCard>
</template>
<style scoped>
.app-user-search-filter {
  inline-size: 385px;
}

.text-input {
  background-color: transparent !important;
}

.text-input :deep(.v-field__outline) {
  opacity: 0 !important;
}

.text-input :deep(.v-field__input) {
  padding-inline-start: 0 !important;
  padding-inline-end: 0 !important;
}

.text-input :deep(.v-label) {
  opacity: 0 !important;
}

.custom-input {
  margin: 1px;
}
</style>
