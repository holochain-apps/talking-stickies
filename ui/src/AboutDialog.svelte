<script lang="ts">
    import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
  import { getContext } from 'svelte';
  import type { TalkingStickiesStore } from './store';
  import Fa from 'svelte-fa';
  import { faFileImport } from '@fortawesome/free-solid-svg-icons';
    let dialog
    const { getStore } :any = getContext('store');

    const store:TalkingStickiesStore = getStore();


    let fileinput;
	const onFileSelected = (e)=>{
        let file = e.target.files[0];
        let reader = new FileReader();

        reader.addEventListener("load", async () => {
            const b = JSON.parse(reader.result as string)
            const board = await store.boardList.makeBoard(b)
            store.setUIprops({showMenu:false})
            store.boardList.setActiveBoard(board.hash)
        }, false);
        reader.readAsText(file);
    };
    export const open = ()=>{dialog.show()}
</script>


<sl-dialog label="TalkingStickies!: UI v0.6.2 for DNA v0.5.1" bind:this={dialog} width={600} >
    <div class="about">
        <p>TalkingStickies! is a demonstration Holochain app built by the Holochain Foundation.</p>
        <p> <b>Developers:</b>
            Check out this hApp's source-code <a href="https://github.com/holochain-apps/talking-stickies">in our github repo</a>.
            This project's real-time syncronization is powered by <a href="https://github.com/holochain/syn">Syn</a>, 
            a library that makes it really easy to build this kind of real-time collaboaration into Holochain apps.
        </p>
    <p class="small">Copyright © 2023 Holochain Foundation.  This software is distributed under the MIT License</p>
    <div class="new-board" on:click={()=>{fileinput.click();}} title="Import Board"><Fa icon={faFileImport} size=2x style="margin-left: 15px;"/><span>Import Board </span></div>
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
    .new-board {
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
    .new-board:hover {
        cursor: pointer;
        z-index: 100;
        transform: scale(1.03);
        box-shadow: 0px 15px 25px rgb(130 107 58 / 25%);
        z-index: 100;
        margin-left: -3px;
    }

    .new-board span {
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
  