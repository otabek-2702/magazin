<script setup>
import { nextTick, onMounted, ref } from "vue";

const props = defineProps(["count"]);

let count = ref(1);

const table_body_ref = ref(null);
onMounted(() => {
  nextTick(() => {
    let table_row = table_body_ref.value?.previousElementSibling?.previousElementSibling?.firstChild;
    let amount = table_row?.children?.length;

    count.value = amount;
  });
});
</script>

<template>
  <tbody ref="table_body_ref">
    <tr class="skeleton__list">
      <td class="px-2" v-for="n in count || 1">
        <div class="skeleton__list__item"></div>
      </td>
    </tr>
  </tbody>
</template>

<style scoped lang="scss">
@mixin skeleton {
  border-radius: 5px;
  height: 40px;
  animation: Skeleton-loading 1s linear infinite alternate;

  @keyframes Skeleton-loading {
    0% {
      background-color: hsl(200, 20%, 70%);
    }

    100% {
      background-color: hsl(200, 20%, 95%);
    }
  }
}
.skeleton__list {
  &__item {
    @include skeleton;
  }
}
</style>
