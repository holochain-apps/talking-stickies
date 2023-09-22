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
      <span style="display:flex;align-items:center;cursor:pointer" on:click={()=>{store.setUIprops({showMenu:false})}}><div class="close"  title="Hide Board Menu"><Fa icon={faClose} size=2x /></div></span>

    {:else}
      <div class="nav-button open" on:click={()=>{store.setUIprops({showMenu:true})}}  title="Show Board Menu"><Fa color="#fff" icon={faBars} size=2x /></div>
    {/if}
  {/if}

  <div class="items"><Search></Search></div>

  <div class="items">
    <Folk profilesStore={profilesStore}></Folk>
    <a href="https://github.com/holochain-apps/talking-stickies/issues" title="Report a problem in our GitHub repo" target="_blank">
      <div class="nav-button"><Fa icon={faBug} size=2x style={bugColor} /></div>
    </a>
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
    background: linear-gradient(90.1deg, #143C77 4.43%, #261492 99.36%);
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