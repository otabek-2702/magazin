<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref, watchEffect } from 'vue';
import AppDrawerHeaderSection from '@core/components/AppDrawerHeaderSection.vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
});

const permissions = ref([]);

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);

const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const name = ref();
const name_uz = ref();
const name_ru = ref();
const permission = ref();

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post('/roles', {
          name: name.value,
          name_uz: name_uz.value,
          name_ru: name_ru.value,
          permissions: Array.from(permission.value),
        });
        emit('fetchDatas');
        toast('Успешно добавлено', {
          
          type: 'success',
          
        });
        handleDrawerModelValueUpdate(false);
      } catch (error) {
        console.error(error);
      } finally {
        isFetching.value = false;
      }
    }
  });
};

const handleDrawerModelValueUpdate = (val) => {
  emit('update:isDrawerOpen', val);
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

const fetchPermissions = async function () {
  const r = await axios.get('/permissions/all');
  permissions.value = r.data['permissions'];
};

watchEffect(fetchPermissions);
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Заголовок -->
    <AppDrawerHeaderSection title="Добавить роль" @cancel="handleDrawerModelValueUpdate(false)" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VTextField v-model="name" label="Имя" autofocus />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="name_uz" label="Имя (узб.)" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="name_ru" label="Имя (рус.)" />
              </VCol>

              <!-- 👉 Роль -->
              <VCol cols="12">
                <VSelect
                  multiple
                  persistent-hint
                  v-model="permission"
                  label="Выберите разрешение"
                  :items="permissions"
                  item-title="name_ru"
                  item-value="id"
                />
              </VCol>

              <!-- 👉 Отправить и Отмена -->
              <VCol cols="12">
                <VBtn type="submit" class="me-3"> Отправить </VBtn>
                <VBtn type="reset" variant="tonal" color="secondary" @click="handleDrawerModelValueUpdate(false)">
                  Отмена
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
