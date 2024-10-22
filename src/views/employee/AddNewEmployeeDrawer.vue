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

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);

const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const roles_list = ref([]);
const name = ref();
const login = ref();
const password = ref();
const role_id = ref();

// 👉 drawer close
const closeNavigationDrawer = () => {
  nextTick(() => {
    emit('update:isDrawerOpen', false);
    refForm.value?.reset();
    refForm.value?.resetValidation();
  });
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        const response = await axios.post('/users', {
          name: name.value,
          login: login.value,
          password: password.value,
          role_id: role_id.value,
        });

        if (response.status == 201) {
          emit('fetchDatas');

          closeNavigationDrawer();
        }
      } catch (error) {
        if (error.response.data.message == 'The login has already been taken.') {
          toast('Этот логин уже занят.', {
            theme: 'auto',
            type: 'error',
            dangerouslyHTMLString: true,
          });
        } else {
          console.error('Ошибка:', error);
        }
      } finally{
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

const fetchRoles = async function () {
  const r = await axios.get('/roles');
  r.data.roles.filter((e) => e.id != 1);
  roles_list.value = r.data.roles;
};

watchEffect(fetchRoles);
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
    <AppDrawerHeaderSection title="Добавить сотрудника" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->

          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
            :disabled="isFetching"
          >
            <VRow>
              <VCol cols="12">
                <VTextField v-model="name" label="Имя" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="login" label="Логин" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="password" label="Пароль" />
              </VCol>
              <VCol cols="12">
                <VSelect
                  persistent-hint
                  v-model="role_id"
                  label="Выберите роль"
                  :items="roles_list"
                  item-title="name_ru"
                  item-value="id"
                />
              </VCol>

              <!-- 👉 Отправить и отменить -->
              <VCol cols="12">
                <VBtn :loading="isFetching" :disabled="isFetching" type="submit" class="me-3">
                  Отправить
                </VBtn>
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
