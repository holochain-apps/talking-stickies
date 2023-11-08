<script lang="ts">
    import Toolbar from './Toolbar.svelte'
    import TalkingStickiesPane from './TalkingStickiesPane.svelte'
    import { TalkingStickiesStore } from './tsStore'
    import { setContext } from 'svelte';
    import type { AppAgentClient } from '@holochain/client';
    import type { SynStore } from '@holochain-syn/store';
    import type { ProfilesStore } from "@holochain-open-dev/profiles";
    import BoardMenu from "./BoardMenu.svelte";

    export let roleName = ""
  
    let synStore: SynStore;
    let tsStore: TalkingStickiesStore;
    
    export let client : AppAgentClient
    export let profilesStore : ProfilesStore

    $: activeBoardHash = tsStore && tsStore.boardList && tsStore.boardList.activeBoardHash
    $: activeBoardHashB64 = tsStore && tsStore.boardList && tsStore.boardList.activeBoardHashB64

    initialize()

    setContext('synStore', {
      getStore: () => synStore,
    });
  
    setContext('tsStore', {
      getStore: () => tsStore,
    });
    const DEFAULT_KD_BG_IMG = ""
    //const DEFAULT_KD_BG_IMG = "https://img.freepik.com/free-photo/studio-background-concept-abstract-empty-light-gradient-purple-studio-room-background-product-plain-studio-background_1258-54461.jpg"
    const NO_BOARD_IMG = "https://holochain.org/img/big_logo.png"
    //$: boardList = tsStore? tsStore.boardList.stateStore() : undefined
   // $: boardState = tsStore ? tsStore.getReadableBoardState($activeBoardHash) :  undefined
    //$: bgUrl = boardState ?  ($boardState.props && $boardState.props.bgUrl) ? $boardState.props.bgUrl : DEFAULT_KD_BG_IMG : NO_BOARD_IMG
    $: bgImage = `background-image: url("`+ bgUrl+`");`
    $: myAgentPubKey = tsStore ? tsStore.myAgentPubKey() : undefined
    $: uiProps = tsStore ? tsStore.uiProps : undefined
    $: bgUrl = uiProps ? $uiProps.bgUrl ? $uiProps.bgUrl : DEFAULT_KD_BG_IMG : NO_BOARD_IMG
    $: boardCount = tsStore && tsStore.boardList ? tsStore.boardList.boardCount : undefined

    async function initialize() : Promise<void> {
      const store = createStore()
      synStore = store.synStore;
      try {
        await store.loadBoards()
        tsStore = store
      } catch (e) {
        console.log("Error loading boards:", e)
      }
    }
    function createStore() : TalkingStickiesStore {
      const store = new TalkingStickiesStore(
        profilesStore,
        client,
        roleName,
      );
      return store
    }
  
  </script>
  
  <svelte:head>
    <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
  </svelte:head>
  <div class="flex-scrollable-parent">
    <div class="flex-scrollable-container">
      <div class='app'>

      {#if tsStore}
      <div class="wrapper">

      <div class="header">
        <Toolbar 
          profilesStore={profilesStore}/>
      </div>
      <div class="workspace" style="display:flex">
      {#if $uiProps.showMenu && $boardCount.status == "complete"}
        {#if $boardCount.value > 0 && $activeBoardHash === undefined}
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

        
        {#if $activeBoardHash !== undefined}
          <TalkingStickiesPane />
        {/if}
        </div>
        </div>
      {:else}
        <div class="loading"><div class="loader"></div></div>
      {/if}
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

  .loading {
    text-align: center;
    padding-top: 100px;
  }
  .loader {
    border: 8px solid #f3f3f3;
    border-radius: 50%;
    border-top: 8px solid #3498db;
    width: 50px;
    height: 50px;
    -webkit-animation: spin 2s linear infinite; /* Safari */
    animation: spin 2s linear infinite;
    display: inline-block;
  }
  @-webkit-keyframes spin {
    0% { -webkit-transform: rotate(0deg); }
    100% { -webkit-transform: rotate(360deg); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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

  /* .my-boards {
    display: flex;
  }
  .my-board {
    border-radius: 5px;
    border: 1px solid #222;
    background-color: lightcyan;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    width: 100px;
    margin: 5px;
  } */
</style>

