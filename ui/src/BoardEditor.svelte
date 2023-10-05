<script lang="ts">
    import { Group, type BoardProps, UngroupedId, Board, VoteType } from './board';
    import { getContext, onMount } from 'svelte';
  	import DragDropList, { VerticalDropZone, reorder, type DropEvent } from 'svelte-dnd-list';
    import 'emoji-picker-element';
    import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
    import '@shoelace-style/shoelace/dist/components/button/button.js';
    import '@shoelace-style/shoelace/dist/components/input/input.js';
    import Fa from 'svelte-fa'
    import { faPlus, faGripVertical, faTrash, faFileExport } from '@fortawesome/free-solid-svg-icons';
    import { cloneDeep } from "lodash";
    import sanitize from "sanitize-filename";

    import type { TalkingStickiesStore } from './tsStore';
    import type { EntryHashB64 } from '@holochain/client';


    const download = (filename: string, text: string) => {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    }

    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();


    $: activeHash = store.boardList.activeBoardHash;
    $: state = store.boardList.getReadableBoardState($activeHash);
    
    const exportBoard = (state: BoardState) => {
      const prefix = "talking-stickies"
      const fileName = sanitize(`${prefix}_export_${state.name}.json`)
      download(fileName, JSON.stringify(state))
      alert(`Your board was exported to your Downloads folder as: '${fileName}'`)
    }

    export let handleSave
    export let handleDelete = undefined
    export let cancelEdit

    let boardHash:EntryHashB64|undefined = undefined
    let text = ''
    let props:BoardProps = {bgUrl: ""}
    let groups: Array<Group> = []
    let voteTypes: Array<VoteType> = []
    let nameInput
    export const reset = () => {
      text = ''
      props = {bgUrl: ""}
      groups = []
      voteTypes = []
      nameInput.value = ""
      nameInput.focus()

    }

    export const initialFocus = () => {
      nameInput.focus()
    }

    export const  edit = async (hash: EntryHashB64)=> {
      boardHash = hash
      const board: Board | undefined = await store.boardList.getBoard(boardHash)
      if (board) {
          const state = board.state()
          text = state.name
          nameInput.value = text
          groups = cloneDeep(state.groups)
          voteTypes = cloneDeep(state.voteTypes)
          props = state.props ? cloneDeep(state.props) : {bgUrl:""}
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
      voteTypes.push(new VoteType(`🙂`, `description: edit-me`, 1))
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
</script>

  <div class='board-editor'>
    <div class="edit-title">
      <div class="title-text">Title:</div> <sl-input class='textarea' maxlength="60" bind:this={nameInput}  on:input={e=>text= e.target.value}></sl-input>
    </div>
    <div class="edit-groups unselectable">
      <div class="title-text">Groups:
        <sl-button circle size="small" on:click={() => addGroup()}>
          <Fa icon={faPlus}/>
        </sl-button>
      </div>
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
    </div>
    <div class="edit-vote-types unselectable">
      <div class="title-text">
        Voting Types:

        <sl-button circle size="small"  on:click={() => addVoteType()}>
          <Fa icon={faPlus}/>
        </sl-button>
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
          <sl-input class='textarea' style="width:60px" maxlength="2" minlength="1" value={voteTypes[index].maxVotes} title="max votes on type per card"
          on:input={e=>voteTypes[index].maxVotes = e.target.value}> </sl-input>
          <sl-input class='textarea' value={voteTypes[index].toolTip} title="description"
          on:input={e=>voteTypes[index].toolTip = e.target.value}> </sl-input>

          <sl-button size="small"  on:click={deleteVoteType(index)} >
            <Fa icon={faTrash}/>
          </sl-button>
        </div>
      </DragDropList> 
    </div>
  
    <div class="edit-title">
      <div class="title-text">Background Image:</div> <sl-input class='textarea' maxlength="255" value={props.bgUrl} on:input={e=>props.bgUrl = e.target.value} />
    </div>

    <div class='controls'>
      <sl-button circle on:click={() => exportBoard($state)} title="Export">
        <Fa icon={faFileExport} />
      </sl-button>
      {#if handleDelete}
        <sl-button on:click={handleDelete}>
          Archive
        </sl-button>
      {/if}
      <sl-button on:click={cancelEdit} style="margin-left:10px">
        Cancel
      </sl-button>
      <sl-button style="margin-left:10px" on:click={() => handleSave(text, groups, voteTypes, props)} variant="primary">
        Save
      </sl-button>
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

  .controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-left: 7px;
    padding-top: 10px;
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
    font-size: 120%;
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
