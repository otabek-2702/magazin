<script setup>
import { removeSpaces, transformPrice } from "@/helpers";
import { computed } from "vue";

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

const checkSale = computed(
  () => Number(props.paymentInvoice.sale) || props.salePrice
);
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

const totalPriceWithSales = computed(() =>
  transformPrice(
    removeSpaces(props.paymentInvoice?.total_amount) - checkSale.value
  )
);

const hasSaleProduct = (item) => Number(item.sale);
</script>

<template>
  <div id="receipt-content" class="receipt-container">
    <div class="receipt">
      <div class="header">
        <h1>SOLUS</h1>
        <div class="check-data">
          <p><b>Дата:</b></p>
          <p>{{ formatDate(props.paymentInvoice?.created_at) }}</p>
        </div>
        <div class="check-data">
          <p><b>Чек:</b> {{ props.paymentInvoice?.id }}</p>
          <p>{{ props.paymentInvoice?.cashbox?.name }}</p>
        </div>
        <div class="check-data">
          <p><b>Кассир:</b></p>
          <p>{{ props.paymentInvoice?.user?.name }}</p>
        </div>
      </div>

      <div class="items">
        <template
          v-for="(item, index) in props.paymentInvoice?.items?.sort(
            (a, b) => a.price - b.price
          )"
          :key="index"
        >
          <div class="item">
            <div class="item-name">
              <b>{{ index + 1 }}.</b> <b>1{{ item.product_variant_id }}</b> |
              {{ item.product_variant_name }}
              <span class="font-weight-black text-h5" style="color: #000">{{
                item.is_promoted ? "*" : ""
              }}</span>
            </div>
            <div class="item-details">
              <span
                >{{ item.quantity }}x {{ transformPrice(item.price) }}
              </span>
              <span v-if="hasSaleProduct(item)">
                <del>{{ transformPrice(item.original_full_price) }}</del>
                {{ transformPrice(item.sell_price) }}</span
              >
              <span v-else>{{ transformPrice(item.sell_price) }}</span>
            </div>
          </div>
        </template>
      </div>

      <div class="summary">
        <div
          v-if="+props.paymentInvoice?.items_sale || hasSale"
          class="total-line"
        >
          <span>Общая сумма:</span>
          <span
            >{{
              transformPrice(props.paymentInvoice?.original_total_amount)
            }}
            so'm</span
          >
        </div>
        <div
          v-if="+props.paymentInvoice?.items_sale"
          class="total-line discount"
        >
          <span>Акция 2+1:</span><br />
          <span
            ><span class="minus">-</span>
            {{ transformPrice(props.paymentInvoice?.items_sale) }} so'm
          </span>
        </div>
        <div v-if="hasSale" class="total-line discount">
          <span>СКИДКА:</span>
          <span>-{{ transformPrice(checkSale) }} so'm</span>
        </div>

        <div
          class="total-line final-total"
          :class="{
            'final-total-border': +props.paymentInvoice?.items_sale || hasSale,
          }"
        >
          <span>ИТОГО:</span>
          <span>{{ totalPriceWithSales }} SO'M</span>
        </div>
      </div>

      <div class="footer">
        <p>Спасибо за покупку!</p>
        <p>Ждем вас снова</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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

  .header {
    text-align: center;
    margin-bottom: 3mm;

    h1 {
      font-size: 32pt;
      font-weight: 900;
      margin: 3mm 0 6mm;
      color: #000 !important;
      font-family: "Nunito", sans-serif;
    }

    p {
      font-family: monospace;
      font-size: 13px;
      font-weight: 400;
      margin: 0;
    }

    .check-data {
      display: flex;
      justify-content: space-between;
      margin: 0;
    }
  }

  .items {
    text-align: left;
    margin: 4mm 0;
    border-top: 4px double #000;
    border-bottom: 4px double #000;
    padding: 2mm 0;
    width: 100%;

    .item {
      margin: 2mm 0;
      page-break-inside: avoid;

      .item-name {
        font-size: 10pt;
        margin-bottom: 1mm;
        word-wrap: break-word;
        font-weight: 400;
      }

      .item-details {
        display: flex;
        justify-content: space-between;
        font-size: 11pt;
        gap: 2mm;

        span:first-child {
          font-weight: 400;
        }
      }
    }
  }

  .summary {
    margin: 4mm 0;
    text-align: right;
    page-break-inside: avoid;

    .total-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 2mm 0;
      font-size: 11pt;

      .minus {
        font-weight: bolder;
        font-size: 16pt;
      }

      .subtitle {
        font-size: 10pt;

        .minus {
          font-size: 14pt;
        }
      }
    }

    .discount {
      font-size: 12pt;
      font-weight: bold;
    }

    .final-total {
      font-size: 15pt;
      font-weight: bold;
      padding-top: 2mm;
      margin-top: 3mm;

      &-border {
        border-top: 1px dashed #000;
      }
    }
  }

  .footer {
    text-align: center;
    margin-top: 4mm;
    font-size: 12pt;
    page-break-inside: avoid;

    p {
      margin: 1mm 0;
    }
  }
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
