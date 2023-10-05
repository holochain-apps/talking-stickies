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
        <h3 class="type-header">Active Boards</h3>
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
        border: 1px solid #EBEBEB;
        box-shadow: 0px 8px 10px rgba(30, 30, 30, 0.1);
        border-radius: 5px;
        height: calc(100vh - 100px);
        margin-left: 15px;
        top: 80px;
    }

    .wide.board-menu {
        width: calc(100vw - 20px);
        height: calc(100vh - 95px);
        position: relative;
        left: 10px;
    }

    .board-menu::-webkit-scrollbar {
        width: 10px;
        background-color: transparent;
    }

    .board-menu::-webkit-scrollbar-thumb {
        height: 5px;
        border-radius: 0;
        background: rgba(20,60,119,.9);
        opacity: 1;
    }

    .wide {
        width: 100vw;
        max-width: 100vw;
    }

    .type-header {
        font-size: 12px;
        font-weight: normal;
        color: #fff;
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
        box-sizing: border-box;
        position: relative;
        width: 290px;
        height: 50px;
        display: flex;
        align-items: center;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        transition: all .25s ease;
        padding: 15px 0;
        border: 2px dashed #AF9886;
        border-radius: 5px;

    }

    .new-board:hover {
        cursor: pointer;
        padding: 15px 5px;
        width: 300px;
        border: 1px solid #252d5d;
        background: rgb(10, 25, 57);
        margin: 0 -5px 0 -5px;
        box-shadow: 0px 4px 15px rgba(35, 32, 74, 0.8);
    }

    .new-board span {
        color: #5F5A54;
        display: block;
        padding: 0 15px;
    }

    .board {
        width: 290px;
        border-radius: 5px;
        padding: 10px;
        margin: 5px;
        transition: all .25s ease;
        border: 1px solid;
        background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgb(200 221 237) 100%);
        position: relative;
        display: block;
        box-shadow: 0px 4px 8px rgba(35, 32, 74, 0.8);
    }

    .board:hover {
        cursor: pointer;
        z-index: 100;
        padding: 15px;
        width: 300px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 100%);
        margin: 0 -5px 0 -5px;
        box-shadow: 0px 4px 14px rgba(35, 32, 74, 0.8);
        z-index: 100;
    }

    .wide .board:hover {
        margin: 0 0 0 0;
    }

    .footer {
        position: fixed;
        padding: 10px;
        border-radius: 0;
        bottom: 30px;
        height: 40px;
        display: block;
        align-items: center;
        width: 330px;
        left: 30px;
        animation-duration: .3s;
        animation-name: slideIn;
        animation-iteration-count: 1;
        animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1.1);
        z-index: 1000;
        --margin-end-position: 0px;
        --margin-start-position: -330px;
        margin-left: 0;
    }

    .footer.slideOut {
      animation-duration: .3s;
      animation-name: slideIn;
      --margin-end-position: -330px;
      animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1.1);
      --margin-start-position: 0px;
      margin-left: -330px;
    }

    @keyframes slideIn {
        from {
            margin-left: var(--margin-start-position);
            backdrop-filter: blur(10px);
        }

        to {
            margin-left: var(--margin-end-position);
            backdrop-filter: blur(0px);
        }
    }
    
    .wide .footer {
        width: 100%;
        bottom: 0;
    }

    .footer div {
        display: inline-block;
    }

    .footer:hover {
        cursor: pointer;
    }

    .logo {
        height: 24px;
        width: 150px;
        margin-right: 5px;
    }

    .board-bg {
        position: absolute;
        z-index: 0;
        height: 100%;
        width: 100%;
        background-size: cover;
    }
</style>