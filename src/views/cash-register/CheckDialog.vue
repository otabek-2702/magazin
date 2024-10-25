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
  <div id="receipt-content" class="receipt-container">
    <div class="receipt">
      <div class="header">
        <h1>SOLUS</h1>
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
  width: 80mm;
  padding: 3mm;
  font-family: 'Courier New', monospace;
  text-align: center;
}

.header {
  text-align: center;
  margin-bottom: 5mm;
}

.header h1 {
  font-size: 30pt;
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
}

.footer {
  text-align: center;
  margin-top: 5mm;
  font-size: 10pt;
}

.footer p {
  margin: 1mm 0;
}

@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }

  .receipt-container {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    opacity: 1;
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
  }
}
</style>