<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  import type { TalkingStickiesStore } from "./store";
  import type { EntryHash } from "@holochain/client";
  import "@shoelace-style/shoelace/dist/components/skeleton/skeleton.js";
  import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
  import Participants from "./Participants.svelte";
  import { BoardType } from "./boardList";
  import { exportBoard } from "./export"
  import { faArrowTurnDown, faEllipsisV, faFileExport } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";


  const dispatch = createEventDispatcher()
  const { getStore } :any = getContext('store');
  const store:TalkingStickiesStore = getStore();

  export let boardHash: EntryHash
  export let boardType: BoardType

  const archiveBoard = async () => {
    await store.boardList.archiveBoard(boardHash)
  }

  const unarchiveBoard = async () => {
    await store.boardList.unarchiveBoard(boardHash)
  }

  const leaveBoard = async () => {
    await store.boardList.closeActiveBoard(true)
  };

  $: boardData = store.boardList.boardData2.get(boardHash)
  let menu
</script>
<div class="wrapper">
  <div class="board-info" on:click={()=>{dispatch("select")}}>
      {#if $boardData.status == "complete"}
        {@const latestState = $boardData.value.latestState}
        {@const board = $boardData.value.board}
        <div class="board-name">{latestState.name}</div>
        <div style="display:flex; flex-direction:row">
        {#if boardType == BoardType.active}
          <Participants board={$boardData.value.board}></Participants>
        {/if}
        <sl-dropdown bind:this={menu}>
            <div slot="trigger" class="three-dots"
            on:click={(e)=>{
              e.stopPropagation()
              menu.show()
            }}
          >
            <Fa icon={faEllipsisV}></Fa>
          </div>

          <sl-menu style="max-width: 100px;"
            on:mouseleave={menu.hide()}
            on:click={(e)=>e.stopPropagation()}
            on:sl-select={(e)=>{
              switch(e.detail.item.value) {
                case "leave": leaveBoard(); break;
                case "archive": archiveBoard(); break;
                case "unarchive": unarchiveBoard(); break;
                case "export": exportBoard(latestState); break;
              }
              menu.hide()
            }}>
            {#if board.session}
              <sl-menu-item value="leave">
                <Fa  icon={faArrowTurnDown} />
                Leave
              </sl-menu-item>
            {/if}
            <sl-menu-item value="export">
              <Fa  icon={faFileExport} />
              Export
            </sl-menu-item>
            {#if boardType == BoardType.active}
              <sl-menu-item value="archive">Archive</sl-menu-item>
            {:else}
              <sl-menu-item value="unarchive">Unarchive</sl-menu-item>
            {/if}
          </sl-menu>
        </sl-dropdown>
      </div>
      {:else if $boardData.status == "pending"}
        <sl-skeleton
          effect="pulse"
          style="height: 10px; width: 100%"
          ></sl-skeleton>
      {:else if $boardData.status == "error"}
        {$boardData.error}
      {/if}
  </div>
    {#if $boardData.status == "complete"}
      {@const latestState = $boardData.value.latestState}
      {#if latestState.props.description}
        <div class="description">{latestState.props.description}</div>
      {/if}
    {/if}

</div>
<style>
  .three-dots {
    margin-left: 5px; 
    padding-top: 2px;
    padding-left: 5px;
    padding-right: 5px; 
    margin-top:2px; 
    border:1px solid;
    border-color: gray;
    background-color: lightgray;
    border-radius: 5px;
  }
  .three-dots:hover {
    background-color: lightblue;
  }
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