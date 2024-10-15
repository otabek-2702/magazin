<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref, watch } from 'vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';
import { transformPrice } from '@/helpers';

const emit = defineEmits(['fetchDatas']);

const isDialogVisible = ref(false);
const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const batches_id = ref();
const currency_id = ref();
const exchange_rate = ref();
const product_variant_id = ref();
const quantity = ref();
const price = ref('');
const rate_symbol = ref();
const product_variants = ref([]);

const removeSpaces = (input) => {
  return input.replace(/\s+/g, '');
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post('/invoices', {
          batch_id: batches_id.value ?? 0,
          currency_id: currency_id.value,
          exchange_rate: exchange_rate.value,

          items: product_variants.value.map((el) => ({
            product_variant_id: el.variant.id,
            price: removeSpaces(el.price),
            quantity: el.quantity,
          })),
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
  isDialogVisible.value = val;
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

const fetchOptions = async (url, dataState, key, customization = { is: false }) => {
  try {
    const response = await axios.get(url);

    if (response.status === 200) {
      if (customization.is) {
        dataState.value = response.data[key].map(customization.method);
      } else {
        dataState.value = response.data[key];
      }
    }
  } catch (error) {
    console.log(error);
  }
};
const product_variants_list = ref([]);
const batches_list = ref([]);
const exchanges_list = ref([]);

// auto exchange_rate
watch(currency_id, (newVal) => {
  exchange_rate.value = exchanges_list.value.find((e) => e.id == newVal)?.rate ?? null;
});

watch(
  isDialogVisible,
  () => {
    fetchOptions('/product_variants', product_variants_list, 'products_variants', {
      method: (el) => ({ ...el, name: `${el.product.name} | ${el.color.name} | ${el.size.name} ` }),
      is: true,
    });
    fetchOptions('/batches', batches_list, 'batches');
    fetchOptions('/exchange_rates', exchanges_list, 'exchange_rates', {
      is: true,
      method: (el) => ({ ...el, name: `${el.symbol} ${el.name}` }),
    });
  },
  { once: true },
);

watch(currency_id, (newVal) => {
  if (newVal) {
    rate_symbol.value =
      exchanges_list.value?.find((el) => el.id == currency_id.value)?.symbol ?? '';
  }
});

// format
const handlePriceInput = (e) => {
  price.value = transformPrice(e.target.value);
};

const addToList = () => {
  if (product_variants.value.find((el) => el.variant.id == product_variant_id.value)) {
    toast('Дубликат', {
      theme: 'auto',
      type: 'error',
      dangerouslyHTMLString: true,
    });
    return;
  }
  const productObj = product_variants_list.value.find((e) => e.id == product_variant_id.value);

  product_variants.value.push({
    variant: productObj,
    price: price.value,
    quantity: quantity.value,
  });
  product_variant_id.value = null;
  price.value = null;
  quantity.value = null;
};

const deleteListItem = (id) => {
  product_variants.value = product_variants.value.filter((el) => el.variant.id != id);
};

const calculatePrice = computed(() => {
  return product_variants.value.reduce(
    (accumulator, el) => accumulator + el.quantity * el.price,
    0,
  );
});

const calculateCount = computed(() => {
  return product_variants.value.reduce(
    (accumulator, el) => accumulator + parseFloat(el.quantity),
    0,
  );
});
</script>

<template>
  <VDialog fullscreen v-model="isDialogVisible">
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn @click="isDialogVisible = true" v-bind="props">Создать накладную</VBtn>
    </template>

    <!-- Dialog Content -->
    <VCard title="Накладная">
      <DialogCloseBtn variant="text" size="small" @click="isDialogVisible = false" />
      <PerfectScrollbar :options="{ wheelPropagation: false }">
        <VCardText>
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="4">
                <VAutocomplete
                  v-model="batches_id"
                  label="Выберите партию"
                  :items="batches_list"
                  item-title="name"
                  item-value="id"
                  autofocus
                />
              </VCol>
              <VCol cols="4">
                <VSelect
                  v-model="currency_id"
                  label="Валюта"
                  :items="exchanges_list"
                  item-title="name"
                  item-value="id"
                />
              </VCol>
              <VCol cols="4">
                <VTextField
                  v-model="exchange_rate"
                  :readonly="currency_id == 3"
                  label="Курс"
                  :prefix="rate_symbol"
                  type="text"
                />
              </VCol>

              <VDivider />

              <VCol cols="12">
                <VTable class="text-no-wrap">
                  <thead>
                    <tr>
                      <th style="width: 48px">ID</th>
                      <th>ТОВАР</th>
                      <th>ЦЕНА</th>
                      <th>КОЛИЧЕСТВО</th>
                      <th>ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="(variant, i) in product_variants" :key="variant.id">
                      <td>{{ i + 1 }}</td>
                      <td>{{ variant.variant.name }}</td>
                      <td>{{ variant.price }} {{ rate_symbol }}</td>
                      <td>{{ variant.quantity }}</td>
                      <td class="text-center" :style="{ width: '80px', zIndex: '10' }">
                        <VIcon
                          size="30"
                          icon="mdi-minus-circle-outline"
                          style="color: red"
                          @click="deleteListItem(variant.variant.id)"
                        ></VIcon>
                      </td>
                    </tr>
                  </tbody>

                  <tfoot v-show="product_variants.length">
                    <tr>
                      <td colspan="2"></td>
                      <td class="text-body-1">Общая цена: {{ calculatePrice }}{{ rate_symbol }}</td>
                      <td class="text-body-1">Общая количество: {{ calculateCount }}</td>
                      <td colspan="10"></td>
                    </tr>
                  </tfoot>
                  <tfoot v-show="!product_variants.length">
                    <tr>
                      <td colspan="9" class="text-center text-body-1">Нет доступных данных</td>
                    </tr>
                  </tfoot>
                </VTable>
              </VCol>

              <VDivider />

              <VForm class="w-100 py-5">
                <VRow>
                  <VCol cols="4">
                    <VAutocomplete
                      v-model="product_variant_id"
                      label="Выберите товар"
                      :items="product_variants_list"
                      item-title="name"
                      item-value="id"
                      :rules="[]"
                    />
                  </VCol>

                  <VCol cols="4">
                    <VTextField
                      :value="transformPrice(price)"
                      @input="handlePriceInput"
                      label="Цена"
                      @keyup.enter="addToList"
                      :rules="[]"
                    />
                  </VCol>

                  <VCol cols="3">
                    <VTextField v-model="quantity" label="Количество" type="number" :rules="[]" />
                  </VCol>
                  <VCol cols="1" class="d-flex justify-center align-center">
                    <VBtn @click="addToList" style="color: white !important; background-color: #4caf50 !important; border-radius: 5px !important">
                      <VIcon
                        size="35"
                        icon="bx-plus"
                        
                      ></VIcon>
                    </VBtn>
                  </VCol>
                </VRow>
              </VForm>
            </VRow>
            <VCardText class="d-flex justify-end gap-2 pt-2">
              <VBtn :loading="isFetching" :disabled="isFetching" type="submit" class="me-3">
                Отправить
              </VBtn>
            </VCardText>
          </VForm>
        </VCardText>
      </PerfectScrollbar>
    </VCard>
  </VDialog>
</template>

<style scoped>
.bg-green {
  background-color: green;
}
</style>
