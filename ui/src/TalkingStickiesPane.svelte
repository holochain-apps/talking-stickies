<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  import StickyEditor from "./StickyEditor.svelte";
  import EmojiIcon from "./icons/EmojiIcon.svelte";
  import AddGroupIcon from "./icons/AddGroupIcon.svelte";
  import { sortBy } from "lodash/fp";
  import type { TalkingStickiesStore } from "./tsStore";
  import SortSelector from "./SortSelector.svelte";
  import { Marked, Renderer } from "@ts-stack/markdown";
  import { cloneDeep, isEqual } from "lodash";
  import { Group, UngroupedId, type Sticky, type StickyProps, type BoardState, Board } from "./board";
  import EditBoardDialog from "./EditBoardDialog.svelte";
  import { faClose, faFileExport, faPlus } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import { v1 as uuidv1 } from "uuid";
  import type { AgentPubKeyB64 } from "@holochain/client";
  import ClickEdit from "./ClickEdit.svelte";
  import Masonry from 'svelte-bricks'

  const dispatch = createEventDispatcher()
  
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

  const newGroup = (group: uuidv1) => () => {
    let changes = []
    const groups = cloneDeep($state.groups)
    groups.push(new Group(`group ${groups.length}`))
    changes.push({type: 'set-groups',
        groups
        })
    tsStore.boardList.requestBoardChanges($activeHash, changes)
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
    tsStore.setUIprops({showMenu:true})
  };
  const groupWidth = (groupId) : string => {
    let len = Object.keys($state.grouping).length
    if (len > 1 && $state.grouping[UngroupedId].length == 0) len -= 1
    // TODO: maybe set width dynamically by number of cards in group...
    if (len <= 4) {
      return "calc(" + 100/len + "% - 15px"
    }
    if (len == 5) {
      return "calc(33% - 30px)"
    }
    if (len == 6) {
      return "calc(33% - 30px)"
    }
    if (len == 7) {
      return "calc(25% - 45px)"
    }
    if (len == 8) {
      return "calc(25% - 45px)"
    }
    if (len == 9) {
      return "calc(33% - 30px)"
    }
    if (len == 10) {
      return "calc(25% - 45px)"
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

  $: items = $state.groups.map((group)=> {
    return {
      id:group.id, stickyIds:$state.grouping[group.id]}}).filter(item=> {
        return (item.id === UngroupedId && (item.stickyIds.length > 0 || $state.groups.length === 1)) || (
          item.id !== UngroupedId
        )
      }
      )

  let [minColWidth, maxColWidth, gap] = [300, 800, 30]
  let width, height

</script>
<div class="board">
  <EditBoardDialog bind:this={editBoardDialog}></EditBoardDialog>
  <div class="top-bar">
    <div class="add-group" on:click={newGroup(uuidv1())}>
        <div style="margin-right: 5px; display: flex;"><AddGroupIcon /></div>
        Add Group
    </div>
    {#if $state.voteTypes.length>0}
      <div class="sortby">
        Sort by <SortSelector {setSortOption} {sortOption} />
      </div>
    {/if}
  </div>
  {#if $state}
  <Masonry
    {items}
    {minColWidth}
    {maxColWidth}
    {gap}
    let:item
    bind:masonryWidth={width}
    bind:masonryHeight={height}
  >
    <div class="group"
      class:glowing={dragTarget == item.id}
      id={item.id}
      on:dragenter={handleDragEnter} 
      on:dragleave={handleDragLeave}  
      on:drop={handleDragDropGroup}
      on:dragover={handleDragOver}
   >
      <div class="group-title">
        {#if $state.groups.length > 1}  
          <b>
            {#if item.id === UngroupedId}
              Ungrouped
            {:else}

            <ClickEdit
              text={groups[item.id].name}
              handleSave={(text)=>{
                const newGroups = cloneDeep($state.groups)
                const idx = newGroups.findIndex(g=>g.id==item.id)
                if (idx >= 0) {
                  newGroups[idx].name = text
                  tsStore.boardList.requestBoardChanges($activeHash, [
                    {
                      type: "set-groups",
                      groups: newGroups
                    }
                  ])
                }
              }}></ClickEdit>
              
            {/if}
          </b>
        {/if}
      </div>
      <div class="stickies"
      >
    {#each sorted(item.stickyIds, sortStickies) as { id, props } (id)}
      {#if editingStickyId === id}
        <StickyEditor
          handleSave={updateSticky}
          handleDelete={
            ()=>deleteSticky(id)
          }
          {cancelEdit}
          groupId={item.id}
          props={cloneDeep(props)}
        />
      {:else}
        <div 
          class="sticky {props.color}"
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
                <div class="vote-icon-wrapper">
                  <EmojiIcon emoji={emoji} class="vote-icon" />
                </div>
                <span class="num-votes">{countVotes(props.votes, type)}</span>
                <div class="vote-counts">
                  {#each [...Array(parseInt(maxVotes)).keys()] as index}
                    <div class="vote-count" class:vote-count-potential={myVotes(props.votes, type) <= index} />
                  {/each}
                  <div class="vote-count-background">
                    {#each [...Array(parseInt(maxVotes)).keys()] as index}
                    <div class="vote-count background" />
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/each}
    {#if creatingInGroup !== undefined  && creatingInGroup == item.id}
      <StickyEditor handleSave={createSticky} {cancelEdit} />
    {/if}
    </div>

    <div class="add-sticky" on:click={newSticky(item.id)}>
      <div style="display: flex;">
        Add Sticky
        <div style="margin-left:5px"><Fa icon={faPlus}/></div>
      </div>
    </div>
    </div>

  </Masonry>
 
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
    width: 100vw;
    padding-bottom: 30px;
  }

  .top-bar {
    width: calc(100% - 9px);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    z-index: 5;
    top: 100px;
    left: 0;
    height: 0;
    padding: 0 15px;
  }

  .left-items {
    display: flex;
    align-items: center;
  }

  .right-items {
    display: flex;
    align-items: center;
  }

  .groups {
    display: flex;
    flex-wrap: wrap;
    overflow-y: auto;
    gap: 15px;
    flex-direction: row;
    margin-right: -15px;
    padding-bottom: 30px;
  }

  .group {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 290px;
    border: 2px dashed rgba(84, 54, 19, .20);
    background-color: rgb(77 65 50 / 4%);
    border-radius: 15px;
    padding-top: 30px;
    padding-bottom: 15px;
  }

  .group-title {
    white-space: nowrap;
    overflow: hidden;
    font-size: 16px;
    position: absolute;
    top: -21px;
    border-radius: 10px;
    left: 50%;
    transform: translateX(-50%) scale(1);
    max-width: 270px;
    display: flex;
    padding: 5px 12px;
    align-items: center;
    box-shadow: 0px 5px 8px rgb(130 107 58 / 25%);
    transition: all .25s ease;
    border: 2px solid rgb(166 115 55 / 26%);
    border-bottom: 2px solid rgb(84 54 19 / 40%);
    border-top: 2px solid rgba(255,255,255,.8);
    background: linear-gradient(180deg, rgb(246, 245, 244) 0%, #ffffff 100%);
  }

  .group-title:hover {
    transform: translateX(-50%) scale(1.15);
  }

  .stickies {
    display: flex;
    justify-content: center;
    width: 100%;
    flex-wrap: wrap;
  }

  .glowing {
    outline: none;
    border-color: #9ecaed;
    box-shadow: 0 0 10px #9ecaed !important;
  }

  .tilted {
    transform: rotate(3deg);
    box-shadow: 0px 15px 25px rgb(130 107 58 / 45%) !important;
  }

  .sticky, .add-sticky {
    min-width: 250px;
    width: 100%;
    margin: 0px 15px 15px 15px;
    padding: 10px;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: -.015rem;
    color: #000000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(180deg, rgb(246, 245, 244) 0%, #ffffff 100%);
    box-shadow: 0px 5px 8px rgb(130 107 58 / 25%);
    border-radius: 10px;
    border: 2px solid rgb(166 115 55 / 26%);
    border-bottom: 2px solid rgb(84 54 19 / 40%);
    border-top: 2px solid rgba(255,255,255,.5);
    transition: all .25s ease;
    transform: scale(1);
  }

  .sticky:hover, .add-sticky:hover {
    transform: scale(1.05);
    box-shadow: 0px 10px 15px rgb(130 107 58 / 25%);
  }

  .yellow {
    background: linear-gradient(180deg, #F9FFC4 0%, #F7F7EC 100%);
  }

  .green {
    background: linear-gradient(180deg, #D9FEFA 0%, #F1F7EC 100%);
  }

  .skyblue {
    background: linear-gradient(180deg, #d0f2fe 0%, #ECF4F7 100%);
  }

  .deepblue {
    background: linear-gradient(180deg, #8dc9eb 0%, #ECF2F7 100%);
  }

  .purple {
    background: linear-gradient(180deg, #DCD1FD 0%, #F5ECF7 100%);
  }

  .red {
    background: linear-gradient(180deg, #FFD5E6 0%, #F7ECEC 100%);
  }

  .grey {
    background: linear-gradient(180deg, #d2d2d2 0%, #FFFFFF 100%);
  }

  .sticky-content {
    overflow-y: auto;
  }
  .votes {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: auto;
  }
  .vote {
    display: flex;
    margin: 5px;
    align-items: center;
    background: rgba(0,0,0,.06);
    border-radius: 10px;
    flex-basis: 26px;
    height: 30px;
    padding: 0 5px;
    box-shadow: 0 4px 5px rgba(0,0,0,.1);
    position: relative;
    font-size: 11px;
    transition: all .25s ease;
    cursor: pointer;
    border: 2px solid rgb(166 115 55 / 26%);
    border-bottom: 2px solid rgb(84 54 19 / 40%);
    border-top: 2px solid rgba(255,255,255,.4);
    transition: all .25s ease;
    transform: scale(1);
  }

  .white .vote {
    border-top: 2px solid rgb(166 115 55 / 26%);
  }

  .vote:hover {
    transform: scale(1.25);
  }

  .voted {
    border-color: rgba(110, 174, 47, 1.0);
    background-color: rgba(110, 174, 47, .70);
    box-shadow: 0 4px 5px rgba(0,0,0,.2);
    border-bottom: 2px solid rgba(70, 134, 7, 1.0);
    border-top: 2px solid rgb(148, 220, 77);
  }
  
  .vote-counts, .vote-count-background {
    padding-top: 2px;
    display: flex;
    flex-direction: row;
    position: absolute;
    justify-content: flex-start;
    bottom: -3px;
    justify-content: space-around;
    width: 80%;
    left: 50%;
    transform: translateX(-50%);
    position: absolute;
  }

  .vote-count-background {
    bottom: 0;
    width: 100%;
    z-index: 0;
  }

  .vote-count {
    position: relative;
    z-index: 1;
    border-radius: 10px;
    background-color: rgba(244, 200, 42, 1.0);
    width: 4px;
    height: 4px;
  }

  .vote-count-potential {
    background-color: rgba(100, 100, 100, 1.0);
  }


  .vote-count.background {
    bottom: -2px;
    background-color: rgba(70, 134, 8, 1.0);
    width: 8px;
    height: 8px;
  }

  @keyframes smoothExpansion {
    0% { top: 0; }
    80% {  top: -3px; }
    90% { top: 1px; }
    100% { top: 0; }
  }

  @keyframes compression {
    0% { top: 0px; }
    80% { top: 3px; }
    90% { top: -1px; }
    100% { top: 0px; }
  }

  .voted {
    animation-duration: 0.25s;
    animation-name: compression;
    animation-fill-mode: backwards;
    animation-timing-function: ease;
    animation-delay: .0;
    transition: all .25s ease;
  }


  .voted .vote-icon-wrapper {
    position: relative;
    animation-duration: 0.25s;
    animation-name: smoothExpansion;
    animation-fill-mode: backwards;
    animation-timing-function: ease;
    animation-delay: .25s;
  }

  .num-votes {
    display: block;
    padding-left: 5px;
    animation-duration: 0.25s;
    animation-timing-function: ease;
    animation-name: smoothExpansion;
    animation-delay: .15s;
    position: relative;
  }

  .voted.vote .num-votes {
    color: white;
  }

  .add-sticky {
    opacity: 0.5;
    font-weight: bold;
    transition: all .25s ease;
    width: -webkit-fill-available;
  }

  .add-sticky div {
    justify-content: center;
  }

  .add-sticky:hover {
    cursor: pointer;
    opacity: 1;
    box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.1);
  }

  .add-group, .sortby {
    font-size: 14px;
    font-weight: bold;
    background: #FFFFFF;
    border: 2px solid rgb(166 115 55 / 26%);
    border-bottom: 2px solid rgb(84 54 19 / 50%);
    border-top: 2px solid rgb(166 115 55 / 15%);
    box-shadow: 0px 15px 25px rgb(130 107 58 / 25%);
    border-radius: 10px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    transition: all .25s ease;
    transform: scale(1);
}

.sortby {
  font-weight: normal;
  color: rgba(95, 90, 83, .5);
}

.add-group:active {
  border-color: rgb(76, 106, 167);
  background-color: rgb(77, 123, 214);
  box-shadow: 0 4px 5px rgba(0,0,0,.2);
  border-bottom: 2px solid rgb(60, 83, 127);
}

.add-group:hover {
  cursor: pointer;
  transform: scale(1.1);
}

:global(hr) {
    opacity: .4;
}
</style>
