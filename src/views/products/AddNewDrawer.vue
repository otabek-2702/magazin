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

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);

const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const name = ref();
const brand = ref();
const supplier_id = ref();
const category_id = ref();
const season = ref('fall');
const gender = ref('man');

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
        await axios.post('/products', {
          name: name.value,
          brand: brand.value,
          supplier_id: supplier_id.value,
          category_id: category_id.value,
          season: season.value,
          gender: gender.value,
        });
        emit('fetchDatas');
        toast('Успешно добавлено', {
          theme: 'auto',
          type: 'success',
          dangerouslyHTMLString: true,
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

const categories_list = ref([]);
const fetchCategories = async () => {
  try {
    const response = await axios.get('/categories');

    if (response.status === 200) {
      categories_list.value = response.data.categories;
    }
  } catch (error) {
    console.log(error);
  }
};

const suppliers_list = ref([]);
const fetchSuppliers = async () => {
  try {
    const response = await axios.get('/suppliers');

    if (response.status === 200) {
      suppliers_list.value = response.data.suppliers;
    }
  } catch (error) {
    console.log(error);
  }
};

watch(
  () => props.isDrawerOpen,
  () => {
    fetchCategories();
    fetchSuppliers();
  },
  { once: true },
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
    <AppDrawerHeaderSection title="Добавить" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <!-- 👉 Полное имя -->
              <VCol cols="12">
                <VTextField v-model="name" :rules="[requiredValidator]" label="Имя" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="brand" :rules="[requiredValidator]" label="Брэнд" />
              </VCol>

              <VCol cols="12">
                <VSelect
                  no-data-text="Нет данных"
                  v-model="supplier_id"
                  label="Выберите поставщика"
                  :items="suppliers_list"
                  item-title="name"
                  item-value="id"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  no-data-text="Нет данных"
                  v-model="category_id"
                  label="Выберите категорию"
                  :items="categories_list"
                  item-title="name"
                  item-value="id"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <VRadioGroup v-model="season" inline :rules="[requiredValidator]">
                  <VRadio label="Весенняя" value="spring" density="compact" color="success" />
                  <VRadio label="Осенняя" value="fall" density="compact" color="warning" />
                </VRadioGroup>
              </VCol>

              <VCol cols="12">
                <VRadioGroup v-model="gender" inline :rules="[requiredValidator]">
                  <VRadio label="Мужской" value="man" density="compact" />
                  <VRadio label="Женский" value="woman" density="compact" />
                  <VRadio label="Универсальный" value="unisex" density="compact" />
                </VRadioGroup>
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="sale"
                  :rules="[requiredValidator]"
                  label="Скидка в процентах"
                  type="number"
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
