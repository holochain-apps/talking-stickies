<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  import type { TalkingStickiesStore } from "./store";
  import type { EntryHash } from "@holochain/client";
  import "@shoelace-style/shoelace/dist/components/skeleton/skeleton.js";
  import Participants from "./Participants.svelte";
  import { BoardType } from "./boardList";
  import { exportBoard } from "./export"
  import { faFileExport } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";


  const dispatch = createEventDispatcher()
  const { getStore } :any = getContext('store');
  const store:TalkingStickiesStore = getStore();

  export let boardHash: EntryHash
  export let boardType: BoardType

  const archiveBoard = async () => {
        await store.boardList.archiveBoard(boardHash)
       //store.setUIprops({showMenu: true})
  }

  const unarchiveBoard = async () => {
        await store.boardList.unarchiveBoard(boardHash)
       //store.setUIprops({showMenu: true})
  }

  $: boardData = store.boardList.boardData2.get(boardHash)

</script>
<div class="wrapper">
  <div class="board-info" on:click={()=>{dispatch("select")}}>
      {#if $boardData.status == "complete"}
        {@const board = $boardData.value.board}
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
    {#if $boardData.status == "complete"}
      {@const latestState = $boardData.value.latestState}
      {@const board = $boardData.value.board}


      {latestState.props.description}
      <div class="controls">
        <div class="control" on:click={(e) => {
          e.stopPropagation()
          exportBoard(latestState)
          }} title="Export">
          <Fa icon={faFileExport} />
          <span>Export</span>
        </div>

        {#if boardType == BoardType.active}
          <div class="control"
            on:click={async (e)=>{
              e.stopPropagation()
              archiveBoard()
            }}
            title="Archive"
            >Archive</div>
        {:else}
          <div class="control"
            on:click={async (e)=>{
              e.stopPropagation()
              unarchiveBoard()
            }}
            title="Unarchive"
            >Unarchive</div>
        {/if}
      </div>
    {:else if $boardData.status == "pending"}
      <sl-skeleton
      effect="pulse"
      style="height: 10px; width: 100%"
      ></sl-skeleton>  
    {/if}

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

  .controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-left: 7px;
    padding-top: 10px;
  }

  .control {
    display: flex;
    margin: 5px;
    align-items: center;
    background: rgba(0,0,0,.05);
    border: 2px solid rgba(0,0,0,.1);
    border-radius: 10px;
    height: 20px;
    min-width: 20px;
    padding: 0px 6px;
    justify-content: center;
    box-shadow: 0px 3px 5px rgb(130 107 58 / 25%);
    position: relative;
    font-size: 11px;
    transition: all .25s ease;
    cursor: pointer;
    border: 2px solid rgb(166 115 55 / 16%);
    border-bottom: 2px solid rgb(84 54 19 / 25%);
    border-top: 2px solid rgba(255,255,255,.7);
    transition: all .25s ease;
    transform: scale(1);
  }

  .controls .control {
    font-size: 14px;
    height: 30px;
    padding: 0px 10px;
  }

  .control:hover {
    transform: scale(1.05);
    cursor: pointer;
  }

  .controls .control:hover {
    transform: scale(1.3);
  }
</style>