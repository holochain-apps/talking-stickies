<script lang="ts">
    import { getContext } from "svelte";
    import type { TalkingStickiesStore } from "./tsStore";
    import type { EntryHashB64 } from '@holochain/client';
    import NewBoardDialog from './NewBoardDialog.svelte';
    import { faSquarePlus } from '@fortawesome/free-solid-svg-icons';
    import Fa from 'svelte-fa';
    import AboutDialog from "./AboutDialog.svelte";
    import AddCard from "./icons/AddCard.svelte";
    import TSLogoIcon from "./icons/TSLogoIcon.svelte";
    import { faCog } from "@fortawesome/free-solid-svg-icons";
  import TalkingStickiesPane from "./TalkingStickiesPane.svelte";
    export let wide = false

    let newBoardDialog

    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();



    $: uiProps = store.uiProps
    $: boardList = store.boardList.stateStore()
    $: activeHash = store.boardList.activeBoardHash;
    $: state = store.boardList.getReadableBoardState($activeHash);
    $: archivedBoards = $boardList.boards.findIndex((board)=>board.status === "archived") >= 0
    $: activeBoards = $boardList.boards.findIndex((board)=>board.status !== "archived") >= 0

    // const DEFAULT_KD_BG_IMG = "none"
    // const NO_BOARD_IMG = "none"
    // $: boardState = store ? store.boardList.getReadableBoardState($activeHash) :  undefined
    // $: bgUrl = boardState ?  ($boardState.props && $boardState.props.bgUrl) ? $boardState.props.bgUrl : DEFAULT_KD_BG_IMG : NO_BOARD_IMG
    const bgUrl = "none"


    const selectBoard = (hash: EntryHashB64) => {
        store.setUIprops({showMenu:false})
        store.boardList.setActiveBoard(hash)
    }

    const unarchiveBoard = (hash: EntryHashB64) => {
        store.boardList.unarchiveBoard(hash)
        selectBoard(hash)
    }

    let aboutDialog

</script>

<AboutDialog bind:this={aboutDialog} />
<div class="board-menu"
    class:wide={wide} >
    <div style="display:flex;flex-direction: row;">
    <div class="new-board" on:click={()=>newBoardDialog.open()} title="New Board"><AddCard /><span>New Board</span></div>
    </div>
    {#if $uiProps.recent.length > 0 || activeBoards}
        <h3 class="type-header">All Boards</h3>
        <div class="boards-section">
            {#if $uiProps.recent.length > 0}
                {#each $uiProps.recent as boardHash }
                    <div class="board"
                        on:click={()=>{
                            selectBoard(boardHash)
                        }}>
                        <div class="board-name">{$boardList.boards.find(b=>b.hash==boardHash).name}</div>
                        <div class="board-bg" style="background-image: url({bgUrl});"></div>
                    </div>
                {/each}
            {/if}
            {#if activeBoards}
                {#each $boardList.boards as board }
                    {#if board.status !== "archived" && !$uiProps.recent.includes(board.hash)}
                        <div
                            on:click={()=>selectBoard(board.hash)}
                            class="board" id={board.hash}>
                            <div class="board-name">{board.name}</div>
                            <div class="board-bg" style="background-image: url({bgUrl});"></div>
                        </div>
                    {/if}
                {/each}
            {/if}
        </div>
    {/if}
    {#if archivedBoards}
        <h3 class="type-header">Archived Boards</h3>
        <div class="boards-section">
            {#each $boardList.boards as board }
                {#if board.status === "archived" }
                <div class="board" id={board.hash} on:click={unarchiveBoard(board.hash)}>
                    <div class="board-name">{board.name}</div>
                    <div class="board-bg" style="background-image: url({bgUrl});"></div>
                </div>
                {/if}
            {/each}
        </div>
    {/if}

    <NewBoardDialog bind:this={newBoardDialog}></NewBoardDialog>
    <div class="footer" 
        class:slideOut={$uiProps.showMenu == false}
        on:click={()=>aboutDialog.open()}>   
        <div class="logo" title="About TalkingStickies!"><TSLogoIcon /></div>
        <Fa icon={faCog} class="cog" size="1.5x" color="rgba(95, 90, 83, 1.0)"/>
    </div>
</div>

<style>
    .wide {
        width: 100%;
    }
    .boards-section {
        display: flex;
        flex-wrap: wrap;
    }

    .board-menu {
        overflow-y: auto;
        overflow-x: hidden;
        min-width: 330px;
        width: 330px;
        max-width: 0;
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        align-items: flex-start;
        position: sticky;
        padding: 15px;
        padding-bottom: 50px;
        background: #FFFFFF;
        border: 2px solid rgb(166 115 55 / 26%);
        border-bottom: 2px solid rgb(84 54 19 / 40%);
        border-top: 2px solid rgba(255,255,255,.8);
        box-shadow: 0px 15px 20px rgb(130 107 58 / 25%);
        border-radius: 10px;
        height: calc(100vh - 100px);
        margin-left: 15px;
    }

    .wide.board-menu {
        width: calc(100vw - 30px);
        height: calc(100vh - 95px);
        position: relative;
    }

    .board-menu::-webkit-scrollbar {
        width: 10px;
        background-color: transparent;
    }

    .board-menu::-webkit-scrollbar-thumb {
        height: 5px;
        border-radius: 0;
        background: rgba(215, 203, 191, 1.0);
        border-radius: 10px;
        opacity: 1;
    }

    .wide {
        width: 100vw;
        max-width: 100vw;
    }

    .type-header {
        font-size: 12px;
        font-weight: normal;
        color: rgba(95, 90, 83, 1.0);
        text-transform: uppercase;
        opacity: .6;
        margin-top: 20px;
        margin-bottom: 10px;
        margin-left: 5px;
    }

    .board-name {
        font-size: 16px;
        font-weight: bold;
    }

    .new-board {
        background: linear-gradient(180deg, rgb(244 200 42) 0%, rgb(243 220 135) 100%);
        border: 2px solid rgb(166 115 55 / 26%);
        border-bottom: 2px solid rgb(84 54 19 / 50%);
        border-top: 2px solid rgb(166 115 55 / 15%);
        box-shadow: 0px 15px 20px rgb(130 107 58 / 25%);
        border-radius: 10px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        font-size: 16px;
        font-weight: bold;
        padding: 15px;
        transition: all .25s ease;
        transform: scale(1);
        width: 296px;
    }

    .new-board span {
        color: #5F5A54;
        display: block;
        padding: 0 10px;
    }

    .board {
        width: 290px;
        background: linear-gradient(180deg, rgba(246, 245, 235, 1.0)0%, rgba(255, 255, 255, 1) 100%);
        border: 2px solid rgb(166 115 55 / 26%);
        border-bottom: 2px solid rgb(84 54 19 / 50%);
        border-top: 2px solid rgb(166 115 55 / 15%);
        box-shadow: 0px 6px 8px rgb(130 107 58 / 25%);
        border-radius: 10px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        transition: all .25s ease;
        transform: scale(1);
        padding: 15px;
        margin-bottom: 15px;
    }

    .wide .board {
        margin-right: 15px;
    }

    .board:hover, .new-board:hover {
        cursor: pointer;
        z-index: 100;
        padding: 15px;
        width: 300px;
        transform: scale(1.03);
        box-shadow: 0px 15px 25px rgb(130 107 58 / 25%);
        z-index: 100;
        margin-left: -7px;
    }

    .new-board:hover {
        box-shadow: 0px 20px 35px rgb(130 107 58 / 25%);
    }

    .wide .board:hover {
        margin-left: -5px;
        margin-right: 10px;
    }

    .footer {
        position: fixed;
        padding: 20px;
        border-radius: 0;
        bottom: 22px;
        height: 50px;
        align-items: center;
        width: 315px;
        left: 18px;
        animation-duration: .3s;
        animation-name: slideIn;
        animation-iteration-count: 1;
        animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1.1);
        z-index: 2000;
        --margin-end-position: 0px;
        --margin-start-position: -330px;
        margin-left: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 46%);
        border-radius: 10px;
    }

    .footer.slideOut {
      transition: all .3s ease;
      left: -330px;
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
            margin-left: var(--margin-end-position);
        }

        to {
            margin-left: var(--margin-start-position);
        }
    }
    
    .wide .footer {
        width: calc(100vw - 30px);
        bottom: 20px;
    }

    .footer div {
        display: inline-block;
    }

    .footer:hover {
        cursor: pointer;
    }

    .board-bg {
        position: absolute;
        z-index: 0;
        height: 100%;
        width: 100%;
        background-size: cover;
    }
</style>