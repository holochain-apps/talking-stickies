<script lang="ts">
    import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
    import '@shoelace-style/shoelace/dist/components/button/button.js';
    import "@holochain-open-dev/profiles/dist/elements/update-profile.js";

    import AvatarIcon from './AvatarIcon.svelte';

    export let avatar
    export let handleSave

    export const close=()=>{dialog.hide()}
    export const open=()=>{dialog.show()}
    let dialog
</script>

<sl-dialog label="Edit Profile" bind:this={dialog}>
  <update-profile on:cancel-edit-profile={()=>dialog.hide()} on:profile-updated={()=>dialog.hide()}></update-profile>
    <!-- <div class="avatar-editor">
      <sl-input label="Name" class='textarea' value={avatar.name} on:input={e=>avatar.name=e.target.value} ></sl-input>
       
      <span class="row" style="margin-top:10px;align-items:flex-end">
        <sl-input label="Avatar Image URL" class='textarea' value={avatar.url} on:input={e=>avatar.url=e.target.value}></sl-input>
        <AvatarIcon avatar={avatar} size={30} style="margin-right:10px"/>
      </span>
      <div class='controls'>
        <div id="cancel-button" >
          <sl-button
            label="Cancel"
            on:click={() => close()}
            style=" margin-right: 16px"
            >Cancel</sl-button>
        </div>
        <div id="save-button" >
          <sl-button 
            on:click={() => {close();handleSave(avatar)}}
            variant=primary>Save</sl-button>
        </div>
      </div>
    </div> -->
</sl-dialog>

<style>
    .row {
      display: flex;
      align-items: center;
    }
    .avatar-editor {
      display: flex;
      flex-basis: 270px;
      font-style: normal;
      font-weight: 600;
      color: #000000;
      flex-direction: column;
      justify-content: flex-start;
    }
    .controls {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      padding-left: 7px;
      padding-top: 10px;
    }
    .textarea {
      width: 100%;
      font-weight: normal;
    }

    sl-dialog::part(panel) {
        background: #FFFFFF;
        border: 2px solid rgb(166 115 55 / 26%);
        border-bottom: 2px solid rgb(84 54 19 / 50%);
        border-top: 2px solid rgb(166 115 55 / 5%);
        box-shadow: 0px 15px 40px rgb(130 107 58 / 35%);
        border-radius: 10px;
    }
</style>