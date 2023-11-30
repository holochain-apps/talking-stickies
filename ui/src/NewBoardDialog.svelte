<script lang="ts">
    import BoardEditor from './BoardEditor.svelte';
    import type { TalkingStickiesStore } from './store';
    import { getContext } from 'svelte';
    import type { BoardProps, Group, VoteType } from './board';
    import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
    import '@shoelace-style/shoelace/dist/components/button/button.js';
    import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog';

    let editLabelDefs = []
    let editCategoryDefs = []
    let dialog: SlDialog
    
    const { getStore } :any = getContext('store');

    const store:TalkingStickiesStore = getStore();

    const addBoard = async (name: string, groups: Group[], voteTypes: VoteType[],props: BoardProps) => {
        // @ts-ignore
        const board = await store.boardList.makeBoard({name, groups, voteTypes, props, status:""})
        dialog.hide()
        store.setUIprops({showMenu:false})
        await store.boardList.setActiveBoard(board.hash)
    }
    export const open = ()=> {
        boardEditor.reset()
        dialog.show()
    }
    let boardEditor

</script>
<div class="dialog-container">
<sl-dialog bind:this={dialog} label="New Board"
    on:sl-initial-focus={(e)=>{
        boardEditor.initialFocus()
        e.preventDefault()
    }}
    on:sl-request-close={(event)=>{
        if (event.detail.source === 'overlay') {
        event.preventDefault();    
  }}}>
    <BoardEditor bind:this={boardEditor}  handleSave={addBoard} cancelEdit={()=>dialog.hide()} />
</sl-dialog>
</div>

<style>
    .dialog-container {
        position: relative;
        z-index: 10000;
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