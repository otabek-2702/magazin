<script setup>
import axios from '@axios';
import JsBarcode from 'jsbarcode';
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  productId: {
    required: true,
  },
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:isDrawerOpen']);

const refForm = ref();
const isFetchingStart = ref(true);
const itemData = ref();
const count = ref(1);

const onFormCancel = () => {
  emit('update:isDrawerOpen', false);
};

const fetchData = async () => {
  try {
    isFetchingStart.value = true;

    const { data } = await axios.get(`/product_variants/${props.productId}`);

    itemData.value = data.products_variant;

    // After fetching data, generate the barcode
    nextTick(() => generateBarcode(itemData.value?.sku));
  } catch (error) {
    console.error(error);
  } finally {
    isFetchingStart.value = false;
  }
};

// Bar code setup
const barcodeContainer = ref();

const generateBarcode = (bar_code) => {
  if (barcodeContainer.value) {
    console.log('Rendering barcode for:', bar_code);

    // Clear previous content
    barcodeContainer.value.innerHTML = '';

    // Generate barcode into the SVG
    JsBarcode(barcodeContainer.value, bar_code, {
      format: 'CODE128',
      lineColor: '#000',
      width: 2,
      height: 60,
      displayValue: true,
    });
  } else {
    console.error('SVG container not found!');
  }
};

// Watch for changes in productId and modal state

watch(
  () => props.isDrawerOpen,
  (newVal) => {
    if (newVal && props.productId) fetchData();
  },
);

const formatPrice = (price) => {
  // const priceWithoutZero = Math.round(price * 100) / 100
  return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 500"
    :model-value="props.isDrawerOpen"
    @update:model-value="(v) => emit('update:isDrawerOpen', v)"
  >
    <VCard class="pa-sm-9 pa-5">
      <DialogCloseBtn variant="text" size="small" @click="onFormCancel" />

      <VCardItem class="text-center pb-3">
        <VCardTitle class="text-h5">{{ itemData?.product?.name }}</VCardTitle>
      </VCardItem>

      <div v-if="isFetchingStart" class="d-flex h-screen align-center justify-center">
        <VProgressCircular color="primary" indeterminate></VProgressCircular>
      </div>

      <VCardText v-if="!isFetchingStart">
        <VRow class="justify-center">
          <VCol cols="12" class="d-flex align-stretch g-4">
            <!-- <VTextField
              type="number"
              v-model="count"
              
              label="Количество"
            /> -->
            <VBtn v-print="'#printMe'" class="ms-3 w-100" size="x-large">
              Печать
              <VIcon
                class="ms-3"
                size="30"
                icon="mdi-printer"
                style="color: rgb(var(--v-global-theme-primary))"
              />
            </VBtn>
          </VCol>
          <div class="paper-look">
            <div id="printMe">
              <p>
                
                {{ itemData?.product?.gender?.translate.slice(0,1) }}
                .
                {{ itemData?.product?.name }}
                {{ itemData?.size?.name }}
                <br>
                {{itemData.color.name}}
              </p>
              <b>{{ formatPrice(itemData?.product?.sell_price) }} сум</b>
              <svg ref="barcodeContainer" class="barcode" style="width: 100%; height: 150px"></svg>
            </div>
          </div>
        </VRow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.paper-look {
  -webkit-box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.55);
  -moz-box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.55);
  box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.55);
  padding: 1mm;
  border-radius: 7px;
  transform: scale(1.5);
  margin: 50px 0 40px 0;
}

#printMe {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 57mm;
  height: 30mm;
  padding-top: 0.5mm;
  /* padding: 1mm; */
}

#printMe > * {
  margin: 0;
  padding: 0;
}

#printMe .barcode {
  width: 100%;
}

#printMe p {
  /* text-wrap: wrap; */
  text-align: center;
  font-size: 10px;
  /* -webkit-box-orient: vertical;
  overflow: hidden; */
  /* padding-bottom: 5px; */
}

@media print {
  .paper-look {
    transform: scale(1);
  }
  @page {
    size: 30mm 60mm portrait !important; /* Adjust to paper size */
  }
}
</style>
