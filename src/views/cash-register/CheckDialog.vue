<script setup>
import { transformPrice } from '@/helpers';

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  totalPrice: {
    type: String,
    required: true,
  },
  totalCount: {
    type: Number,
    required: true,
  },
  cashRegister: {
    type: String,
    required: true,
  },
});

const formatDate = (date) => {
  return new Date(date).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<template>
  <div id="receipt-content">
    <div class="receipt">
      <div class="header">
        <h1>ВАШ МАГАЗИН</h1>
        <p>{{ cashRegister }}</p>
        <p>{{ formatDate(new Date()) }}</p>
      </div>
      
      <div class="items">
        <template v-for="(item, index) in items" :key="index">
          <div class="item">
            <div class="item-name">{{ item.product_variant_name }}</div>
            <div class="item-details">
              <span>{{ item.quantity }} x {{ transformPrice(item.sell_price) }}</span>
              <span>{{ transformPrice(item.sell_price * item.quantity) }}</span>
            </div>
          </div>
        </template>
      </div>

      <div class="summary">
        <div class="total-line">
          <span>Кол-во товаров:</span>
          <span>{{ totalCount }}</span>
        </div>
        <div class="total-line">
          <span>ИТОГО:</span>
          <span>{{ totalPrice }} SO'M</span>
        </div>
      </div>

      <div class="footer">
        <p>Спасибо за покупку!</p>
        <p>Ждем вас снова!</p>
      </div>

      <!-- Cut command for XPrinter -->
      <div class="cut-command">
        &#x1B;&#x69; <!-- ESC i command for partial cut -->
      </div>

      <!-- Add extra space for cutting -->
      <div class="cut-space"></div>
    </div>
  </div>
</template>

<style>
@page {
  size: 80mm auto;
  margin: 0;
}

@media print {
  .receipt {
    width: 80mm;
    font-family: 'Courier New', monospace;
    text-align: center;
    padding: 3mm;
  }

  .header {
    text-align: center;
    margin-bottom: 5mm;
  }

  .header h1 {
    font-size: 14pt;
    margin: 0;
    padding: 0;
  }

  .header p {
    font-size: 10pt;
    margin: 2mm 0;
  }

  .items {
    text-align: left;
    margin: 5mm 0;
    border-top: 1px dashed #000;
    border-bottom: 1px dashed #000;
    padding: 2mm 0;
  }

  .item {
    margin: 2mm 0;
  }

  .item-name {
    font-size: 10pt;
    margin-bottom: 1mm;
    white-space: normal;
    word-wrap: break-word;
  }

  .item-details {
    display: flex;
    justify-content: space-between;
    font-size: 10pt;
  }

  .summary {
    margin: 5mm 0;
    text-align: right;
  }

  .total-line {
    display: flex;
    justify-content: space-between;
    font-size: 12pt;
    margin: 2mm 0;
    font-weight: bold;
  }

  .footer {
    text-align: center;
    margin-top: 5mm;
    font-size: 10pt;
    padding-bottom: 5mm;
  }

  .footer p {
    margin: 1mm 0;
  }

  /* Space for cutting */
  .cut-space {
    height: 20mm; /* Space after content for clean cut */
  }

  /* Hide cut command in preview */
  .cut-command {
    display: none;
  }
}

/* Hide receipt in normal view */
#receipt-content {
  display: none;
}
</style>