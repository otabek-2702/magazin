<script setup>
import { nextTick, ref } from 'vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';
import { fetchOptions } from '@/helpers';

const emit = defineEmits(['fetchDatas']);

const isDialogVisible = ref(false);
const isFetching = ref(false);
const isFormValid = ref(false);
const isWareHouseAddToo = ref(false); //:)
const refForm = ref();
const product_id = ref();
const size_id = ref();
const color_id = ref();
const batches_id = ref();
const exchange_id = ref();
const initial_price = ref('');
const quantity = ref();

// 👉 drawer close
const closeNavigationDrawer = () => {
  isDialogVisible.value = false;
  nextTick(() => {
    refForm.value?.reset();
    refForm.value?.resetValidation();
  });
};

const removeSpaces = (input) => {
  return input.replace(/\s+/g, '');
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post('/product_variants', {
          product_id: product_id.value,
          size_id: size_id.value,
          color_id: color_id.value,
          batch_id: batches_id.value ?? 0,
          purchase_exchange_rate_id: exchange_id.value ?? 0,
          purchase_price: removeSpaces(initial_price.value ?? 0),
          quantity: quantity.value,
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
  isDialogVisible.value = val;
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

const products_list = ref([]);
const sizes_list = ref([]);
const colors_list = ref([]);
const batches_list = ref([]);
const exchanges_list = ref([]);

watch(
  isDialogVisible,
  () => {
    fetchOptions('/sizes', sizes_list, 'sizes');
    fetchOptions('/colors', colors_list, 'colors');
    fetchOptions('/products', products_list, 'products');
    fetchOptions('/batches', batches_list, 'batches');
    fetchOptions('/exchange_rates', exchanges_list, 'exchange_rates', {
      is: true,
      method: (v) => ({
        ...v,
        name: `${v.symbol} ${v.rate}`,
      }),
    });
  },
  { once: true },
);

// format
const formatPrice = (price) => {
  let formattedPrice = price
    .toString()
    .replace(/\s/g, '')
    .replace(/[^\d\s]/g, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return formattedPrice.trim();
};
const handlePriceInput = (e) => {
  initial_price.value = formatPrice(e.target.value);
};
</script>

<template>
  <VDialog v-model="isDialogVisible" max-width="600">
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn @click="isDialogVisible = true" v-bind="props">Добавить товар</VBtn>
    </template>

    <!-- Dialog Content -->
    <VCard title="Добавить">
      <DialogCloseBtn variant="text" size="small" @click="isDialogVisible = false" />
        <VCardText>
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VAutocomplete
                  v-model="product_id"
                  label="Выберите товар"
                  :items="products_list"
                  item-title="name"
                  item-value="id"
                  autofocus
                />
              </VCol>

              <VCol cols="6">
                <VSelect
                  v-model="size_id"
                  label="Выберите размер"
                  :items="sizes_list"
                  item-title="name"
                  item-value="id"
                />
              </VCol>

              <VCol cols="6">
                <VAutocomplete
                  v-model="color_id"
                  label="Выберите цвет"
                  :items="colors_list"
                  item-title="name"
                  item-value="id"
                />
              </VCol>

              <!-- <VCol cols="6">
                <VTextField
                  v-model="sale"
                  
                  label="Скидка в процентах"
                  type="number"
                />
              </VCol> -->
              <VCol cols="12" class="d-flex justify-content-end align-center">
                <VSwitch v-model="isWareHouseAddToo" inset label="Также добавить товар на склад" />
              </VCol>
              <template v-if="isWareHouseAddToo">
                <VCol cols="6">
                  <VAutocomplete
                    v-model="batches_id"
                    label="Выберите партию"
                    :items="batches_list"
                    item-title="name"
                    item-value="id"
                  />
                </VCol>
                <VCol cols="6">
                  <VTextField v-model="quantity" label="Количество" type="number" />
                </VCol>

                <VCol cols="6">
                  <VSelect
                    v-model="exchange_id"
                    label="Валюта"
                    :items="exchanges_list"
                    item-title="name"
                    item-value="id"
                  />
                </VCol>
                <VCol cols="6">
                  <VTextField
                    :value="formatPrice(initial_price)"
                    @input="handlePriceInput"
                    label="Себестоимость"
                    type="text"
                  />
                </VCol>
              </template>
            </VRow>
            <VCardText class="d-flex justify-end gap-2 pt-2">
              <VBtn :loading="isFetching" :disabled="isFetching" type="submit" class="me-3">
                Отправить
              </VBtn>
              <VBtn type="reset" variant="tonal" color="secondary" @click="closeNavigationDrawer">
                Отмена
              </VBtn>
            </VCardText>
          </VForm>
        </VCardText>
    </VCard>
  </VDialog>
</template>
