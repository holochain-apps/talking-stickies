<script lang="ts">
    import Toolbar from './Toolbar.svelte'
    import TalkingStickiesPane from './TalkingStickiesPane.svelte'
    import { TalkingStickiesStore } from './store'
    import { setContext } from 'svelte';
    import type { AppAgentClient } from '@holochain/client';
    import type { SynStore } from '@holochain-syn/store';
    import type { ProfilesStore } from "@holochain-open-dev/profiles";
    import BoardMenu from "./BoardMenu.svelte";
  import type { WeClient } from '@lightningrodlabs/we-applet';

    export let roleName = ""
    export let client : AppAgentClient
    export let weClient : WeClient
    export let profilesStore : ProfilesStore

    let store: TalkingStickiesStore = new TalkingStickiesStore(
        weClient,
        profilesStore,
        client,
        roleName,
      );
    let synStore: SynStore = store.synStore


    $: activeBoardHash = store.boardList.activeBoardHash
    $: activeBoard = store.boardList.activeBoard

    setContext('synStore', {
      getStore: () => synStore,
    });
  
    setContext('store', {
      getStore: () => store,
    });
    const DEFAULT_KD_BG_IMG = ""
    //const DEFAULT_KD_BG_IMG = "https://img.freepik.com/free-photo/studio-background-concept-abstract-empty-light-gradient-purple-studio-room-background-product-plain-studio-background_1258-54461.jpg"
    const NO_BOARD_IMG = "https://holochain.org/img/big_logo.png"
    $: uiProps = store.uiProps
    $: bgUrl = $uiProps.bgUrl ? $uiProps.bgUrl : DEFAULT_KD_BG_IMG
    $: boardCount = store.boardList.boardCount
  
  </script>
  
  <svelte:head>
    <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
  </svelte:head>
  <div class="flex-scrollable-parent">
    <div class="flex-scrollable-container">
      <div class='app'>
      <div class="wrapper">

      <div class="header">
        <Toolbar />
      </div>
      <div class="workspace" style="display:flex">
      {#if $uiProps.showMenu && $boardCount.status == "complete"}
        {#if $activeBoardHash === undefined}
          <div class="board-menu" >
            <BoardMenu wide={true}></BoardMenu>
          </div>
        {:else}
          <div class="board-menu">
            <BoardMenu wide={false}></BoardMenu>
          </div>
          <div class="board-menu-pad">
            <BoardMenu wide={false}></BoardMenu>
          </div>
        {/if}
      {:else}
        <div class="board-menu slideOut">
          <BoardMenu wide={false}></BoardMenu>
        </div>
        <div class="board-menu-pad slideOut">
          <BoardMenu wide={false}></BoardMenu>
        </div>
      {/if}

        
        {#if $activeBoard !== undefined}
          <TalkingStickiesPane activeBoard={$activeBoard}/>
        {/if}
        </div>
        </div>

        <div class="background">
        <div class="background-overlay"></div>
        <div class="background-image"
              style={`background-image: url(${bgUrl}`}></div>
      </div>
    </div>
  </div>
</div>
<style>
  .app {
    margin: 0;
    padding-bottom: 10px;
    background-size: cover;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background-color: #fff;
    position: relative;
  }

  .board-menu, .board-menu-pad {
      animation-duration: .3s;
      animation-name: slideIn;
      animation-iteration-count: 1;
      animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1.1);
      z-index: 199;
      --margin-end-position: 0px;
      --margin-start-position: -330px;
      margin-left: 0;

    }

    .board-menu {
      position: fixed;
      top: 80px;
    }

    .board-menu:hover {
      z-index: 200;
    }

    .board-menu.slideOut, .board-menu-pad.slideOut {
      animation-duration: .3s;
      animation-name: slideOut;
      --margin-end-position: -343px;
      animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1.1);
      --margin-start-position: 0px;
      margin-left: -343px;
    }

    .board-menu-pad {
      visibility: hidden;
    }

    @keyframes slideIn {
        from {
            margin-left: var(--margin-start-position);
        }

        to {
            margin-left: var(--margin-end-position);
        }
    }
    @keyframes slideOut {
        from {
            margin-left: var(--margin-start-position);
        }

        to {
            margin-left: var(--margin-end-position);
        }
    }

  .background {
    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .background-overlay {
    background: linear-gradient(144deg, #fcfbf5 0%, rgb(230 225 215) 100%);
    position: absolute;
    z-index: 2;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: .7;
  }

  .background-image {
    position: absolute;
    z-index: 1;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-size: cover;
  }

  :global(:root) {
    --resizeable-height: 200px;
    --tab-width: 60px;
  }

  @media (min-width: 640px) {
    .app {
      max-width: none;
    }
  }

  .flex-scrollable-parent {
    position: relative;
    display: flex;
    flex: 1;
  }
  .flex-scrollable-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .flex-scrollable-x {
    max-width: 100%;
    overflow-x: auto;
  }
  .flex-scrollable-y {
    max-height: 100%;
    overflow-y: auto;
  }

  .wrapper {
    position: relative;
    z-index: 10;
    overflow-y: auto;
    height: 100vh;
  }

  .wrapper::-webkit-scrollbar {
    width: 10px;
    background-color: transparent;
  }

  .wrapper::-webkit-scrollbar-thumb {
      height: 5px;
      border-radius: 5px;
      background: rgba(215, 203, 191, 1.0);
      opacity: 1;
      width: 8px;
  }

  .workspace {
    padding-top: 135px;
  }

</style>

