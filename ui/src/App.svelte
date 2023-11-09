<script lang="ts">
  import Controller from './Controller.svelte'
  import { AppAgentWebsocket, AdminWebsocket } from '@holochain/client';
  import '@shoelace-style/shoelace/dist/themes/light.css';
  import { WeClient, isWeContext } from '@lightningrodlabs/we-applet';
  import { ProfilesClient, ProfilesStore } from '@holochain-open-dev/profiles';
  import "@holochain-open-dev/profiles/dist/elements/profiles-context.js";
  import "@holochain-open-dev/profiles/dist/elements/profile-prompt.js";
  import "@holochain-open-dev/profiles/dist/elements/create-profile.js";

  const appId = import.meta.env.VITE_APP_ID ? import.meta.env.VITE_APP_ID : 'talking-stickies'
  const roleName = 'talking-stickies'
  const appPort = import.meta.env.VITE_APP_PORT ? import.meta.env.VITE_APP_PORT : 8888
  const adminPort = import.meta.env.VITE_ADMIN_PORT
  const url = `ws://localhost:${appPort}`;

  let client: AppAgentWebsocket
  let profilesStore : ProfilesStore|undefined = undefined

  let connected = false
  initialize()

  async function initialize() : Promise<void> {
    let profilesClient
    if (!isWeContext()) {
      console.log("adminPort is", adminPort)
      if (adminPort) {
        const adminWebsocket = await AdminWebsocket.connect(new URL(`ws://localhost:${adminPort}`))
        const x = await adminWebsocket.listApps({})
        console.log("apps", x)
        const cellIds = await adminWebsocket.listCellIds()
        console.log("CELL IDS",cellIds)
        await adminWebsocket.authorizeSigningCredentials(cellIds[0])
      }
      console.log("appPort and Id is", appPort, appId)
      client = await AppAgentWebsocket.connect(new URL(url), appId)
      profilesClient = new ProfilesClient(client, appId);
    } 
    else {
      const weClient = await WeClient.connect();

      if (
        !(weClient.renderInfo.type === "applet-view")
        && !(weClient.renderInfo.view.type === "main")
      ) throw new Error("This Applet only implements the applet main view.");

      //@ts-ignore
      client = weClient.renderInfo.appletClient;
      //@ts-ignore
      profilesClient = weClient.renderInfo.profilesClient;
    }
    profilesStore = new ProfilesStore(profilesClient);
    connected = true
  }
  $: prof = profilesStore ? profilesStore.myProfile : undefined

</script>

<svelte:head>
</svelte:head>
{#if connected}
  <profiles-context store={profilesStore}>
    {#if $prof.status=="complete" && $prof.value == undefined}
    <div class="create-profile">
      <create-profile
        on:profile-created={()=>{}}
      ></create-profile>
    </div>
    {:else}
      <Controller  client={client} profilesStore={profilesStore} roleName={roleName}></Controller>
    {/if}

  </profiles-context>
{:else}
  Connecting...
{/if}

<style>
  :global(body) {
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>