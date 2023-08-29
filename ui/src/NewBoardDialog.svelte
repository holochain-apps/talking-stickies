<script lang="ts">
    import BoardEditor from './BoardEditor.svelte';
    import type { TalkingStickiesStore } from './tsStore';
    import { getContext } from 'svelte';
    import type { BoardProps, Group, VoteType } from './board';
    import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
    import '@shoelace-style/shoelace/dist/components/button/button.js';
    import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog';

    let editLabelDefs = []
    let editCategoryDefs = []
    let dialog: SlDialog
    
    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();

    const addBoard = async (name: string, groups: Group[], voteTypes: VoteType[],props: BoardProps) => {
        // @ts-ignore
        const board = await store.boardList.makeBoard({name, groups, voteTypes, props, status:""})
        store.boardList.setActiveBoard(board.hashB64())
        dialog.hide()
    }
    export const open = ()=> {
        boardEditor.reset()
        dialog.show()
    }
    let boardEditor

</script>
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
