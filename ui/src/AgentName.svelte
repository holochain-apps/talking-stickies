<script lang="ts">
  import { encodeHashToBase64, type AgentPubKey } from "@holochain/client";
  import "@holochain-open-dev/profiles/dist/elements/agent-avatar.js";
  import { getContext } from "svelte";
  import type { TalkingStickiesStore } from "./tsStore";

  const { getStore } :any = getContext("tsStore");
  let store: TalkingStickiesStore = getStore();

  export let agentPubKey: AgentPubKey

  $: agentPubKey
  $: agentPubKeyB64 = encodeHashToBase64(agentPubKey)
  $: profile = store.profilesStore.profiles.get(agentPubKey)
  $: nickname = $profile.status=="complete" ? $profile.value.entry.nickname : agentPubKeyB64.slice(0,8)+"..."
  
</script>

<div class="nickname">{ nickname }</div>