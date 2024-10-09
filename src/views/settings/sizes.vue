<script setup>
import { ref, onMounted } from 'vue';
import axios from '@axios';
import Skeleton from '@/views/skeleton/Skeleton.vue';
import DeleteItemDialog from '@/@core/components/DeleteItemDialog.vue';
import { toast } from 'vue3-toastify';
import { requiredValidator } from '@/@core/utils/validators';

const sizes = ref([]);
const isFetchingStart = ref(false);
const isFetching = ref(false);
const finalSearch = ref('');
const newElemName = ref();
const editingId = ref(null);
const isDialogVisible = ref(false);
const isDeleting = ref(false);
const deleteData = ref({ id: null, name: null });

const fetchData = async (force = false) => {
  if (!force && isFetchingStart.value) return;

  try {
    isFetchingStart.value = true;
    const { data } = await axios.get(`/sizes?search=${finalSearch.value}`);
    sizes.value = data['sizes'];
  } catch (error) {
    console.error('Ошибка загрузки размеров:', error);
  } finally {
    isFetchingStart.value = false;
  }
};

// Add
const onAddSubmit = async () => {
  isFetching.value = true;
  try {
    await axios.post('/sizes', {
      name: newElemName.value,
    });
    fetchData(true);

    toast('Успешно добавлено', {
      theme: 'auto',
      type: 'success',
      dangerouslyHTMLString: true,
    });
    finalSearch.value = '';
    newElemName.value = null;
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
      toast('Успешно обновлено', { type: 'success' });
    } catch (error) {
      console.error('Ошибка при обновлении размера:', error);
      toast('Ошибка при обновлении', { type: 'error' });
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
    toast('Успешно удалено', { type: 'success' });
    await fetchData(true);
  } catch (error) {
    console.error('Ошибка при удалении:', error);
    toast('Ошибка при удалении', { type: 'error' });
  } finally {
    isDeleting.value = false;
    isDialogVisible.value = false;
  }
};

// search
const searchElements = async () => {
  finalSearch.value = newElemName.value;
  fetchData(true);
};

watch(newElemName, (newVal) => {
  if (!newVal) {
    finalSearch.value = '';
    fetchData(true);
  }
});

onMounted(fetchData);
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
          @keyup.enter="searchElements"
          :disabled="isFetching"
          label="Имя"
          v-model="newElemName"
          density="compact"
        />
      </VCol>
      <VCol cols="4" class="app-user-search-filter d-flex align-center">
        <Can I="add" a="Sizes">
          <VBtn :disabled="isFetching" :loader="isFetching" @click="onAddSubmit">Добавить</VBtn>
        </Can>
      </VCol>
    </VCardText>

    <VDivider />

    <VTable class="text-no-wrap">
      <thead>
        <tr>
          <th style="width: 48px">ID</th>
          <th>ИМЯ</th>
          <th>ДЕЙСТВИЯ</th>
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
          <td class="text-center" :style="{ width: '80px', zIndex: '10' }">
            <Can I="update" a="Sizes">
              <VIcon
                @click.stop="showEditInput(size.id)"
                size="30"
                icon="bx-edit-alt"
                style="color: rgb(var(--v-global-theme-primary))"
                class="mx-2"
              />
            </Can>
            <Can I="delete" a="Size">
              <VIcon
                size="30"
                icon="bx-trash"
                style="color: red"
                @click.stop="confirmDelete(size.id, size.name)"
              />
            </Can>
          </td>
        </tr>
      </tbody>
      <Skeleton :count="3" v-if="isFetchingStart && !sizes.length" />

      <tfoot v-if="!isFetchingStart && !sizes.length">
        <tr>
          <td colspan="3" class="text-center text-body-1">Нет доступных данных</td>
        </tr>
      </tfoot>
    </VTable>

    <VDivider />
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
