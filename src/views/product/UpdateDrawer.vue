<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref, watch } from 'vue';
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

const isFormValid = ref(false);
const isFetching = ref(false);
const isFetchingStart = ref(true);
const refForm = ref();
const name = ref();
const brand = ref();
const supplier_id = ref();
const category_id = ref();
const season = ref('fall');
const gender = ref('man');
const profit_percent = ref();
const sale = ref(0);

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
        await axios.put(`/products/${props.id}`, {
          name: name.value,
          brand: brand.value,
          supplier_id: supplier_id.value,
          category_id: category_id.value,
          season: season.value,
          gender: gender.value,
          profit_percent: profit_percent.value,
          sale: sale.value,
        });

        toast('Успешно', {
          
          type: 'success',
          
        });
        // Убедитесь, что fetch вызывается только после успешного обновления
        emit('fetchDatas');
        handleDrawerModelValueUpdate(false);
      } catch (error) {
        console.error('Ошибка при обновлении кандидата:', error);
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

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const response = await axios.get(`/products/${props.id}`);

    if (response.status === 200) {
      name.value = response.data.product.name;
      brand.value = response.data.product.brand;
      supplier_id.value = response.data.product.supplier?.id;
      category_id.value = response.data.product.category?.id;
      season.value = response.data.product.season.name;
      gender.value = response.data.product.gender.name;
      profit_percent.value = response.data.product.profit_percent;
      sale.value = response.data.product.sale;
    }
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    isFetchingStart.value = false;
  }
};

watch(
  () => props.isDrawerOpen,
  async (newVal) => {
    if (newVal && props.id) fetchDataById();
  },
);

const categories_list = ref([]);
const fetchCategories = async () => {
  try {
    const response = await axios.get('/categories');

    if (response.status === 200) {
      categories_list.value = response.data.categories;
    }
  } catch (error) {
    console.error(error);
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
    console.error(error);
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
    <AppDrawerHeaderSection title="Изменить" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm
            :disabled="isFetching"
            v-if="!isFetchingStart"
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- 👉 Полное имя -->
              <VCol cols="12">
                <VTextField v-model="name" label="Имя" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="brand" label="Брэнд" />
              </VCol>

              <VCol cols="12">
                <VSelect
                  v-model="supplier_id"
                  label="Выберите поставщика"
                  :items="suppliers_list"
                  item-title="name"
                  item-value="id"
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  v-model="category_id"
                  label="Выберите категорию"
                  :items="categories_list"
                  item-title="name"
                  item-value="id"
                />
              </VCol>

              <VCol cols="12">
                <VRadioGroup v-model="season" inline>
                  <VRadio label="Весна" value="spring" density="compact" color="success" />
                  <VRadio label="Лето" value="summer" density="compact" color="#FFEB3B" />
                  <VRadio label="Осень" value="fall" density="compact" color="#FF9800" />
                  <VRadio label="Зима" value="winter" density="compact" color="#03A9F4" />
                </VRadioGroup>
              </VCol>

              <VCol cols="12">
                <VRadioGroup v-model="gender" inline>
                  <VRadio label="Мужской" value="man" density="compact" />
                  <VRadio label="Женский" value="woman" density="compact" />
                  <VRadio label="Универсальный" value="unisex" density="compact" />
                  <VRadio label="Детский" value="kids" density="compact" />
                </VRadioGroup>
              </VCol>

              <VCol cols="12">
                <VTextField v-model="profit_percent" label="Наценка в процентах" type="number" />
              </VCol>

              <VCol cols="12">
                <VTextField v-model="sale" label="Скидка в процентах" type="number" />
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
          <div v-if="isFetchingStart" class="d-flex h-screen align-center justify-center">
            <VProgressCircular color="primary" indeterminate></VProgressCircular>
          </div>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
