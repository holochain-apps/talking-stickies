<script lang="ts">
  import "@shoelace-style/shoelace/dist/components/skeleton/skeleton.js";
  import { getContext } from "svelte";
  import type { TalkingStickiesStore } from "./store";
  import Avatar from './Avatar.svelte';
  import AgentName from './AgentName.svelte';
  import "@holochain-open-dev/stores/dist/debug-store.js"

  const { getStore } :any = getContext('store');
  const store:TalkingStickiesStore = getStore();

  $: agents = store.profilesStore.agentsWithProfile
  $: agentBoards = store.boardList.allAgentBoards

</script>

<div class="participants">
    <div class="list">
        {#if $agents.status == "pending"}
            <sl-skeleton
                effect="pulse"
                style="height: 40px; width: 100%"
            ></sl-skeleton>
        {:else}
            {#each $agents.status=="complete" ? Array.from($agents.value) : [] as agentPubKey}
                <div class="list-item">
                    <div class="avatar">
                        <Avatar agentPubKey={agentPubKey} size={40} showNickname={false}/>
                    </div>
                    <div class="meta-data">
                        <div class="avatar-pad">
                            <AgentName agentPubKey={agentPubKey}/>
                        </div>
                        {#if $agentBoards.status=="complete"}
                        <div class="boards">
                            {#each $agentBoards.value.get(agentPubKey) as board}
                                <div class="board" on:click={()=>{
                                    store.boardList.setActiveBoard(board.board.hash)
                                    store.setUIprops({showMenu:false})
                                }}>{board.latestState.name}</div>
                            {/each}
                        </div>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .boards {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        padding-top: 10px;
    }
    .board {
        border-radius: 5px;
        border: 2px solid rgb(166 115 55 / 26%);
        font-size: 90%;
        font-weight: bold;
        padding: 2px;
        justify-content: center;
        display: flex;
        margin-bottom: 5px;
        cursor: pointer;
        width: 100%;
    }
    .board:hover {
        box-shadow: 0px 10px 35px rgb(130 107 58 / 25%);
        transform: scale(1.1);
    }
    .list {
        display: flex;
        flex-direction: column;
    }
    .list-item {
        display: flex;
        align-items: center;
        position: relative;
    }

    .list-item:hover {
        z-index: 100;
    }

    .avatar-pad {
        padding-left: 50px;
        height: 40px;
        display: flex;
        align-items: center;
    }

    .list-item .meta-data {
        border-radius: 5px;
        position: absolute;
        transition: all .25s ease;
        transform: scale(0%);
        z-index: 0;
        top: -40px;
        left: -40px;
        padding: 10px;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: -.015rem;
        background: linear-gradient(180deg, rgb(246, 245, 244) 0%, #ffffff 100%);
        box-shadow: 0px 5px 8px rgb(130 107 58 / 25%);
        border-radius: 10px;
        border: 2px solid rgb(166 115 55 / 26%);
        border-bottom: 2px solid rgb(84 54 19 / 40%);
        border-top: 2px solid rgba(255,255,255,.5);
        transition: all .25s ease;
    }

    .list-item:hover .meta-data {
        transform: scale(100%);
        top: -10px;
        left: -10px;
    }

    .avatar {
        position: relative;
        z-index: 1;
    }

    .avatar:hover {
        cursor: pointer;
    }
</style>
