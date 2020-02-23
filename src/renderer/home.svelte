<Page>
  <h1>Hello World</h1>
</Page>
<script>
  import { onMount } from 'svelte';
  import { f7, f7ready, Page } from 'framework7-svelte';

  function onClick() {
    // Safe to use without f7ready
    f7.dialog.alert('Clicked!');
  }

  onMount(() => {
    f7ready(() => {
      // Framework7 initialized
      // f7.dialog.alert('Hello world');
    })
  })
</script>