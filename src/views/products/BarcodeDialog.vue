<script setup>
import { requiredValidator } from '@/@core/utils/validators';
import axios from '@axios';
import JsBarcode from 'jsbarcode';
import { nextTick, onMounted, ref, watch, watchEffect } from 'vue';

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

const isFetchingStart = ref(true);
const itemData = ref();

const onFormCancel = () => {
  emit('update:isDrawerOpen', false);
 // nextTick(() => {
 //   setTimeout(() => {
 //     itemData.value = null;
 //   }, 500);
 // });
};

const fetchData = async () => {
  try {
    isFetchingStart.value = true;

    const { data } = await axios.get(`/products/${props.productId}`);

    itemData.value = data.product;

    // After fetching data, generate the barcode
    nextTick(() => generateBarcode(itemData.value.code));
  } catch (error) {
    console.log('Error fetching data:', error);
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
  () => {
    if (props.isDrawerOpen && props.productId) fetchData();
  },
);

const formatPrice = (price) => {
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
        <VCardTitle class="text-h5">{{ itemData?.name }}</VCardTitle>
      </VCardItem>

      <div v-if="isFetchingStart" class="d-flex h-screen align-center justify-center">
        <VProgressCircular color="primary" indeterminate></VProgressCircular>
      </div>

      <VCardText v-if="!isFetchingStart">
        <VRow class="justify-center">
          <!-- <VCol cols="12" class="d-flex align-stretch g-4">
            <VBtn v-print="'#printMe'" class="ms-3 w-100" size="x-large">
              Печать
              <VIcon
                class="ms-3"
                size="30"
                icon="mdi-printer"
                style="color: rgb(var(--v-global-theme-primary))"
              />
            </VBtn>
          </VCol> -->
          <div class="paper-look">
            <div id="printMe">
               <!-- <p>
                {{ itemData?.name }}
              </p>
              <b>narxi: {{ formatPrice(itemData?.price) }}</b>  -->
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
  padding: 1mm
}

#printMe > * {
  margin: 0;
  padding: 0;
}

#printMe .barcode {
  width: 100%;
  
}

#printMe p {
  text-wrap: wrap;
  text-align: center;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Limits to 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis; /* Adds "..." if the text overflows */
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
