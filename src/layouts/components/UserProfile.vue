<script setup>
import avatar1 from "@images/avatars/avatar-1.png";
import router from "@/router";
import { ref } from "vue";
import axios from "@/plugins/axios";
import ability from "@/plugins/casl/ability";

function logOut() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userAbilities");
  localStorage.removeItem("userData");

  router.push("/login");
}

const reFresh = async () => {
  axios
    .post("/auth/me")
    .then((r) => {
      const { permissions, role, full_name, id } = r.data;

      const datas = {
        role: role,
        full_name: full_name,
        user_id: id,
      };

      let userAbilities = permissions.map((item) => {
        const [action, subject] = item.split("-");
        return {
          action: action,
          subject: subject,
        };
      });

      localStorage.setItem("userAbilities", JSON.stringify(userAbilities));
      ability.update(userAbilities);
      localStorage.setItem("userData", JSON.stringify(datas));
    })
    .catch((e) => {
      console.error(e);
    });
};
const full_name = ref(JSON.parse(localStorage.getItem("userData"))?.full_name);
const role = ref(JSON.parse(localStorage.getItem("userData"))?.role?.name_ru);
</script>

<template>
  <VBadge
    dot
    bordered
    location="bottom right"
    offset-x="3"
    offset-y="3"
    color="success"
  >
    <VAvatar class="cursor-pointer" color="primary" variant="tonal">
      <VImg :src="avatar1" />

      <!-- SECTION Menu -->
      <VMenu activator="parent" width="230" location="bottom end" offset="14px">
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar color="primary" variant="tonal">
                    <VImg :src="avatar1" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ full_name }}
            </VListItemTitle>
            <VListItemSubtitle>{{ role }}</VListItemSubtitle>
          </VListItem>

          <VDivider class="my-2" />
          <VListItem @click="reFresh">
            <template #prepend>
              <VIcon class="me-2" icon="mdi-reload" size="22" />
            </template>

            <VListItemTitle>Обновить</VListItemTitle>
          </VListItem>

          <!-- Divider -->
          <VDivider class="my-2" />

          <!-- 👉 Logout -->
          <VListItem @click="logOut">
            <template #prepend>
              <VIcon class="me-2" icon="bx-log-out" size="22" />
            </template>

            <VListItemTitle>Выйти</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
