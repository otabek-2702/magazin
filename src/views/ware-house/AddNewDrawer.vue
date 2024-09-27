<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { requiredValidator } from '@validators';
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

const languages_list = ref([]);

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);

const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const full_name = ref();
const phone_number = ref();
const age = ref();
const address = ref();
const gender = ref('man');
const positive_skills = ref();
const apps_text = ref();
const apps = ref();
const languages = ref();

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false);
  nextTick(() => {
    refForm.value?.reset();
    refForm.value?.resetValidation();
  });
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post('/candidates', {
          full_name: full_name.value,
          age: age.value,
          languages: Array.from(languages.value),
          positive_skills: positive_skills.value,
          apps_text: apps_text.value,
          apps: apps.value,
          gender: gender.value,
          phone_number: phone_number.value,
          address: address.value,
        });
        emit('fetchDatas');
        toast('Успешно добавлено', {
          theme: 'auto',
          type: 'success',
          dangerouslyHTMLString: true,
        });
        emit('update:isDrawerOpen', false);
        nextTick(() => {
          refForm.value?.reset();
          refForm.value?.resetValidation();
        });
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

const fetchLanguages = async function () {
  try {
    const response = await axios.get('/languages');
    languages_list.value = response.data;
  } catch (error) {
    console.error('Ошибка :', error);
  }
};

watchEffect(fetchLanguages);
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
    <AppDrawerHeaderSection title="Изменить" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <!-- 👉 Полное имя -->
              <VCol cols="12">
                <VTextField v-model="full_name" :rules="[requiredValidator]" label="Полное имя" />
              </VCol>

              <!-- 👉 Номер телефона -->
              <VCol cols="12">
                <VTextField
                  v-model="phone_number"
                  :rules="[requiredValidator]"
                  label="Номер телефона"
                />
              </VCol>

              <VCol cols="12">
                <VTextField type="number" v-model="age" :rules="[requiredValidator]" label="Возраст" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="address" :rules="[requiredValidator]" label="Адрес" />
              </VCol>

              <VCol cols="12">
                <VRadioGroup v-model="gender" inline :rules="[requiredValidator]">
                  <VRadio label="Мужчина" value="man" density="compact" />
                  <VRadio label="Женщина" value="woman" density="compact" />
                </VRadioGroup>
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="positive_skills"
                  :rules="[requiredValidator]"
                  label="Положительные навыки"
                />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="apps_text" :rules="[requiredValidator]" label="Текст приложений" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="apps" :rules="[requiredValidator]" label="Приложения" />
              </VCol>

              <VCol cols="12">
                <VSelect
                  multiple
                  persistent-hint
                  v-model="languages"
                  label="Выберите язык"
                  :rules="[requiredValidator]"
                  :items="languages_list"
                  item-title="name_ru"
                  item-value="id"
                />
              </VCol>

              <!-- 👉 Отправить и Отмена -->
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

