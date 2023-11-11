<script lang="ts">
    import { getContext } from "svelte";
    import type { TalkingStickiesStore } from "./tsStore";
    import NewBoardDialog from './NewBoardDialog.svelte';
    import Fa from 'svelte-fa';
    import AboutDialog from "./AboutDialog.svelte";
    import Participants from "./Participants.svelte";
    import AddCard from "./icons/AddCard.svelte";
    import TSLogoIcon from "./icons/TSLogoIcon.svelte";
    import { faCog } from "@fortawesome/free-solid-svg-icons";
    import type { EntryHash } from "@holochain/client";
    import type { Board } from "./board";

    export let wide = false

    let newBoardDialog

    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();

    $: boards = store.boardList.activeBoards
    $: archived = store.boardList.archivedBoards

    $: uiProps = store.uiProps

    const bgUrl = "none"


    const selectBoard = async (hash: EntryHash) => {
        store.setUIprops({showMenu:false})
        await store.boardList.setActiveBoard(hash)
    }

    const unarchiveBoard = async (hash: EntryHash) => {
        store.boardList.unarchiveBoard(hash)
        await selectBoard(hash)
    }

    let aboutDialog

</script>

<AboutDialog bind:this={aboutDialog} />
<div class="board-menu"
    class:wide={wide} >
    <div style="display:flex;flex-direction: row;">
    <div class="new-board" on:click={()=>newBoardDialog.open()} title="New Board"><AddCard /><span>New Board</span></div>
    </div>
    {#if $boards.status == "complete"}
        <h3 class="type-header">Active Boards</h3>
        <div class="boards-section">
            {#each Array.from($boards.value.entries()) as [hash, board]}
                <div
                    on:click={()=>selectBoard(hash)}
                    class="board" >
                    <div class="board-name">{board.name}</div>
                    <Participants boardHash={hash}></Participants>
                    <div class="board-bg" style="background-image: url({bgUrl});"></div>
                </div>
            {/each}
        </div>
    {/if}
    {#if $archived.status == "complete"}
        <h3 class="type-header">Archived Boards</h3>
        <div class="boards-section">
            {#each Array.from($archived.value.entries()) as [hash, board]}
                <div
                    on:click={()=>unarchiveBoard(hash)}
                    class="board">
                    <div class="board-name">{board.name}</div>
                    <div class="board-bg" style="background-image: url({bgUrl});"></div>
                </div>
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
        margin-right: 10px;
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
        flex-direction: row;
        justify-content: space-between;
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