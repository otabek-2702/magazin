<script setup>
import { removeSpaces, transformPrice } from "@/helpers";
import { computed, ref, watch, watchEffect } from "vue";

const props = defineProps({
  paymentInvoice: {
    type: Object,
    required: true,
  },
  salePrice: {
    type: String,
    required: false,
  },
});

const checkSale = computed(() => Number(checkSale) || props.salePrice);
const hasSale = computed(() => checkSale.value > 0);

const formatDate = (date) => {
  return new Date(date).toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const totalPriceWithSale = computed(() => {
  const total = removeSpaces(props.paymentInvoice?.total_amount) - checkSale.value;
  return transformPrice(total);
});

const hasSaleProduct = (item) => Number(item.sale);
</script>

<template>
  <div id="receipt-content" class="receipt-container">
    <div class="receipt">
      <div class="header">
        <h1>SOLUS</h1>
        <div class="check-data">
          <p>Чек №{{ props.paymentInvoice?.id }}</p>
          <p>{{ formatDate(new Date()) }}</p>
        </div>
        <p>{{ props.paymentInvoice?.cashbox?.name }}</p>
      </div>

      <div class="items">
        <template
          v-for="(item, index) in props.paymentInvoice?.items"
          :key="index"
        >
          <div class="item">
            <div class="item-name">{{ item.product_variant_name }} ({{item.product_variant_sku}})</div>
            <div class="item-details">
              <span
                >{{ item.quantity }}x
                {{ transformPrice(item.original_price) }}</span
              >
              <span v-if="hasSaleProduct(item)">
                <del>{{
                  transformPrice(item.original_price * item.quantity)
                }}</del>
                {{ transformPrice(item.sell_price) }}</span
              >
              <span v-else>{{ transformPrice(item.sell_price) }}</span>
            </div>
          </div>
        </template>
      </div>

      <div class="summary">
        <template v-if="hasSale">
          <div class="total-line">
            <span>Общая сумма:</span>
            <span>{{
              transformPrice(props.paymentInvoice?.total_amount)
            }}</span>
          </div>
          <div class="total-line discount">
            <span>СКИДКА:</span>
            <span>-{{ transformPrice(checkSale) }} SO'M</span>
          </div>
          <div class="total-line final-total">
            <span>ИТОГО:</span>
            <span>{{ totalPriceWithSale }} SO'M</span>
          </div>
        </template>
        <div v-else class="total-line final-total">
          <span>ИТОГО:</span>
          <span
            >{{ transformPrice(props.paymentInvoice?.total_amount) }} SO'M</span
          >
        </div>
      </div>

      <div class="footer">
        <p>Спасибо за покупку!</p>
        <p>Ждем вас снова</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.receipt-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}

.receipt {
  width: 76mm;
  max-width: 76mm;
  min-height: 100%;
  padding: 2mm;
  font-family: "Arial", sans-serif;
  font-weight: 700;
  text-align: center;
  color: #000 !important;
  background: #fff;
  box-sizing: border-box;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 3mm;
}

.header h1 {
  font-size: 32pt;
  font-weight: 900;
  margin: 0;
  padding: 0;
  color: #000 !important;
}

.check-data {
  display: flex;
  justify-content: space-between;
  margin: 0;
}

.header p {
  font-size: 13px;
  margin: 2mm 0;
}

.items {
  text-align: left;
  margin: 4mm 0;
  border-top: 1px dashed #000;
  border-bottom: 1px dashed #000;
  padding: 2mm 0;
  width: 100%;
}

.item {
  margin: 2mm 0;
  page-break-inside: avoid;
}

.item-name {
  font-size: 10pt;
  margin-bottom: 1mm;
  word-wrap: break-word;
}

.item-details {
  display: flex;
  justify-content: space-between;
  font-size: 11pt;
  gap: 2mm;
}

.summary {
  margin: 4mm 0;
  text-align: right;
  page-break-inside: avoid;
}

.total-line {
  display: flex;
  justify-content: space-between;
  margin: 2mm 0;
  font-size: 10pt;
}

.discount {
  font-size: 12pt;
}

.final-total {
  font-size: 15pt;
  font-weight: bold;
  border-top: 1px dashed #000;
  padding-top: 2mm;
  margin-top: 3mm;
}

.footer {
  text-align: center;
  margin-top: 4mm;
  font-size: 12pt;
  page-break-inside: avoid;
}

.footer p {
  margin: 1mm 0;
}

@media print {
  @page {
    size: 76mm auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  html,
  body {
    width: 76mm !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .receipt-container {
    position: static;
    width: 76mm !important;
    height: auto;
    overflow: visible;
    opacity: 1;
    margin: 0 !important;
    padding: 0 !important;
  }

  body * {
    visibility: hidden;
  }

  #receipt-content,
  #receipt-content * {
    visibility: visible;
  }

  #receipt-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 76mm !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

@media print and (-webkit-min-device-pixel-ratio: 0) {
  .receipt {
    width: 76mm !important;
  }

  #receipt-content {
    transform-origin: left top;
    transform: scale(1);
  }
}
</style>
