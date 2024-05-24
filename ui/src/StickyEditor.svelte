<script lang='ts'>
  import { getContext, onMount } from "svelte";
  import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
  import '@shoelace-style/shoelace/dist/components/button/button.js';
  import CancelIcon from "./icons/CancelIcon.svelte";
  import TrashIcon from "./icons/TrashIcon.svelte";
  import AcceptIcon from "./icons/AcceptIcon.svelte";
  import type { v1 as uuidv1 } from "uuid";
  import type { StickyProps } from "./board";
  import { onVisible } from "./util";
  import type { TalkingStickiesStore } from "./store";
  import SvgIcon from "./SvgIcon.svelte";
  import AttachmentsList from "./AttachmentsList.svelte";
  import { weaveUrlFromWal } from "@lightningrodlabs/we-applet";

  const { getStore } :any = getContext('store');
  const store:TalkingStickiesStore = getStore();

  export let handleSave
  export let handleDelete = undefined
  export let cancelEdit

  const DEFAULT_PROPS = {text:"", color:"", votes:{}, attachments:[]}

  export let props:StickyProps = DEFAULT_PROPS
  export let stickyId:uuidv1 = ""
  export let groupId = undefined

  let inputElement


  const colors=["white", "yellow", "green", "skyblue", "deepblue", "purple",  "red", "grey"]
  const setColor = (color) => {
    props.color = color
    props = props
  }

  onMount(async () => {
    onVisible(inputElement,()=>{
        inputElement.focus()
    })
	});

  const addAttachment = async (stickyId: string) => {
    const wal = await store.weaveClient.userSelectWal()
    if (wal) {
      if (props.attachments === undefined) {
        props.attachments = []
      }
      props.attachments.push(weaveUrlFromWal(wal))
      props = props

    }
  }
  const removeAttachment = (idx: number) => {
    props.attachments.splice(idx,1)
    props = props

  }

</script>
<div class='sticky-editor {props.color}'>
  <div class="input-wrapper" data-replicated-value={props.text}>
    <sl-textarea class="sticky-input" rows="1" size="small" value={props.text} bind:this={inputElement}
      on:sl-input={e=>{
        props.text = e.target.value;
      }}
      on:keydown={(e)=> {
        if (e.keyCode == 27) {
          cancelEdit()
        }
        if(e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          handleSave(groupId, props)
        }
      }
    }>
    </sl-textarea>
  </div>
  <div class="color-buttons">
    {#each colors as color}
      <div class="color-button {props.color == color ? " selected":""} {color}" on:click={()=>setColor(color)}></div>
    {/each}
  </div>
  <div class='controls'>
    <div>
    {#if handleDelete}
      <button class="control" on:click={()=>handleDelete(stickyId)} ><TrashIcon /></button>
    {/if}
    </div>
    <div>
      {#if store.weaveClient}
        <button class="control" on:click={()=>addAttachment(stickyId)} >          
          <SvgIcon icon=link/>
        </button>
      {/if}
      <button class="control" on:click={()=>cancelEdit(stickyId)} ><CancelIcon /></button>
      <button class="control" on:click={() => handleSave(groupId, props)} ><AcceptIcon /></button>
    </div>
  </div>
  {#if store.weaveClient && props.attachments}
    <AttachmentsList attachments={props.attachments} 
      on:remove-attachment={(e)=>removeAttachment(e.detail)}
    />
  {/if}

</div>

<style>
  .sticky-editor {
    min-width: 250px;
    width: 100%;
    max-width: 360px;
    margin: 0px 15px 15px 15px;
    padding: 10px;
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(180deg, rgb(246, 245, 244) 0%, #ffffff 100%);
    box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    border: 2px solid rgb(166 115 55 / 26%);
    border-bottom: 2px solid rgb(84 54 19 / 40%);
    border-top: 2px solid rgba(255,255,255,.8);
    transition: all .25s ease;
    transform: scale(1);
  }

  .sticky-editor:hover {
    transform: scale(1.05);
  }

  .input-wrapper {
    display: grid;
    margin-top: -2px;
    margin-bottom: -2px;
  }

  .input-wrapper::after {
    content: attr(data-replicated-value) " ";
    white-space: pre-wrap;
    padding: 0px 0px;
    letter-spacing: -.015rem;
    line-height: 16px;
    font-size: 14px;
    visibility: hidden;
    color: red;
    margin-top: 3px;
    padding-bottom: 5px;
  }
  
  .controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .controls > div {
    display: flex;
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

  .control:hover {
    transform: scale(1.3);
  }

  .color-buttons {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    margin-left: 5px;
    margin-right: 5px;
    margin-top: 8px;
    margin-bottom: 3px;
  }

  .color-button {
    border: 2px solid rgb(166 115 55 / 16%);
    border-bottom: 2px solid rgb(84 54 19 / 25%);
    border-top: none;
    box-shadow: 0px 3px 5px rgb(130 107 58 / 25%);
    width: 15px;
    height: 15px;
    margin: 2px;
    border-radius: 5px;
    transition: all .25s ease;
    transform: scale(1);
  }

  .color-button:hover {
    transform: scale(1.35);
    cursor: pointer;
  }

  .sticky-input {
    width: 100%;
  }

  .sticky-input::part(base) {
    background-color: transparent;
    outline: transparent;
    border: transparent;
  }

  .sticky-input::part(form-control), .sticky-input::part(form-control-input), .sticky-input::part(base) {
    height: calc(100% - 2px);
  }

  .sticky-input::part(textarea) {
    letter-spacing: -.015rem;
    line-height: 16px;
    font-size: 14px;
    margin-top: 5px;
    margin-left: 0;
    margin-right: 0;
    resize: vertical;
    height: 100%;
    overflow: hidden;
    font-family: 'Figtree', sans-serif;
    padding: 0;
    padding-bottom: 8px;
  }

  sl-textarea.sticky-input, .input-wrapper::after  {
    grid-area: 1 / 1 / 2 / 2;
  }

  .selected {
    outline: 2px solid rgba(23, 132, 199, 1.0);
  }

  .white {
    background: linear-gradient(180deg,  rgba(252, 250, 243, 1.0) 0%, #FFFFFF 100%);
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
</style>