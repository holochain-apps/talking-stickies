<script lang='ts'>
  import { onMount } from "svelte";
  import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
  import '@shoelace-style/shoelace/dist/components/button/button.js';
  import type { v1 as uuidv1 } from "uuid";
  import type { StickyProps } from "./board";

  export let handleSave
  export let handleDelete = undefined
  export let cancelEdit

  const DEFAULT_PROPS = {text:"", color:"", votes:{}}

  export let props:StickyProps = DEFAULT_PROPS
  export let stickyId:uuidv1 = ""
  export let groupId = undefined

  let inputElement


  const colors=["white","#D4F3EE","#E0D7FF","#FFCCE1","#D7EEFF", "#FAFFC7", "red", "green", "yellow", "LightSkyBlue", "grey"]
  const setColor = (color) => {
    props.color = color
    props = props
  }


</script>
<div class='sticky-editor' style:background-color={props.color}>
  <div class="sticky-elements">
    <sl-textarea rows=10 class='textarea' value={props.text} bind:this={inputElement}
    on:sl-input={e=>props.text = e.target.value}></sl-textarea>
    <div class="color-buttons">
      {#each colors as color}
        <div class="color-button{props.color == color?" selected":""}" on:click={()=>setColor(color)} style:background-color={color}></div>
      {/each}
    </div>
  </div>
  <div class='controls'>
    {#if handleDelete}
    <sl-button size="small" variant="danger" on:click={()=>handleDelete(stickyId)}>
      Delete
    </sl-button>
    {/if}
    <sl-button size="small" style="margin-left:5px" on:click={()=>{close();cancelEdit()}}>
      Cancel
    </sl-button>
    <sl-button size="small" style="margin-left:5px" variant="primary" on:click={() => handleSave(groupId, props) }>
      Save
    </sl-button>
  </div>
</div>

<style>
  .sticky-editor {
    display: flex;
    background-color: #D7EEFF;
    flex-basis: 270px;
    height: 265px;
    margin: 10px;
    padding: 10px;
    box-shadow: 4px 5px 13px 0px rgba(0,0,0,0.38);
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    justify-content: space-between;
    flex-direction: column;
  }
  .sticky-elements {
    display: flex;
    flex-direction: row;
    flex-basis: 100%;
  }
  .textarea {
    background-color: rgba(255, 255, 255, 0.72);
    border: 1px solid #C9C9C9;
    box-sizing: border-box;
    border-radius: 3px;
    width: 100%;
    height: 100%;
    font-weight: normal;
    padding: 2px;
  }
  .controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-left: 7px;
    padding-top: 5px;
  }
  .color-buttons {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    margin-left: 5px;
  }
  .color-button {
    width: 15px;
    height: 15px;
    margin: 2px;
    outline: 1px lightgray solid;
  }
  .selected {
    outline: 1px #000 solid;
  }
</style>