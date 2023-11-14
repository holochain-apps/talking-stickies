<script lang="ts">
    import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
    let dialog
    export const open = ()=>{dialog.show()}
</script>


<sl-dialog label="TalkingStickies!: UI v0.5.0 for DNA v0.4.x" bind:this={dialog} width={600} >
    <div class="about">
        <p>TalkingStickies! is a demonstration Holochain app built by the Holochain Foundation.</p>
        <p> <b>Developers:</b>
            Check out this hApp's source-code <a href="https://github.com/holochain-apps/talking-stickies">in our github repo</a>.
            This project's real-time syncronization is powered by <a href="https://github.com/holochain/syn">Syn</a>, 
            a library that makes it really easy to build this kind of real-time collaboaration into Holochain apps.
        </p>
    <p class="small">Copyright © 2023 Holochain Foundation.  This software is distributed under the MIT License</p>
    </div>
</sl-dialog>

<style>
    .about {
        background-color: white;
    }
    .about p {

        margin-bottom:10px;
     }
     .small {
        font-size: 80%;
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
  