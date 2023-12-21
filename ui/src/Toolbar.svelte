<script lang="ts">
  import Search from "./Search.svelte";
  import Folk from "./Folk.svelte";
  import EditBoardDialog from "./EditBoardDialog.svelte";
  import { faArrowTurnDown, faBars, faBug, faClose, faCog, faHome } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import type { TalkingStickiesStore } from "./store";
  import { getContext } from "svelte";

  const { getStore } :any = getContext('store');
  const store:TalkingStickiesStore = getStore();
  $: uiProps = store.uiProps
  $: activeBoard = store.boardList.activeBoard;
  $: state = $activeBoard ? $activeBoard.readableState() : undefined
  let editBoardDialog

  const closeBoard = async () => {
    await store.closeActiveBoard(false)
  };

  const leaveBoard = async () => {
    await store.closeActiveBoard(true)
  };

</script>

<div class='toolbar'>  <EditBoardDialog bind:this={editBoardDialog}></EditBoardDialog>
  {#if $activeBoard}
    <div style="display: flex;">
      {#if $uiProps.showMenu}
        <div class="close tool-item menu" on:click={()=>{store.setUIprops({showMenu:false})}}><div title="Hide Board Menu"><Fa icon={faClose} size=2x color="#fff" /></div></div>

      {:else}
        <div class="open tool-item menu" on:click={()=>{store.setUIprops({showMenu:true})}}  title="Show Board Menu"><Fa icon={faBars} size=2x /></div>
      {/if}
      <sl-dropdown>
        <sl-button slot="trigger" caret class="board-options">{$state.name}</sl-button>
        <sl-menu>
          <sl-menu-item on:click={()=> editBoardDialog.open($activeBoard.hash)} >
            <Fa icon={faCog} size="1x" /> Board Settings
          </sl-menu-item>
          <sl-menu-item on:click={closeBoard} title="Leave">
            <Fa icon={faClose} size=1x /> Close Board
          </sl-menu-item>
          <sl-menu-item on:click={leaveBoard} title="Leave">
            <Fa icon={faArrowTurnDown} size=1x /> Leave Board
          </sl-menu-item>
        </sl-menu>
      </sl-dropdown>
      

    </div>
  {/if}

  <div class="tool-item search"><Search></Search></div>

  <div class="items">
    <div class="tool-item bugs">
      <a href="https://github.com/holochain-apps/talking-stickies/issues" title="Report a problem in our GitHub repo" target="_blank">
        <div class="nav-button"><Fa icon={faBug} size=2x /></div>
      </a>
    </div>
    <Folk></Folk>
  </div>
</div>

<style>
  .bug-link {
    padding: 8px 8px;
    display: flex;
    border-radius: 50%;
  }
  a:hover.bug-link {
    background-color: #ddd;
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 15px;
    padding-right: 25px;
    padding-top: 0;
    padding-bottom: 0;
    position: fixed;
    top: 40px;
    height:0;
    z-index: 200;
    width: 100vw;
  }
  .logo {
    height: 40px;
    margin-right: 10px;
    display: contents;
    cursor: pointer;
  }

  .board-options::part(base) {
    font-size: 16px;
    font-weight: bold;
    color: rgba(95, 90, 83, 1.0);
    font-family: "Figtree", sans-serif !important;
  }

  .tool-item, .board-options::part(base) {
    background: #FFFFFF;
    border: 2px solid rgb(166 115 55 / 26%);
    border-bottom: 2px solid rgb(84 54 19 / 50%);
    border-top: 2px solid rgb(166 115 55 / 15%);
    box-shadow: 0px 15px 20px rgb(130 107 58 / 25%);
    border-radius: 10px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .25s ease;
    transform: scale(1);
  }

  .tool-item:hover,  .board-options::part(base):hover {
    cursor: pointer;
    transform: scale(1.15);
  }

  .tool-item.search:hover {
    transform: scale(1.1);
  }

  .menu {
    width: 50px;
    margin-right: 15px;
  }

  .menu.close {
    border: 2px solid rgb(76, 106, 167);
    border-top: 2px solid rgb(123, 166, 252);
    background-color: rgb(77, 123, 214);
    box-shadow: 0 4px 5px rgba(0,0,0,.2);
    border-bottom: 2px solid rgb(36, 53, 86);
    color: rgba(255,255,255,1);
    animation: zoom-in .25s;
    animation-timing-function: ease;
  }

  @keyframes zoom-in {
    0% {
      transform: scale(.75)
    }
    100% {
      transform: scale(1);
    }
  }

  .search {
    padding: 0 10px 0 0;
  }

  .bugs {
    width: 50px;
    margin-right: 15px;
  }

  .settings {
    padding: 0 15px;
    font-weight: bold;
    font-size: 16px;
  }

  .logo-text {
    padding-bottom: 5px;
    margin-left: 15px;
  }
  .items {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }
  .icon-button {
    margin-right: 15px;
    width:50px;
  }

  sl-menu::part(panel) {
    border-radius: 10px
  }
</style>