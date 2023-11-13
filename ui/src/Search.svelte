<script lang="ts">
    import { getContext } from "svelte";
    import { decodeHashFromBase64, encodeHashToBase64, type EntryHash, type EntryHashB64 } from '@holochain/client';
    import {faSearch } from '@fortawesome/free-solid-svg-icons';
    import Fa from 'svelte-fa';
    import '@shoelace-style/shoelace/dist/components/select/select.js';
    import '@shoelace-style/shoelace/dist/components/option/option.js';
    import '@shoelace-style/shoelace/dist/components/input/input.js';
    import '@shoelace-style/shoelace/dist/components/icon/icon.js';
    import '@shoelace-style/shoelace/dist/components/menu/menu.js';
    import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
    import '@shoelace-style/shoelace/dist/components/menu-label/menu-label.js';
    import type { v1 as uuidv1 } from "uuid";
    import type { TalkingStickiesStore } from "./tsStore";
    import { toPromise } from "@holochain-open-dev/stores";
    import type { BoardState, BoardStateData } from "./board";

    type FoundSticky = {
        hash: EntryHash,
        state: BoardState,
        sticky: uuidv1,
        text: string,
    }
    let foundStickies: Array<FoundSticky> = []
    let foundBoards: Array<BoardStateData> = []
    $: foundStickies
    $: foundBoards
    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();
    $: activeHashB64 = store.boardList.activeBoardHashB64;

    const selectBoard = async (hash: EntryHash) => {
        await store.boardList.setActiveBoard(hash)
    }

    const doSearch = async (text:string) => {
        const fb: BoardStateData[] = []
        const fs: FoundSticky[] = []
        showSearchResults = true
        if (text != "") {
            const searchText = text.toLocaleLowerCase()
            const all = await toPromise(store.boardList.allBoards)
            for (const [hash, asyncBoardData] of Array.from(all.entries()) ) {
                const state = asyncBoardData.latestState

                if (state.name.toLocaleLowerCase().includes(searchText) ||
                    state.props.description.toLocaleLowerCase().includes(searchText) 
                    ) fb.push({hash,state:state})
                state.stickies.forEach((c)=>{
                    if (c.props.text.toLocaleLowerCase().includes(searchText)) {
                        fs.push({
                            hash,
                            state,
                            sticky: c.id,
                            text: c.props.text,
                        })
                    }
                })
            }
        }
        foundBoards = fb
        foundStickies = fs
    }
    const clearSearch = () => {
        searchInput.value = ""
        showSearchResults = false
    }

    const getStickyGroup = (board: BoardState, stickyId: uuidv1) : string => {
        for (const [gId,stickies] of Object.entries(board.grouping)) {
            if (stickies.includes(stickyId)) {
                const g = (board.groups.find((g)=>g.id == gId))
                if (g) {
                    return g.name
                }
            }
        }
        return ""
    }

    let searchInput
    let showSearchResults = false

</script>

<div class="search">

<div style="position:relative; margin-left:10px;">
    <sl-input
        bind:this={searchInput}
        placeholder="Search"
        pill
        on:sl-input={async (e)=>doSearch(e.target.value)}
        on:sl-focus={async (e)=>doSearch(e.target.value)}
    >
    <span slot="prefix"style="margin-left:10px;"><Fa icon={faSearch}></Fa></span>
    </sl-input>
    {#if showSearchResults && (foundBoards.length>0 || foundStickies.length>0)}
    <sl-menu class="search-results"
    >
        {#if foundStickies.length>0}
            <sl-menu-label>Stickies</sl-menu-label>
            {#each foundStickies as found}
                {@const stickyGroup = getStickyGroup(found.state, found.sticky)}
                <sl-menu-item
                    on:mousedown={(e)=>{
                        if (encodeHashToBase64(found.hash) != $activeHashB64) {
                            selectBoard(found.hash)
                        }
                        //store.boardList.setActiveSticky(found.card)
                        clearSearch()
                    }}
                >
                <div style="margin-left:10px;display:flex;flex-direction: column;">
                    <span>{found.text} {stickyGroup ? `in ${stickyGroup}` : ''}</span>
                    <span style="font-size:70%;color:gray;line-heigth:50%;">Board: {found.state.name}</span>
                </div>
                </sl-menu-item>
            {/each}
        {/if}
        {#if foundBoards.length>0}
            {#if foundStickies.length> 0}<sl-divider></sl-divider>{/if}
            <sl-menu-label>Boards</sl-menu-label>
            {#each foundBoards as found}
                <sl-menu-item
                    on:mousedown={(e)=>{
                        if (encodeHashToBase64(found.hash) != $activeHashB64) {
                            selectBoard(found.hash)
                        }
                        clearSearch()
                    }}
                >
                <div style="margin-left:10px;">
                    {found.state.name} 
                </div>
                </sl-menu-item>
            {/each}
        {/if}
    </sl-menu>
    {/if}
</div>

</div>
<style>
.search {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
}
.search-results {
    position: absolute;
    z-index: 10;
    box-shadow: 0px 0px 20px rgba(0, 0, 0, .15);
}
sl-input::part(base) {
    color: rgba(95, 90, 83, 1.0);
    background-color: rgba(215, 203, 193, .1);
    border: none;
    border-radius: 5px;
    background-color: transparent;
}

sl-input::part(input) {
    color: rgba(95, 90, 83, 1.0);
    font-family: "Figtree", sans-serif;
}
</style>