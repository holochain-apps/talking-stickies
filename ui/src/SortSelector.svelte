<script lang="ts">
  import EmojiIcon from './icons/EmojiIcon.svelte'
  import { getContext } from "svelte";
  import type { TalkingStickiesStore } from "./store";

  export let setSortOption
  export let sortOption

  const handleClick = option => () => {
    if (option === sortOption) {
      setSortOption(null)
    } else {
      setSortOption(option)
    }
  }
  const { getStore } :any = getContext("store");
  let store: TalkingStickiesStore = getStore();

  $: activeBoard = store.boardList.activeBoard;
  $: state = $activeBoard ? $activeBoard.readableState() : undefined

</script>

<div class='sort-options'>
  {#if $state}
    {#each $state.voteTypes as {type, toolTip, emoji}}
    <div class="wrapper sort-button" on:click={handleClick(type)} class:selected={sortOption === type} title="Sort by '{emoji}'">
      <EmojiIcon emoji="{emoji}" on:click={handleClick(type)}/>
    </div>
    {/each}
  {/if}
</div>

<style>
  .sort-options {
    display: flex;
  }
  .wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
  }

  .sort-button {
    display: flex;
    margin: 5px;
    align-items: center;
    background: rgba(0,0,0,.06);
    border: 2px solid rgba(0,0,0,.07);
    border-radius: 10px;
    flex-basis: 26px;
    height: 30px;
    padding: 0 5px;
    box-shadow: 0 4px 5px rgba(0,0,0,.1);
    position: relative;
    font-size: 11px;
    transition: all .25s ease;
    cursor: pointer;
    border-bottom: 2px solid rgba(0,0,0,.2);
    transition: all .25s ease;
    transform: scale(1);
  }

  .sort-button:hover {
    transform: scale(1.3);
  }

  .sort-button.selected {
    
    border: 2px solid rgb(76, 106, 167);
    border-top: 2px solid rgb(123, 166, 252);
    background-color: rgb(77, 123, 214);
    box-shadow: 0 4px 5px rgba(0,0,0,.2);
  }
</style>