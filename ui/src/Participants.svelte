<script lang="ts">
 
  import { encodeHashToBase64 } from "@holochain/client";
  import { getContext } from "svelte";
  import type { TalkingStickiesStore } from "./tsStore";
  import Avatar from "./Avatar.svelte";
  import type { Board } from "./board";
  import type { AsyncReadable } from "@holochain-open-dev/stores";

  export let board: Board

  // const { getStore } :any = getContext("tsStore");
  // let store: TalkingStickiesStore = getStore();

  $: participants = board ? board.sessionParticipants() : undefined

  export let size:number = 24;

</script>
<div class="wrapper"
    class:bordered={false}  >
    {#if $participants && $participants.status=="complete"}

        {#each Array.from($participants.value) as agentPubKey}
          <Avatar size={size} agentPubKey={agentPubKey} showNickname={false} />
        {/each}

    {/if}
</div>
<style>
  .bordered {
    border: solid 1px gray;
  }
  .wrapper {
    border-radius: 50%;
    display: flex;
    flex-direction: row
  }
  img {
    width: var(--icon-size, 24px);
    height: var(--icon-size, 24px);
    border-radius: 50%;
  }
</style>