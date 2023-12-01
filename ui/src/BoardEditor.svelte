<script lang="ts">
    import { Group, type BoardProps, UngroupedId, Board, VoteType, type BoardState } from './board';
    import { getContext, onMount } from 'svelte';
  	import DragDropList, { VerticalDropZone, reorder, type DropEvent } from 'svelte-dnd-list';
    import 'emoji-picker-element';
    import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
    import '@shoelace-style/shoelace/dist/components/button/button.js';
    import '@shoelace-style/shoelace/dist/components/input/input.js';
    import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
    import Fa from 'svelte-fa'
    import { faPlus, faGripVertical, faTrash, faFileExport } from '@fortawesome/free-solid-svg-icons';
    import { cloneDeep } from "lodash";

    import type { TalkingStickiesStore } from './store';
    import type { EntryHash } from '@holochain/client';

    const { getStore } :any = getContext('store');

    const store:TalkingStickiesStore = getStore();


    $: activeBoard = store.boardList.activeBoard;
    $: state = $activeBoard ? $activeBoard.readableState() : undefined

    export let handleSave
    export let handleDelete = undefined
    export let cancelEdit

    let boardHash:EntryHash|undefined = undefined
    let text = ''
    let description = ''
    let props:BoardProps = {bgUrl: "", description:""}
    let groups: Array<Group> = []
    let voteTypes: Array<VoteType> = []
    let nameInput
    let descriptionInput

    export const reset = () => {
      text = ''
      props = {bgUrl: "", description:""}
      groups = []
      voteTypes = []
      nameInput.value = ""
      nameInput.focus()

    }

    export const initialFocus = () => {
      nameInput.focus()
    }

    export const  edit = async (hash: EntryHash)=> {
      boardHash = hash
      const board: Board | undefined = await store.boardList.getBoard(boardHash)
      if (board) {
          const state = board.state()
          text = state.name
          nameInput.value = text
          groups = cloneDeep(state.groups)
          voteTypes = cloneDeep(state.voteTypes)
          props = state.props ? cloneDeep(state.props) : {bgUrl:"", description:""}
          // remove the ungrouped ID TODO find a better way.
          const index = groups.findIndex((g)=>g.id == UngroupedId)
          if (index != -1) {
              groups.splice(index,1)
          }
      } else {
          console.log("board not found:", boardHash)
      }

    }

    const addVoteType = () => {
      voteTypes.push(new VoteType(`🙂`, ``, 1))
      voteTypes = voteTypes
    }
    const deleteVoteType = (index) => () => {
      voteTypes.splice(index, 1)
      voteTypes = voteTypes
    }

    const addGroup = () => {
      groups.push(new Group(`group ${groups.length+1}`))
      groups = groups
    }
    const deleteGroup = (index) => () => {
      groups.splice(index, 1)
      groups = groups
    }
    onMount( async () => {
    })

    const onDropGroups = ({ detail: { from, to } }: CustomEvent<DropEvent>) => {
      if (!to || from === to || from.dropZoneID !== "groups") {
        return;
      }

      groups = reorder(groups, from.index, to.index);
    }
    const onDropVoteTypes = ({ detail: { from, to } }: CustomEvent<DropEvent>) => {
      if (!to || from === to || from.dropZoneID !== "voteTypes") {
        return;
      }

      voteTypes = reorder(voteTypes, from.index, to.index);
    }
   let showEmojiPicker :number|undefined = undefined
   let emojiDialog,colorDialog
   let showColorPicker :number|undefined = undefined
   let hex
   $: valuesValid = text != ""
</script>

  <div class='board-editor'>
    <div class="edit-title control-group">
      <div class="control-group-title">Title</div> 
      <sl-input required={true} class='textarea' maxlength="60" bind:this={nameInput}  on:input={e=>text= e.target.value}></sl-input>
    </div>
    <div class="edit-title control-group">
      <div class="control-group-title">Description</div> 

      <sl-textarea class='textarea' value={props.description}  on:input={e=>props.description= e.target.value}></sl-textarea>
    </div>
    <div class="edit-groups unselectable control-group">
      <div class="control-group-title">Groups</div>
      <DragDropList
        id="groups"
        type={VerticalDropZone}
	      itemSize={45}
        itemCount={groups.length}
        on:drop={onDropGroups}
        let:index
        itemClass="unselectable"
        >
        <div class="group">
          <div class="grip" ><Fa icon={faGripVertical}/></div>
          <sl-input class='textarea' value={groups[index].name} on:input={e=>groups[index].name = e.target.value}></sl-input>
          <sl-button size="small"  on:click={deleteGroup(index)}>
          <Fa icon={faTrash}/>
          </sl-button>
        </div>
      </DragDropList>
      <div class="control" on:click={() => addGroup()}>
        <Fa icon={faPlus}/>
        <span>Add sticky group</span>
      </div>
    </div>
    <div class="edit-vote-types unselectable control-group">
      <div class="control-group-title">
        Voting Types
      </div>
      <sl-dialog label="Choose Emoji" bind:this={emojiDialog}>
          <emoji-picker on:emoji-click={(e)=>  {
            voteTypes[showEmojiPicker].emoji = e.detail.unicode
            console.log(e.detail)
            showEmojiPicker = undefined
            emojiDialog.hide()
          }
          }></emoji-picker>
    
      </sl-dialog>
      <DragDropList
        id="voteTypes"
        type={VerticalDropZone}
	      itemSize={45}
        itemCount={voteTypes.length}
        on:drop={onDropVoteTypes}
        let:index
        itemClass="unselectable"
        >
        <div class="vote-type">
          <div class="grip" ><Fa icon={faGripVertical}/></div>
          <sl-button on:click={()=>{showEmojiPicker = index;emojiDialog.show()}} >
            <span style="font-size:180%">{voteTypes[index].emoji}</span>
          </sl-button>
          <sl-input type="number" min="1" max="5" class='textarea' style="width:70px" value={voteTypes[index].maxVotes} title="max votes on type per card"
          on:input={e=>voteTypes[index].maxVotes = parseInt(e.target.value) }> </sl-input>
          <sl-input 
            class='textarea vote-type' value={voteTypes[index].toolTip} 
            title="description"
            placeholder="description"
            on:input={e=>voteTypes[index].toolTip = e.target.value}> </sl-input>

          <sl-button size="small"   on:click={deleteVoteType(index)} >
            <Fa icon={faTrash}/> 
          </sl-button>
        </div>
      </DragDropList> 
      <div class="control" on:click={() => addVoteType()}>
        <Fa icon={faPlus}/>
        <span>Add voting type</span>
      </div>
    </div>
  
    <div class="edit-title control-group">
      <div class="control-group-title">Background Image</div>
      <sl-input class='textarea' maxlength="255" value={props.bgUrl} on:input={e=>props.bgUrl = e.target.value} />
    </div>

    <div class='controls'>

      {#if handleDelete}
        <div class="control" on:click={handleDelete}>
          Archive
        </div>
      {/if}
      <div class="control" on:click={cancelEdit} style="margin-left:10px">
        Cancel
      </div>
    
      <div class="control"
        class:disabled={!valuesValid} 
        style="margin-left:10px" on:click={() => handleSave(text, groups, voteTypes, props)} >
        <span>Save</span>
        
      </div>
    </div>
 </div>


   
 <style>
  .board-editor {
    display: flex;
    flex-basis: 270px;
    font-style: normal;
    font-weight: 600;
    color: #000000;
    flex-direction: column;
    justify-content: flex-start;
  }
  .textarea {
    width: 100%;
    padding: 5px;
    margin-right: 5px;
    font-weight: normal;
  }

  .control-group {
    position: relative;
    margin-bottom: 25px;
    min-width: 290px;
    border: 2px dashed rgba(84, 54, 19, .20);
    border-radius: 15px;
    padding: 10px;
  }

  .control-group-title {
    white-space: nowrap;
    overflow: hidden;
    font-size: 14px;
    position: absolute;
    top: -15px;
    border-radius: 10px;
    left: -3px;
    max-width: 270px;
    display: flex;
    padding: 5px 8px;
    align-items: center;
    background-color: white;
    padding-left: 0;
  }

  .textarea.vote-type::part(base) {
    max-width: 170px;
  }

  .controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-left: 7px;
    padding-top: 10px;
  }

  .control {
    display: flex;
    margin: 5px;
    align-items: center;
    background: rgba(0,0,0,.05);
    border: 2px solid rgba(0,0,0,.1);
    border-radius: 10px;
    height: 30px;
    min-width: 30px;
    padding: 0px 6px;
    justify-content: center;
    box-shadow: 0px 3px 5px rgb(130 107 58 / 25%);
    position: relative;
    font-size: 11px;
    transition: all .25s ease;
    cursor: pointer;
    border: 2px solid rgb(166 115 55 / 16%);
    border-bottom: 2px solid rgb(84 54 19 / 25%);
    border-top: 2px solid rgba(255,255,255,.7);
    transition: all .25s ease;
    transform: scale(1);
  }

  .controls .control {
    font-size: 16px;
    height: 40px;
    padding: 0px 10px;
  }

  .control:hover {
    transform: scale(1.05);
    cursor: pointer;
  }

  .controls .control:hover {
    transform: scale(1.3);
  }

  .group {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .vote-type {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 220px;
  }
  .grip {
    margin-right:10px;
    cursor: pointer;
  }
  .title-text {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-weight: normal;
    font-size: 14px;
    position: absolute;
    top: -10px;
  }
  .unselectable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.modal {
  background-color: var(--light-text-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
