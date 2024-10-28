<script setup>
const props = defineProps(["count"]);
</script>

<template>
  <tbody>
    <tr class="skeleton__list">
      <td class="px-2" v-for="n in props.count || 1">
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
