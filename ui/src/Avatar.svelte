<script lang="ts">
  import { encodeHashToBase64, type AgentPubKey } from "@holochain/client";
  import "@holochain-open-dev/profiles/dist/elements/agent-avatar.js";
  import { getContext } from "svelte";
    import type { AsyncStatus } from "@holochain-open-dev/stores";
    import type { Profile } from "@holochain-open-dev/profiles";
  import type { TalkingStickiesStore } from "./tsStore";

    const { getStore } :any = getContext("tsStore");
  let store: TalkingStickiesStore = getStore();

  export let agentPubKey: AgentPubKey
  export let size = 32
  export let namePosition = "row"
  export let showAvatar = true
  export let showNickname = true

  $: agentPubKey
  $: agentPubKeyB64 = encodeHashToBase64(agentPubKey)
  $: s = store.profilesStore.profiles.get(agentPubKey)
  $: profile = $s.status == "complete" ? $s.value : undefined
  $: nickname = getNickName(profile)
  
  const getNickName = (profile: Profile| undefined) : string => {
    return profile ? profile.nickname : agentPubKeyB64.slice(0,8)+"..."
  }
</script>

<div class="avatar-{namePosition}"
    >
    {#if showAvatar}
        <!-- <div title={nickname}> -->
            <agent-avatar title={nickname} disable-tooltip={true} disable-copy={true} size={size} agent-pub-key="{agentPubKeyB64}"></agent-avatar>
        <!-- </div> -->
    {/if}
    {#if showNickname}
        <div class="nickname">{ nickname }</div>
    {/if}
</div>

<style>
    .avatar-column {
        display:flex;
        flex-direction: column;
    }
    .avatar-row {
        display:inline-flex;
        flex-direction: row;
        justify-content:center;
        position: relative;
        height: 100%;
        align-items: center;
    }
    .avatar-row agent-avatar{
        margin-right: 0.5em;       
    }
</style>