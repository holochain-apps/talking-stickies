<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  import StickyEditor from "./StickyEditor.svelte";
  import EmojiIcon from "./icons/EmojiIcon.svelte";
  import { sortBy } from "lodash/fp";
  import type { TalkingStickiesStore } from "./tsStore";
  import SortSelector from "./SortSelector.svelte";
  import { Marked, Renderer } from "@ts-stack/markdown";
  import { cloneDeep, isEqual } from "lodash";
  import { Group, UngroupedId, type Sticky, type StickyProps, type BoardState } from "./board";
  import EditBoardDialog from "./EditBoardDialog.svelte";
  import { faClose, faCog, faFileExport, faPlus } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import { v1 as uuidv1 } from "uuid";
  import sanitize from "sanitize-filename";
  import type { AgentPubKeyB64 } from "@holochain/client";

  const dispatch = createEventDispatcher()

  const download = (filename: string, text: string) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  const exportBoard = (state: BoardState) => {
        const prefix = "talking-stickies"
        const fileName = sanitize(`${prefix}_export_${state.name}.json`)
        download(fileName, JSON.stringify(state))
        alert(`Your board was exported to your Downloads folder as: '${fileName}'`)
    }

  Marked.setOptions
  ({
    renderer: new Renderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
  });

  $: sortOption = null;

  function setSortOption(newSortOption) {
    sortOption = newSortOption;
  }

  const { getStore } :any = getContext("tsStore");
  let tsStore: TalkingStickiesStore = getStore();

  $: activeHash = tsStore.boardList.activeBoardHash;
  $: state = tsStore.boardList.getReadableBoardState($activeHash);
  $: stickies = $state ? $state.stickies : undefined;
  $: sortStickies = sortOption
    ? sortBy((sticky) => countVotes(sticky.props.votes, sortOption) * -1)
    : (stickies) => stickies;

  $: unused = groupStickies(stickies);

  let creatingInGroup: uuidv1 | undefined = undefined;
  let editText = "";
  let editingStickyId: uuidv1

  let groups:{ [key:string]: Group } = {}
  let stickiesMap:{ [key:string]:Sticky } ={}

  const sorted = (itemIds, sortFn)=> {
    var items = itemIds.map((id)=>stickiesMap[id])
    if (sortOption) {
      items = sortFn(items) 
    }
    return items
  }
    
  // TODO refactor into pane?
  const groupStickies = (stickies) => {
    if ($state) {
      groups = {}
      $state.groups.forEach(g => groups[g.id] = cloneDeep(g))
      stickiesMap = {} 
      stickies.forEach(s => stickiesMap[s.id] = cloneDeep(s))
    }
  };

  const newSticky = (group: uuidv1) => () => {
      creatingInGroup = group;
  };
  
  const createSticky = (_groupId: uuidv1, props: StickyProps) => {
    addSticky(creatingInGroup, props)
    creatingInGroup = undefined
  }

  const clearEdit = () => {
    editingStickyId = null;
  };

  const cancelEdit = () => {
    creatingInGroup = undefined;
    clearEdit();
  }
  
  const editSticky = (id:uuidv1) => {
    editingStickyId = id;
  };

  const addSticky= (group: uuidv1, props: StickyProps) => {
      if (group === undefined) {group = 0}
      const sticky:Sticky = {
        id: uuidv1(),
        props,
      };
      dispatch("requestChange", [{ type: "add-sticky", value: sticky, group}]);
  };

  const updateSticky = (_groupId: uuidv1, props:StickyProps) => {
      const sticky = stickies.find((sticky) => sticky.id === editingStickyId);
      if (!sticky) {
        console.error("Failed to find item with id", editingStickyId);
      } else {
        let changes = []
        if (!isEqual(sticky.props, props)) {
          changes.push({ type: "update-sticky-props", id: sticky.id, props: cloneDeep(props)})
        }
        if (changes.length > 0) {
        dispatch("requestChange", changes);
        }
      }
      clearEdit()
  };
    
  const deleteSticky = (id: uuidv1) => {
        dispatch("requestChange", [{ type: "delete-sticky", id }]);
        clearEdit()
    };
  const voteOnSticky = (agent:AgentPubKeyB64, stickies, id: uuidv1, type, max) => {
        const sticky = stickies.find((sticky) => sticky.id === id);
        if (!sticky) {
          console.error("Failed to find sticky with id", id);
          return;
        }
        let votes = {
          ...sticky.props.votes,
        }
        if (typeof votes[type] === 'undefined') {
          votes[type] = {}
          votes[type][agent] = 1
        } else {
          let voteBump = ((sticky.props.votes[type][agent] || 0) + 1)
          if (voteBump > max) {
            voteBump = 0
          }
          votes = {
            ...sticky.props.votes,
            [type]: {
              ...sticky.props.votes[type],
              [agent]: voteBump,
            },
          }
        }
        console.log("VOTING", agent);
        console.log("votes before", sticky.props.votes);
        console.log("votes after", votes);
    
        dispatch("requestChange", [
          {
            type: "update-sticky-votes",
            id: sticky.id,
            voteType: type,
            voter: agent,
            count: votes[type][agent],
          },
        ]);
    };

  const countVotes = (votes, type) => {
    if (typeof votes[type] === 'undefined') {
      return []
    }
    const agentKeys = Object.keys(votes[type]);
    return agentKeys.reduce(
      (total, agentKey) => total + (votes[type][agentKey] || 0),
      0
    );
  };

  const myVotes = (votes, type) => {
    if (typeof votes[type] === 'undefined') {
      return 0
    }
    return votes[type][tsStore.myAgentPubKey()] || 0;
  };

  const closeBoard = () => {
    tsStore.boardList.closeActiveBoard();
  };
  const groupWidth = (groupId) : string => {
    let len = Object.keys($state.grouping).length
    if (len > 1 && $state.grouping[UngroupedId].length == 0) len -= 1
    // TODO: maybe set width dynamically by number of cards in group...
    if (len <= 4) {
      return 100/len+"%"
    }
    if (len == 5) {
      return "33%"
    }
    if (len == 6) {
      return "33%"
    }
    if (len == 7) {
      return "25%"
    }
    if (len == 8) {
      return "25%"
    }
    if (len == 9) {
      return "33%"
    }
    if (len == 10) {
      return "25%"
    }
    return 'fit-content'
  }
  let editBoardDialog
  let draggingHandled = true
  let draggedItemId = ""
  let dragOn = true
  let dragTarget = ""
  function handleDragStart(e) {
    draggingHandled = false
    //console.log("handleDragStart", e)
    e.dataTransfer.dropEffect = "move";
    draggedItemId = e.target.getAttribute('id')
    e.dataTransfer
      .setData("text", e.target.getAttribute('id'));
  }
  function handleDragEnd(e) {
    clearDrag()
    //console.log("handleDragEnd",e )
  }

  const findDropParentElement = (element: HTMLElement):HTMLElement => {
    while (element && !(element.classList.contains("sticky") || element.classList.contains("group"))) {
      element = element.parentElement
    }
    return element
  }
  const findDropGroupParentElement = (element: HTMLElement):HTMLElement => {
    while (element && !element.classList.contains("group")) {
      element = element.parentElement
    }
    return element
  }
  const findDropCardParentElement = (element: HTMLElement):HTMLElement => {
    while (element && !element.classList.contains("sticky")) {
      element = element.parentElement
    }
    return element
  }

  function handleDragEnter(e) {
    const elem = findDropParentElement(e.target as HTMLElement)
    dragTarget = elem ? elem.id : ""
  }

  function handleDragLeave(e) {
    const target = e.target as HTMLElement
    if (target.id == dragTarget) {
      dragTarget = ""
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
  }
  function handleDragDropGroup(e:DragEvent) {
    e.preventDefault();
    if (draggingHandled) {
      //console.log("ignoring because it was handled")
      return
    }
    const target = findDropGroupParentElement(e.target as HTMLElement)
    var srcId = e.dataTransfer.getData("text");
    if (target.id) {
      dispatch("requestChange",[{ type: "update-sticky-group", id:srcId, group:target.id  }])
    }
    clearDrag()
    //console.log("handleDragDropGroup",e, target )
  }
  function handleDragDropCard(e:DragEvent) {
    e.preventDefault();
    const target = findDropCardParentElement(e.target as HTMLElement)
    //console.log("handleDragDropCard",e, target )
    var srcId = e.dataTransfer.getData("text");
    if (target.id && (srcId != target.id) && confirm("Merge stickies?")) {
      dispatch("requestChange",[{ type: "merge-stickies", dstId: target.id, srcId }])
    }
    clearDrag()
  }
  const clearDrag = () => {
    draggingHandled = true
    draggedItemId = ""
    dragTarget = ""
  }
  let dragDuration = 300
</script>
<div class="board">
  <EditBoardDialog bind:this={editBoardDialog}></EditBoardDialog>
  <div class="top-bar">
    <div class="left-items">
      <h5>{$state.name}</h5>
    </div>
    <div class="right-items">
      <div class="sortby">
        Sort: <SortSelector {setSortOption} {sortOption} />
      </div>
      <sl-button circle on:click={()=> editBoardDialog.open(cloneDeep($activeHash))} title="Settings">
        <Fa icon={faCog} size="1x"/>
      </sl-button>
      <sl-button circle on:click={() => exportBoard($state)} title="Export">
        <Fa icon={faFileExport} />
      </sl-button>
      <sl-button circle on:click={closeBoard} title="Close">
        <Fa icon={faClose} />
      </sl-button>
    </div>
  </div>
  {#if $state}
  <div class="groups">
      {#each $state.groups.map((group)=> [group.id, $state.grouping[group.id]]) as [groupId, stickyIds]}
        {#if (groupId !== UngroupedId || stickyIds.length > 0 || $state.groups.length == 1)}
        <div class="group" style:width={groupWidth(groupId)}
        class:glowing={dragTarget == groupId}
        id={groupId}
        on:dragenter={handleDragEnter} 
        on:dragleave={handleDragLeave}  
        on:drop={handleDragDropGroup}
        on:dragover={handleDragOver}
      >
          <div class="group-title">
            {#if $state.groups.length > 1}  
              <b>{#if groupId === UngroupedId}Ungrouped{:else}{groups[groupId].name}{/if}</b>
            {/if}
            <sl-button style="padding: 0 5px;" size="small" text on:click={newSticky(groupId)}>
              <div style="display: flex;">
                Add Card
                <div style="margin-left:5px"><Fa icon={faPlus}/></div>
              </div>
            </sl-button>
          </div>
          <div class="stickies"
            >
          {#each sorted(stickyIds, sortStickies) as { id, props } (id)}
            {#if editingStickyId === id}
              <StickyEditor
                handleSave={updateSticky}
                handleDelete={
                  ()=>deleteSticky(id)
                }
                {cancelEdit}
                groupId={groupId}
                props={cloneDeep(props)}
              />
            {:else}
              <div 
                class="sticky"
                class:tilted={draggedItemId == id}
                class:glowing={dragTarget == id}
                id={id}
                on:dragenter={handleDragEnter} 
                on:dragover={handleDragOver}
                on:dragleave={handleDragLeave}  
                on:drop={handleDragDropCard}
                draggable={dragOn}
                on:dragstart={handleDragStart}
                on:dragend={handleDragEnd}              

                on:click={()=>editSticky(id)} 
                style:background-color={props && props.color ? props.color : "#D7EEFF"}
                >
                <div class="sticky-content">
                  {@html Marked.parse(props.text)}
                </div>
                <div class="votes">
                  {#each $state.voteTypes as {type, emoji, toolTip, maxVotes}}
                    <div
                      class="vote"
                      title={toolTip}
                      class:voted={myVotes(props.votes, type) > 0}
                      on:click|stopPropagation={() => voteOnSticky(tsStore.myAgentPubKey(), stickies, id, type, maxVotes)}
                    >
                      <EmojiIcon emoji={emoji} class="vote-icon" />
                      {countVotes(props.votes, type)}
                      <div class="vote-counts">
                        {#each new Array(myVotes(props.votes, type)).map((_, i) => i) as index}
                          <div class="vote-count" />
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
          {#if creatingInGroup !== undefined  && creatingInGroup == groupId}
            <StickyEditor handleSave={createSticky} {cancelEdit} />
          {/if}
          </div>
        </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>
<style>
  .board {
    display: flex;
    flex-direction: column;
    min-height: 500px;
    border-radius: 3px;
    margin-left: 15px;
    margin-right: 15px;
    margin-top: 15px;
    box-shadow: 0 0 2px gray;
  }
  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: #ffffffaa;;
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 5px 5px 0 0;
  }
  .left-items {
    display: flex;
    align-items: center;
  }
  .right-items {
    display: flex;
    align-items: center;
  }
  .sortby {
    border-right: 1px solid lightgray;
    display: flex;
    align-items: center;
    margin-right: 8px;
    height: 47px;
    padding-right: 10px;
  }
  .groups {
    display: flex;
    flex-wrap: wrap;
    overflow-y: auto;
  }
  .group {
    display: block;
    min-width: 290px;
  }
  .group-title {
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 10px;
    max-width: 270px;
    color: white;
    display: flex;
    align-items: center;
  }
  .stickies {
    display: flex;
    flex-wrap: wrap;
  }
  .glowing {
    outline: none;
    border-color: #9ecaed;
    box-shadow: 0 0 10px #9ecaed !important;
  }
  .tilted {
    transform: rotate(3deg);
    box-shadow: 6px 6px 10px rgba(0, 0, 0, 0.5) !important;
  }
  .sticky {
    background-color: #d4f3ee;
    flex-basis: 200px;
    height: 200px;
    min-width: 250px;
    margin: 10px;
    padding: 10px;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .sticky-content {
    overflow-y: auto;
    max-width: 300px;
  }
  .votes {
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin-top: auto;
  }
  .vote {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 5px;
    flex-basis: 26px;
    height: 25px;
    padding: 0 5px;
    border: 1px solid white;
    position: relative;
    cursor: pointer;
  }
  .voted {
    border-color: black;
  }
  .vote-counts {
    padding-top: 2px;
    display: flex;
    flex-direction: column;
    position: absolute;
    left: -3px;
    justify-content: flex-start;
  }
  .vote-count {
    border-radius: 50px;
    width: 5px;
    height: 5px;
    background-color: black;
    margin-bottom: 2px;
  }
</style>
