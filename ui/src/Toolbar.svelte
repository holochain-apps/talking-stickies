<script lang="ts">
  import TSLogoIcon from "./icons/TSLogoIcon.svelte";
  import BoardMenu from "./BoardMenu.svelte";
  import Folk from "./Folk.svelte";
  import AboutDialog from "./AboutDialog.svelte";
  import type { ProfilesStore } from "@holochain-open-dev/profiles";
  import { faBug, faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import { getContext } from "svelte";
  import type { TalkingStickiesStore } from "./tsStore";

  import type WebSdk from '@holo-host/web-sdk'

  export const IS_HOLO = ['true', '1', 't'].includes(import.meta.env.VITE_APP_IS_HOLO?.toLowerCase())

  export let profilesStore: ProfilesStore|undefined

  let aboutDialog
  $:bugColor = "color: #5536f9"

  const { getStore } :any = getContext("tsStore");
  let tsStore: TalkingStickiesStore = getStore();

  const holoLogout = async () => {
    await (tsStore.client as WebSdk).signOut();
    (tsStore.client as WebSdk).signIn({ cancellable: false })
  }

</script>

  <AboutDialog bind:this={aboutDialog} />
<div class='toolbar'>
  <div class="left-items">
    <div class="logo" title="About TalkingStickies!" on:click={()=>aboutDialog.open()}><TSLogoIcon /></div>
    <BoardMenu ></BoardMenu>
  </div>
  <div class="right-items">
    <Folk profilesStore={profilesStore}></Folk>
    <a href="https://github.com/holochain-apps/talking-stickies/issues" title="Report a problem in our GitHub repo" target="_blank">
      <div class="nav-button"><Fa icon={faBug} size=2x style={bugColor} /></div>
    </a>
    {#if IS_HOLO}
      <div title="Logout" on:click={() => holoLogout()} class="nav-button"><Fa icon={faArrowUpFromBracket} size=2x  /></div>
    {/if}
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
    background-color: #eeeeee;
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
  .right-items {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }
  .left-items {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }
</style>