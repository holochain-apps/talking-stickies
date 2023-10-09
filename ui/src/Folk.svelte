<script lang="ts">
    import '@shoelace-style/shoelace/dist/components/button/button.js';
    import ParticipantsDialog from './ParticipantsDialog.svelte';
    import type { Avatar } from './boardList';
    import AvatarDialog from './AvatarDialog.svelte';
    import { getContext, onMount } from "svelte";
    import type { TalkingStickiesStore } from "./tsStore";
    import { cloneDeep } from "lodash";
    import AvatarIcon from './AvatarIcon.svelte';
    import type { ProfilesStore } from "@holochain-open-dev/profiles";
    import { get } from 'svelte/store';    
    import Fa from 'svelte-fa'
    import { faUserGroup } from '@fortawesome/free-solid-svg-icons';

    const { getStore } :any = getContext('tsStore');
    const store:TalkingStickiesStore = getStore();
    const myAgentPubKey = store.myAgentPubKey()
    $: avatars = store.boardList.avatars()
    //@ts-ignore
    $: myProfile = profilesStore ? get(profilesStore.myProfile).value : undefined
    $: myName =  myProfile ? myProfile.nickname : $avatars[myAgentPubKey]? $avatars[myAgentPubKey].name : ""
    $: myAvatar = $avatars[myAgentPubKey]? $avatars[myAgentPubKey] : undefined
    $: participants = store.boardList.participants()
    let participantsDialog
    let editAvatarDialog
    let avatar: Avatar = {name:"", url:""}
    export let profilesStore: ProfilesStore|undefined

    onMount(async () => {
        if (!myName) {
            editAvatarDialog.open()
        }
	});

    const editAvatar = () => {
        const myAvatar = $avatars[store.myAgentPubKey()]
        if (myAvatar) {
        avatar = myAvatar
        }
        editAvatarDialog.open()
    }
    const setAvatar = (avatar: Avatar) => {
        store.boardList.requestChanges([{type:'set-avatar', pubKey:store.myAgentPubKey(), avatar:cloneDeep(avatar)}])
        editAvatarDialog.close()
    }

</script>
<div class="nav-button tool-item participants" on:click={()=>{participantsDialog.open()}}  title="Show Participants">
    <Fa icon={faUserGroup} size=2x/>{$participants.active.length }</div>
{#if !profilesStore}
<div class="nav-button tool-item" on:click={editAvatar} title={myName ? myName:"Edit Avatar"}>
    <AvatarIcon size={30} avatar={myAvatar} border={false}></AvatarIcon></div>
{/if}

<ParticipantsDialog bind:this={participantsDialog} avatars={$avatars} profilesStore={profilesStore}/>

<AvatarDialog handleSave={setAvatar} bind:this={editAvatarDialog} avatar={avatar} />

<style>
    .tool-item {
        background: #FFFFFF;
        border: 2px solid rgb(166 115 55 / 26%);
        border-bottom: 2px solid rgb(84 54 19 / 40%);
        box-shadow: 0px 15px 20px rgb(130 107 58 / 15%);
        border-radius: 10px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .participants {
        margin-right: 15px;
    }

    .tool-item:hover {
        cursor: pointer;
    }
</style>