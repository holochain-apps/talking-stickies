<script lang="ts">
    import '@shoelace-style/shoelace/dist/components/button/button.js';
    import ParticipantsDialog from './ParticipantsDialog.svelte';
    import Avatar from './Avatar.svelte';
    import AvatarDialog from './AvatarDialog.svelte';
    import { getContext, onMount } from "svelte";
    import type { TalkingStickiesStore } from "./tsStore";
    import { get } from 'svelte/store';    
    import Fa from 'svelte-fa'
    import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
    import { isWeContext } from '@lightningrodlabs/we-applet';

    const { getStore } :any = getContext('tsStore');
    const store:TalkingStickiesStore = getStore();
    //@ts-ignore
    $: myProfile = get(store.profilesStore.myProfile).value
    $: myName =  myProfile ? myProfile.nickname  : ""
    let participantsDialog
    let editAvatarDialog

    onMount(async () => {
        // if (!myName) {
        //     editAvatarDialog.open()
        // }
	});

    const editAvatar = () => {
        editAvatarDialog.open()
    }

</script>
<div class="nav-button tool-item participants" on:click={()=>{participantsDialog.open()}}  title="Show Participants">
    <Fa icon={faUserGroup} size=2x/></div>
{#if !isWeContext()}
    <div class="nav-button tool-item" on:click={editAvatar} title={myName ? myName:"Edit Avatar"}>
        <Avatar size={30} agentPubKey={store.myAgentPubKey()} placeholder={true} showNickname={false}/>
    </div>
{/if}

<ParticipantsDialog bind:this={participantsDialog}/>

<AvatarDialog bind:this={editAvatarDialog} />

<style>
    .tool-item {
        background: #FFFFFF;
        border: 2px solid rgb(166 115 55 / 26%);
        border-bottom: 2px solid rgb(84 54 19 / 50%);
        border-top: 2px solid rgb(166 115 55 / 15%);
        box-shadow: 0px 15px 20px rgb(130 107 58 / 15%);
        border-radius: 10px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all .25s ease;
        transform: scale(1);
    }

    .tool-item:hover {
    cursor: pointer;
    transform: scale(1.15);
    }

    .participants {
        margin-right: 15px;
    }

    .tool-item:hover {
        cursor: pointer;
    }
</style>