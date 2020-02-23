<script>
import {onMount} from 'svelte';
import {
  f7,
  f7ready, 
  Page, 
  Button,
  Block,
  Treeview, TreeviewItem
} from 'framework7-svelte';
export let db;

let session_list = [];

onMount(()=>{
  f7ready(()=>{
    session_list = db.find({}, (err, docs)=>{
      session_list = docs;
    });
  })
})
</script>
<style>

</style>
<Page>

  <Treeview>
    <TreeviewItem selectable itemToggle>
      <img src="./img/s_host.png" slot="media" alt="Session Icon">
      <b slot="label" class="text-color-blue">Session Name</b>
      <TreeviewItem selectable itemToggle label="Database Name">
        <img src="./img/database.png" slot="media" alt="Database Icon">
        <TreeviewItem label="Table Name" toggle={false}>
          <img src="./img/designer/table.png" slot="media" alt="Table Icon">
        </TreeviewItem>
      </TreeviewItem>
    </TreeviewItem>
  </Treeview>

</Page>
