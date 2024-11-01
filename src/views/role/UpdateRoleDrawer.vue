<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref, watch, watchEffect } from 'vue';
import AppDrawerHeaderSection from '@core/components/AppDrawerHeaderSection.vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  id: {
    required: true,
  },
});

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);

const isFetching = ref(false);
const isFetchingStart = ref(true);
const isFormValid = ref(false);
const refForm = ref();
const role_id = ref();
const name = ref();
const name_uz = ref();
const name_ru = ref();
const permission = ref();
const permissions = ref([]);

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        const response = await axios.patch(`/roles/${props.id}`, {
          name: name.value,
          name_uz: name_uz.value,
          name_ru: name_ru.value,
          permissions: Array.from(permission.value),
        });
        if (response.status == 200) {
          emit('fetchDatas');
          toast('Успешно', {
            
            type: 'success',
            
          });
          handleDrawerUpdate(false);
        }
      } catch (error) {
        console.error('Ошибка:', error);
      } finally {
        isFetching.value = false;
      }
    }
  });
};

const handleDrawerUpdate = (val) => {
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

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const { data } = await axios.get(`/roles/${props.id}`);

    role_id.value = data.id;
    name_ru.value = data.name_ru;
    name.value = data.name;
    name_uz.value = data.name_ru;
    permission.value = data.permissions.map((permission) => permission.id);
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    isFetchingStart.value = false;
  }
};

watch(
  () => props.isDrawerOpen,
  (newVal) => newVal && fetchDataById(),
);
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerUpdate"
  >
    <!-- 👉 Заголовок -->
    <AppDrawerHeaderSection title="Редактировать роль" @cancel="handleDrawerUpdate(false)" />

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

              <!-- 👉 Полное имя -->
              <VCol cols="12">
                <VTextField v-model="name_ru" label="Имя (рус.)" />
              </VCol>

              <!-- 👉 Роль -->
              <VCol cols="12" v-if="role_id != 1">
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
                <VBtn :loading="isFetching" :disabled="isFetching" type="submit" class="me-3">
                  Отправить
                </VBtn>
                <VBtn
                  type="reset"
                  variant="tonal"
                  color="secondary"
                  @click="handleDrawerUpdate(false)"
                >
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
