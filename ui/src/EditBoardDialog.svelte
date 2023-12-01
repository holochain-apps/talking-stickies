<script lang="ts">
    import BoardEditor from './BoardEditor.svelte';
    import type { TalkingStickiesStore } from './store';
    import { getContext, onMount } from 'svelte';
    import { isEqual } from 'lodash'
    import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
    import '@shoelace-style/shoelace/dist/components/button/button.js';
    import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog';
    import type { Board, BoardProps, BoardState, Group, VoteType } from './board';
    import type { EntryHash } from '@holochain/client';

    let boardHash:EntryHash|undefined = undefined

    let dialog: SlDialog
    onMount(async () => {

    })

    export const  open = async (hash: EntryHash)=> {
        boardHash = hash
        boardEditor.edit(hash)
        dialog.show()
    }

    const { getStore } :any = getContext('store');

    const store:TalkingStickiesStore = getStore();

    const updateBoard = async ( name: string, groups: Group[], voteTypes: VoteType[], props: BoardProps) => {
        const board: Board | undefined = await store.boardList.getBoard(boardHash)
        if (board) {
            let changes = []
            const state: BoardState = board.state()
            if (state.name != name) {
                changes.push(
                {
                    type: 'set-name',
                    name: name
                })
            }
            if (!isEqual(groups, state.groups)) {
                changes.push({type: 'set-groups',
                groups: groups
                })
            }
            if (!isEqual(props, state.props)) {
                changes.push({type: 'set-props',
                props: props
                })
            }
            if (!isEqual(voteTypes, state.voteTypes)) {
                changes.push({type: 'set-vote-types',
                voteTypes: voteTypes
                })
            }
            if (changes.length > 0) {
                board.requestChanges(changes)
            }
        }
        close()
    }
    // const archiveBoard = async () => {
    //     await store.boardList.archiveBoard(boardHash)
    //     store.setUIprops({showMenu: true})
    //     close()
    // }
    const close = ()=>{
        dialog.hide()
        boardHash=undefined
    }
    let boardEditor
</script>
<sl-dialog persistent bind:this={dialog} label="Edit Board" 
on:sl-initial-focus={(e)=>{
    boardEditor.initialFocus()
    e.preventDefault()

  }}

on:sl-request-close={(event)=>{
    if (event.detail.source === 'overlay') {
    event.preventDefault();    
}}}>
    <BoardEditor bind:this={boardEditor} handleSave={updateBoard} cancelEdit={close}/>
</sl-dialog>

<style>
    sl-dialog::part(panel) {
        background: #FFFFFF;
        border: 2px solid rgb(166 115 55 / 26%);
        border-bottom: 2px solid rgb(84 54 19 / 50%);
        border-top: 2px solid rgb(166 115 55 / 5%);
        box-shadow: 0px 15px 40px rgb(130 107 58 / 35%);
        border-radius: 10px;
    }
</style>
