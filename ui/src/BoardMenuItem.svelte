<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  import type { TalkingStickiesStore } from "./tsStore";
  import type { EntryHash } from "@holochain/client";
  import "@shoelace-style/shoelace/dist/components/skeleton/skeleton.js";
  import Participants from "./Participants.svelte";
  import { BoardType } from "./boardList";

  const dispatch = createEventDispatcher()
  const { getStore } :any = getContext('tsStore');
  const store:TalkingStickiesStore = getStore();

  export let boardHash: EntryHash
  export let boardType: BoardType

  $: boardData = store.boardList.boardData2.get(boardHash)

</script>
<div class="wrapper">
  <div class="board-info" on:click={()=>{dispatch("select")}}>
      {#if $boardData.status == "complete"}
        <div class="board-name">{$boardData.value.latestState.name}</div>
        {#if boardType == BoardType.active}
          <Participants board={$boardData.value.board}></Participants>
        {/if}
      {:else if $boardData.status == "pending"}
        <sl-skeleton
          effect="pulse"
          style="height: 10px; width: 100%"
          ></sl-skeleton>
      {:else if $boardData.status == "error"}
        {$boardData.error}
      {/if}
  </div>
  <div class="description">
    Description of board
  </div>
</div>
<style>
  .wrapper {
    width: 100%;
    z-index: 100;
    padding: 15px;
    position: relative;
  }

  .board-info {
    width: 100%;
    border-radius: 50%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .board-name {
        font-size: 16px;
        font-weight: bold;
        margin-right: 10px;
  }

  .description {
    display: block;
    transition: all .25s ease;
    opacity: 0;
    position: absolute;
    top: 20px;
    background-color: #fff;
    width: 300px;
    left: -2px;
    padding: 15px;
    padding-top: 0;
    box-shadow: 0px 5px 8px rgb(130 107 58 / 25%);
    border: 2px solid rgb(166 115 55 / 26%);
    border-bottom: 2px solid rgb(84 54 19 / 50%);
    border-top: none;
    border-radius: 0 0  10px 10px;
  }

  .wrapper:hover .description {
    opacity: 1;
    top: 45px;
    margin-bottom: 0px;
  }
</style>