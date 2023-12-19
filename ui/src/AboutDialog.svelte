<script lang="ts">
    import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
    import { getContext } from 'svelte';
    import type { TalkingStickiesStore } from './store';
    import Fa from 'svelte-fa';
    import { faClone, faFileExport, faFileImport, faSpinner } from '@fortawesome/free-solid-svg-icons';
    import {asyncDerived, toPromise} from '@holochain-open-dev/stores'
    import type { Board, BoardEphemeralState, BoardState } from './board';
    import { BoardType } from './boardList';
    import { DocumentStore, WorkspaceStore } from '@holochain-syn/core';
    import { encodeHashToBase64 } from '@holochain/client';
    import { deserializeExport, exportBoards } from './export';

    let dialog
    const { getStore } :any = getContext('store');

    const store:TalkingStickiesStore = getStore();

    const createBoardFrom = async (oldBoard: BoardState) => {
        const board = await store.boardList.cloneBoard(oldBoard)
        store.setUIprops({showMenu:false})
        store.boardList.setActiveBoard(board.hash)
    }

    let fileinput;
	const onFileSelected = (e)=>{
        let file = e.target.files[0];
        let reader = new FileReader();

        reader.addEventListener("load", async () => {
            const importedBoardStates = deserializeExport(reader.result as string)
            if ( importedBoardStates.length > 0) {
                const boards:Array<Board> = []
                for (const b of importedBoardStates) {
                    boards.push(await store.boardList.makeBoard(b))
                }
                if (importedBoardStates.length == 1) {
                    store.setUIprops({showMenu:false})
                    store.boardList.setActiveBoard(boards[0].hash)
                }
            }
            importing = false
        }, false);
        importing = true
        reader.readAsText(file);
    };
    export const open = ()=>{dialog.show()}

    const exportAllBoards = async () => {
        const boardStates = []
        exporting = true

        const hashes = await toPromise(asyncDerived(store.synStore.documentsByTag.get(BoardType.active),x=>Array.from(x.keys())))
        const docs = hashes.map(hash=>new DocumentStore<BoardState, BoardEphemeralState>(store.synStore, hash))
        for (const docStore of docs) {
            try {
                const workspaces = await toPromise(docStore.allWorkspaces)
                const workspaceStore = new WorkspaceStore(docStore, Array.from(workspaces.keys())[0])
                boardStates.push(await toPromise(workspaceStore.latestSnapshot))
            } catch(e) {
                console.log("Error getting snapshot for ", encodeHashToBase64(docStore.documentHash), e)
            }
        }
        exportBoards(boardStates)
        exporting = false
    }

    let importing = false
    let exporting = false
</script>


<sl-dialog label="TalkingStickies!: UI v0.7.0 for DNA v0.6.0" bind:this={dialog} width={600} >
    <div class="about">
        <p>TalkingStickies! is a demonstration Holochain app built by the Holochain Foundation.</p>
        <p> <b>Developers:</b>
            Check out this hApp's source-code <a href="https://github.com/holochain-apps/talking-stickies">in our github repo</a>.
            This project's real-time syncronization is powered by <a href="https://github.com/holochain/syn">Syn</a>, 
            a library that makes it really easy to build this kind of real-time collaboaration into Holochain apps.
        </p>
    <p class="small">Copyright © 2023 Holochain Foundation.  This software is distributed under the MIT License</p> 
 
    {#if importing}
        <div class="export-import" title="Import Boards">
            <div class="spinning" style="margin:auto"><Fa icon={faSpinner} color="#fff"/></div>
        </div>
    {:else}
        <div class="export-import" on:click={()=>{fileinput.click();}} title="Import Boards">
            <Fa color="#fff" icon={faFileImport} size=20px style="margin-left: 15px;"/><span>Import Boards </span>
        </div>
    {/if}
    {#if exporting}
        <div class="export-import" title="Import Boards">
            <div class="spinning" style="margin:auto"><Fa icon={faSpinner}  color="#fff"/></div>
        </div>
    {:else}
        <div class="export-import" on:click={()=>{exportAllBoards()}} title="Export All Boards"><Fa color="#fff" icon={faFileExport} size=20px style="margin-left: 15px;"/><span>Export All Boards</span></div>
    {/if}

    {#await toPromise(store.boardList.allBoards)}
        <div class="spinning" ><Fa icon={faSpinner} color="#fff"/></div>
    {:then boards}
        <sl-dropdown skidding=15>
            <sl-button slot="trigger" caret><Fa icon={faClone} size=20px style="margin-right: 10px"/><span>Clone Board From </span></sl-button>
            <sl-menu>
                    {#each Array.from(boards.entries()) as [key,board]}
                        <sl-menu-item on:click={()=>{
                            createBoardFrom(board.latestState)
                        }} >
                            {board.latestState.name}
                        </sl-menu-item>
                    {/each}

            </sl-menu>
        </sl-dropdown>
    {:catch err}
        Error: {err}
    {/await}


    <input style="display:none" type="file" accept=".json" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >

    </div>
</sl-dialog>

<style>
    .about {
        background-color: white;
    }
    .about p {

        margin-bottom:10px;
     }
     .small {
        font-size: 80%;
    }
    .export-import {
        margin-bottom:5px;
        box-sizing: border-box;
        position: relative;
        width: 100%;
        height: 50px;
        background: #243076;
        border: 1px solid #4A559D;
        color: #fff;
        display: flex;
        align-items: center;
        border-radius: 5px;
    }
    .export-import:hover {
        cursor: pointer;
        z-index: 100;
        transform: scale(1.03);
        box-shadow: 0px 15px 25px rgb(130 107 58 / 25%);
        z-index: 100;
        margin-left: -3px;
    }

    .export-import span {
        color: #fff;
        display: block;
        padding: 0 15px;
    }
    sl-dialog::part(panel) {
        background: #FFFFFF;
        border: 2px solid rgb(166 115 55 / 26%);
        border-bottom: 2px solid rgb(84 54 19 / 50%);
        border-top: 2px solid rgb(166 115 55 / 5%);
        box-shadow: 0px 15px 40px rgb(130 107 58 / 35%);
        border-radius: 10px;
    }
</style>
  