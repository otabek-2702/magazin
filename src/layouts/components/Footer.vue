<template>
  <div class="h-100 d-flex align-center justify-space-between">
    <!-- 👉 Footer: left content -->
    <span class="d-flex align-center">
      &copy;
      {{ new Date().getFullYear() }}
      Made With
      <VIcon
        icon="bx-heart"
        color="error"
        size="1.25rem"
        class="mx-1"
      />
      By <a
        href="#"
        rel="noopener noreferrer"
        class="text-primary ms-1"
      >codeStorm</a>
    </span>
  </div>
</template>
