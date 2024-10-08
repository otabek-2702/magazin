<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { requiredValidator } from '@validators';
import { nextTick, ref, watch, watchEffect } from 'vue';
import AppDrawerHeaderSection from '@core/components/AppDrawerHeaderSection.vue';
import axios from '@axios';

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  id: {
    required: true,
  },
});

const permissions = ref([]);

const emit = defineEmits(['update:isDrawerOpen', 'roleData']);

const isFormValid = ref(false);
const refForm = ref();
const role_id = ref();
const name = ref();
const name_uz = ref();
const name_ru = ref();
const permission = ref();

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false);
  props.id = 0;
  nextTick(() => {
    refForm.value?.reset();
    refForm.value?.resetValidation();
  });
};

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      emit('roleData', {
        id: props.id,
        name: name.value,
        name_uz: name_uz.value,
        name_ru: name_ru.value,
        permission: permission.value,
      });
      emit('update:isDrawerOpen', false);
      nextTick(() => {
        refForm.value?.reset();
        refForm.value?.resetValidation();
      });
    }
  });
};

const handleDrawerModelValueUpdate = (val) => {
  emit('update:isDrawerOpen', val);
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
    });
  }
};

const fetchPermissions = async function () {
  const r = await axios.get('/permissions/all');
  permissions.value = r.data['permissions'];
};

watchEffect(fetchPermissions);

watch(
  () => props.isDrawerOpen,
  async (newVal) => {
    if (newVal) {
      let role = await axios.get('/roles/' + props.id);

      role_id.value = role.data.id;
      name_ru.value = role.data.name_ru;
      name.value = role.data.name;
      name_uz.value = role.data.name_ru;

      permission.value = role.data.permissions.map((permission) => permission.id);
    }
  },
);
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
    <AppDrawerHeaderSection title="Редактировать роль" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VTextField v-model="name" :rules="[requiredValidator]" label="Имя" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="name_uz" :rules="[requiredValidator]" label="Имя (узб.)" />
              </VCol>

              <!-- 👉 Полное имя -->
              <VCol cols="12">
                <VTextField v-model="name_ru" :rules="[requiredValidator]" label="Имя (рус.)" />
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
                <VBtn type="submit" class="me-3"> Отправить </VBtn>
                <VBtn type="reset" variant="tonal" color="secondary" @click="closeNavigationDrawer">
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
