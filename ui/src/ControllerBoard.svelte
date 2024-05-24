<script lang="ts">
    import Toolbar from './Toolbar.svelte'
    import TalkingStickiesPane from './TalkingStickiesPane.svelte'
    import { TalkingStickiesStore } from './store'
    import { setContext } from 'svelte';
    import type { AppClient, EntryHash } from '@holochain/client';
    import type { SynStore } from '@holochain-syn/store';
    import type { ProfilesStore } from "@holochain-open-dev/profiles";
    import type { WeaveClient } from '@lightningrodlabs/we-applet';

    export let roleName = ""
    export let client : AppClient
    export let weaveClient : WeaveClient
    export let profilesStore : ProfilesStore
    export let board : EntryHash

    let store: TalkingStickiesStore = new TalkingStickiesStore(
        weaveClient,
        profilesStore,
        client,
        roleName,
      );
    let synStore: SynStore = store.synStore
    store.boardList.setActiveBoard(board)

    $: activeBoard = store.boardList.activeBoard

    setContext('synStore', {
      getStore: () => synStore,
    });
  
    setContext('store', {
      getStore: () => store,
    });
    const DEFAULT_KD_BG_IMG = ""
    // const DEFAULT_KD_BG_IMG = "https://img.freepik.com/free-photo/studio-background-concept-abstract-empty-light-gradient-purple-studio-room-background-product-plain-studio-background_1258-54461.jpg"
    // const NO_BOARD_IMG = "https://holochain.org/img/big_logo.png"
    $: uiProps = store.uiProps
    $: bgUrl = $uiProps.bgUrl ? $uiProps.bgUrl : DEFAULT_KD_BG_IMG
    $: boardCount = store.boardList.boardCount
  
  </script>
  
  <div class="flex-scrollable-parent">
    <div class="flex-scrollable-container">
      <div class='app'>
      <div class="wrapper">

      <div class="workspace" style="display:flex">

        {#if $activeBoard !== undefined}
          <TalkingStickiesPane activeBoard={$activeBoard} standAlone={true}/>
        {/if}
        </div>
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

