<script lang='ts'>
  import { onMount } from "svelte";
  import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
  import '@shoelace-style/shoelace/dist/components/button/button.js';
  import CancelIcon from "./icons/CancelIcon.svelte";
  import TrashIcon from "./icons/TrashIcon.svelte";
  import AcceptIcon from "./icons/AcceptIcon.svelte";
  import type { v1 as uuidv1 } from "uuid";
  import type { StickyProps } from "./board";
  import { onVisible } from "./util";

  export let handleSave
  export let handleDelete = undefined
  export let cancelEdit

  const DEFAULT_PROPS = {text:"", color:"", votes:{}}

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
      <button class="control" on:click={()=>cancelEdit(stickyId)} ><CancelIcon /></button>
      <button class="control" on:click={() => handleSave(groupId, props)} ><AcceptIcon /></button>
    </div>
  </div>
</div>

<style>
  .sticky-editor {
    max-width: 499px;
    min-width: 250px;
    width: 100%;
    margin: 10px;
    padding: 10px;
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(180deg,  rgba(252, 250, 243, 1.0) 0%, #FFFFFF 100%);
    box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    border: 2px solid rgba(0,0,0,.1);
    transition: all .25s ease;
  }

  .input-wrapper {
    display: grid;
    margin-top: -2px;
    margin-bottom: -2px;
  }

  .input-wrapper::after {
    content: attr(data-replicated-value) " ";
    white-space: pre-wrap;
    padding: 7px 10px;
    letter-spacing: -.015rem;
    line-height: 16px;
    font-size: 14px;
    visibility: hidden;
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
    box-shadow: 0 4px 5px rgba(0,0,0,.2);
    position: relative;
    font-size: 11px;
    transition: all .25s ease;
    cursor: pointer;
    border-bottom: 2px solid rgba(0,0,0,.25);
  }



  .color-buttons {
    display: flex;
    justify-content: flex-end;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    margin-left: 5px;
    margin-right: 5px;
  }

  .color-button {
    box-shadow: 0 4px 5px rgba(0,0,0,.2);
    width: 15px;
    height: 15px;
    margin: 2px;
    border: 2px solid white;
    border-radius: 3px;
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
    margin-top: -16px;
    margin-left: -15px;
    margin-right: -14px;
    resize: none;
    height: 100%;
    overflow: hidden;
    font-family: Roboto,'Open Sans','Helvetica Neue',sans-serif;
    padding: 15px;
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
    background: linear-gradient(180deg, #D0EBFE 0%, #ECF4F7 100%);
  }

  .deepblue {
    background: linear-gradient(180deg, #78C8F7 0%, #ECF2F7 100%);
  }

  .purple {
    background: linear-gradient(180deg, #DCD1FD 0%, #F5ECF7 100%);
  }

  .red {
    background: linear-gradient(180deg, #FFD5E6 0%, #F7ECEC 100%);
  }

  .grey {
    background: linear-gradient(180deg, #E4E4E4 0%, #FFFFFF 100%);
  }
</style>