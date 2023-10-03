<script lang="ts">
  import Search from "./Search.svelte";
  import Folk from "./Folk.svelte";
  import type { ProfilesStore } from "@holochain-open-dev/profiles";
  import { faBars, faBug, faClose } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import type { TalkingStickiesStore } from "./tsStore";
  import { getContext } from "svelte";

  const { getStore } :any = getContext('tsStore');
  const store:TalkingStickiesStore = getStore();
  $: uiProps = store.uiProps
  $: activeHash = store.boardList.activeBoardHash;

  export let profilesStore: ProfilesStore|undefined

  let aboutDialog
  $:bugColor = "color: #5536f9"
</script>

<div class='toolbar'>
  {#if $activeHash}
    {#if $uiProps.showMenu}
      <div class="close tool-item menu" on:click={()=>{store.setUIprops({showMenu:false})}}><div title="Hide Board Menu"><Fa icon={faClose} size=2x /></div></div>

    {:else}
      <div class="open tool-item menu" on:click={()=>{store.setUIprops({showMenu:true})}}  title="Show Board Menu"><Fa icon={faBars} size=2x /></div>
    {/if}
  {/if}

  <div class="tool-item search"><Search></Search></div>

  <div class="items">
      <Folk profilesStore={profilesStore}></Folk>
      
    <div class="tool-item bugs">
      <a href="https://github.com/holochain-apps/talking-stickies/issues" title="Report a problem in our GitHub repo" target="_blank">
        <div class="nav-button"><Fa icon={faBug} size=2x style={bugColor} /></div>
      </a>
    </div>
  </div>
</div>

<style>
  .bug-link {
    padding: 8px 8px;
    display: flex;
    border-radius: 50%;
  }
  a:hover.bug-link {
    background-color: #ddd;
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 15px;
    padding-right: 10px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
  .logo {
    height: 40px;
    margin-right: 10px;
    display: contents;
    cursor: pointer;
  }

  .tool-item {
    background: #FFFFFF;
    border: 1px solid #EBEBEB;
    box-shadow: 0px 8px 10px rgba(30, 30, 30, 0.1);
    border-radius: 5px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu {
    width: 50px;
  }

  .search {
    padding: 0 10px 0 0;
  }

  .bugs {
    width: 50px;
  }

  .logo-text {
    padding-bottom: 5px;
    margin-left: 15px;
  }
  .items {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }
</style>