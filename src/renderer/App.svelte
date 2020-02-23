<!-- App.svelte -->
<!-- Main Framework7 App component where we pass Framework7 params -->
<App params={f7params}>
  <Appbar themeDark>
    <div class="left">
      <Button small class="display-flex" fill>New Session</Button>
      <!-- <Button small class="display-flex margin-left-half">New Database</Button> -->
    </div>
    <div class="right">
      <Button small class="display-flex" fill color="teal">Donate</Button>
    </div>
  </Appbar>
  <Panel left cover visibleBreakpoint="800" resizable>
    <View>
      <Session db={Database.SessionDB}></Session>
    </View>
  </Panel>
  <!-- initial page is specified in routes.js -->
  <View main url="/" />
</App>
<style lang="scss" global>
@import "./css/style.scss";
</style>
<script>
import {onMount} from 'svelte';
import {
  f7, f7ready, App, View , Panel, Navbar, Block, Page, Appbar, Button,
  Toolbar, Link
} from 'framework7-svelte';
import Session from './components/Session.svelte';
import Database from './database.js';

import Home from './home.svelte';

const f7params = {
  // Array with app routes
  routes: [
    {
      path: '/',
      component: Home
    }
  ],
  // App Name
  name: 'Jengkol DB',
  // App id
  id: 'gaibz.jengkoldb',
  // ...
  theme:"aurora",
  autoDarkTheme:false
};

onMount(() => {
  f7ready(() => {
    // Call F7 APIs here
  });
})

</script>